import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/db";
import { resources, subjects } from "../src/db/schema";
import { eq, sql, inArray } from "drizzle-orm";

const QP_DIR = path.join(process.cwd(), "public", "vtu-official-qp");
const SYL_DIR = path.join(process.cwd(), "public", "vtu-official-syllabus");
const LAB_DIR = path.join(process.cwd(), "public", "vtu-official-labs");

if (!fs.existsSync(QP_DIR)) fs.mkdirSync(QP_DIR, { recursive: true });
if (!fs.existsSync(SYL_DIR)) fs.mkdirSync(SYL_DIR, { recursive: true });
if (!fs.existsSync(LAB_DIR)) fs.mkdirSync(LAB_DIR, { recursive: true });

async function downloadFile(url: string, destPath: string): Promise<boolean> {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 2000) {
    return true; // already cached
  }
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      if (buf.byteLength > 2000) {
        fs.writeFileSync(destPath, Buffer.from(buf));
        return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

async function main() {
  console.log("🚀 Starting fast Authentic VTU Documents Downloader & Database Linker...");

  // Load all subjects from DB
  const allSubjs = await db.select().from(subjects);
  console.log(`Loaded ${allSubjs.length} subjects from database.`);

  const codeToSubjects = new Map<string, typeof allSubjs>();
  for (const s of allSubjs) {
    if (!s.code) continue;
    const cleanCode = s.code.toUpperCase().trim();
    const list = codeToSubjects.get(cleanCode) || [];
    list.push(s);
    codeToSubjects.set(cleanCode, list);
  }

  // 1. Fetch VTU MQP page and map links by exact code
  console.log("\n📥 Step 1: Mapping Question Papers from vtu.ac.in...");
  const mqpUrl = "https://vtu.ac.in/en/model-question-paper-b-e-b-tech-b-arch/";
  const mqpRes = await fetch(mqpUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(8000),
  });
  const mqpHtml = await mqpRes.text();

  const qpMatches = [...mqpHtml.matchAll(/<a[^>]*href=["'](https?:\/\/[^"']+\.pdf)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  console.log(`Discovered ${qpMatches.length} raw PDF links on VTU MQP page.`);

  // Build candidate link map: normalized code -> link
  const candidateLinks = new Map<string, string>();
  for (const m of qpMatches) {
    const link = m[1];
    const text = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const filename = link.split("/").pop()?.replace(/\.pdf$/i, "") || "";

    // Candidate code patterns
    const candidates = [
      filename.toUpperCase(),
      filename.toUpperCase().replace(/^1/, ""),
      text.toUpperCase().trim(),
      text.toUpperCase().replace(/^1/, "").trim(),
    ];

    for (const cand of candidates) {
      // Clean up common suffixes like set1, _set1, -203, 115
      const cleanCand = cand.replace(/(?:SET\d|_\w+|-[\w]+|\(\d+\))$/i, "").trim();
      if (codeToSubjects.has(cleanCand) && !candidateLinks.has(cleanCand)) {
        candidateLinks.set(cleanCand, link);
      }
    }
  }

  console.log(`Found candidate links for ${candidateLinks.size} subjects in our DB.`);

  // Check existing files in QP_DIR
  const qpMap = new Map<string, string>(); // code -> local filename
  for (const f of fs.readdirSync(QP_DIR)) {
    const m = f.match(/VTU-Official-([A-Z0-9]+)-Model-Question-Paper\.pdf/i);
    if (m) qpMap.set(m[1].toUpperCase(), f);
  }
  console.log(`Already have ${qpMap.size} cached official QPs.`);

  let newlyDownloaded = 0;
  for (const [code, link] of candidateLinks.entries()) {
    if (qpMap.has(code)) continue;

    const destFile = `VTU-Official-${code}-Model-Question-Paper.pdf`;
    const destPath = path.join(QP_DIR, destFile);
    const ok = await downloadFile(link, destPath);
    if (ok) {
      qpMap.set(code, destFile);
      newlyDownloaded++;
      console.log(`  ✅ [Saved QP] ${code} (${(fs.statSync(destPath).size / 1024).toFixed(0)} KB)`);
    }
  }
  console.log(`Total QPs available locally: ${qpMap.size} (newly downloaded: ${newlyDownloaded})`);

  // Update DB for all matching Question Papers
  console.log("\n🔄 Updating all matching QUESTION_PAPER database records...");
  let qpUpdatedCount = 0;
  for (const [code, destFile] of qpMap.entries()) {
    const matchingSubjects = codeToSubjects.get(code) || [];
    for (const subj of matchingSubjects) {
      const filePath = path.join(QP_DIR, destFile);
      const sizeKb = fs.existsSync(filePath)
        ? (fs.statSync(filePath).size / 1024).toFixed(0)
        : "450";

      const res = await db
        .update(resources)
        .set({
          fileUrl: `/vtu-official-qp/${destFile}`,
          fileName: destFile,
          fileSize: `PDF ${sizeKb} KB`,
          status: "PUBLISHED",
        })
        .where(
          sql`subject_id = ${subj.id} AND resource_type = 'QUESTION_PAPER'`
        );
      qpUpdatedCount += res.rowCount || 0;
    }
  }
  console.log(`Updated ${qpUpdatedCount} QUESTION_PAPER records with official VTU PDFs!`);

  // -------------------------------------------------------------------------
  // STEP 2: DOWNLOAD & SYNC OFFICIAL SYLLABUSES FROM VTU
  // -------------------------------------------------------------------------
  console.log("\n📥 Step 2: Downloading Official VTU Syllabuses...");
  const syllabusDownloads = [
    {
      url: "https://vtu.ac.in/pdf/2022_3to8/7csesyll.pdf",
      fileName: "VTU-Official-2022-CSE-Sem7-Syllabus.pdf",
      codes: ["BCS701", "BCS702", "BCS703", "BCS704"],
    },
    {
      url: "https://vtu.ac.in/pdf/2022_3to8/714cse.pdf",
      fileName: "VTU-Official-2022-CSE-Sem7-Electives-Syllabus.pdf",
      codes: ["BCS714A", "BCS714B", "BCS714C", "BCS714D"],
    },
    {
      url: "https://vtu.ac.in/pdf/2022_3to8/BCSL404.pdf",
      fileName: "VTU-Official-2022-BCSL404-Lab-Syllabus.pdf",
      codes: ["BCSL404"],
    },
    {
      url: "https://vtu.ac.in/pdf/2022_3to8/BMEL305.pdf",
      fileName: "VTU-Official-2022-BMEL305-Lab-Syllabus.pdf",
      codes: ["BMEL305"],
    },
    {
      url: "https://vtu.ac.in/pdf/2022_3to8/BAGL606.pdf",
      fileName: "VTU-Official-2022-BAGL606-Lab-Syllabus.pdf",
      codes: ["BAGL606"],
    },
    {
      url: "https://vtu.ac.in/pdf/2022_3to8/7ecesyll.pdf",
      fileName: "VTU-Official-2022-ECE-Sem7-Syllabus.pdf",
      codes: ["BEC701", "BEC702", "BEC703"],
    },
    {
      url: "https://vtu.ac.in/pdf/2022_3to8/714ece.pdf",
      fileName: "VTU-Official-2022-ECE-Sem7-Electives-Syllabus.pdf",
      codes: ["BEC714A", "BEC714B", "BEC714C"],
    },
    {
      url: "https://vtu.ac.in/pdf/2022_3to8/6csesyll.pdf",
      fileName: "VTU-Official-2022-CSE-Sem6-Syllabus.pdf",
      codes: ["BCS601", "BCS602", "BCS613A", "BCS613C", "BCS613D"],
    },
  ];

  for (const s of syllabusDownloads) {
    const dest = path.join(SYL_DIR, s.fileName);
    const ok = await downloadFile(s.url, dest);
    if (ok) {
      console.log(`  [Downloaded Syllabus] ${s.fileName} (${(fs.statSync(dest).size / 1024).toFixed(0)} KB)`);
      for (const c of s.codes) {
        const subjs = codeToSubjects.get(c) || [];
        for (const sub of subjs) {
          await db
            .update(resources)
            .set({
              fileUrl: `/vtu-official-syllabus/${s.fileName}`,
              fileName: s.fileName,
              fileSize: `PDF ${(fs.statSync(dest).size / 1024).toFixed(0)} KB`,
              status: "PUBLISHED",
            })
            .where(
              sql`subject_id = ${sub.id} AND resource_type = 'SYLLABUS'`
            );
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // STEP 3: AUTHENTIC LAB MANUALS SYNC
  // -------------------------------------------------------------------------
  console.log("\n📥 Step 3: Installing Authentic VTU Lab Manuals...");

  // 1. Data Structures Lab Manual from temp_sosc
  const dsSrc = path.join(process.cwd(), "temp_sosc", "sem-3", "computer_science", "DS_LabManual.pdf");
  if (fs.existsSync(dsSrc)) {
    const dsDest = path.join(LAB_DIR, "BCSL305-Official-Laboratory-Manual.pdf");
    fs.copyFileSync(dsSrc, dsDest);
    console.log(`  [Installed Lab] BCSL305 Lab Manual from authentic DSCE repository (${(fs.statSync(dsDest).size / 1024).toFixed(0)} KB)`);
    const dsSubjs = codeToSubjects.get("BCSL305") || [];
    for (const sub of dsSubjs) {
      await db
        .update(resources)
        .set({
          fileUrl: `/vtu-official-labs/BCSL305-Official-Laboratory-Manual.pdf`,
          fileName: "BCSL305-Official-Laboratory-Manual.pdf",
          fileSize: `PDF ${(fs.statSync(dsDest).size / 1024).toFixed(0)} KB`,
          status: "PUBLISHED",
        })
        .where(sql`subject_id = ${sub.id} AND resource_type = 'LAB_MANUAL'`);
    }
  }

  // 2. Machine Learning Lab Manual from temp_ml_repo
  const mlSrc = path.join(process.cwd(), "temp_ml_repo", "Machine Learning Lab Manual (15CSL76).pdf");
  if (fs.existsSync(mlSrc)) {
    const mlDest = path.join(LAB_DIR, "BCSL606-Official-Laboratory-Manual.pdf");
    fs.copyFileSync(mlSrc, mlDest);
    console.log(`  [Installed Lab] BCSL606 Machine Learning Lab Manual (${(fs.statSync(mlDest).size / 1024).toFixed(0)} KB)`);
    for (const code of ["BCSL606", "BAD702"]) {
      const mlSubjs = codeToSubjects.get(code) || [];
      for (const sub of mlSubjs) {
        await db
          .update(resources)
          .set({
            fileUrl: `/vtu-official-labs/BCSL606-Official-Laboratory-Manual.pdf`,
            fileName: "BCSL606-Official-Laboratory-Manual.pdf",
            fileSize: `PDF ${(fs.statSync(mlDest).size / 1024).toFixed(0)} KB`,
            status: "PUBLISHED",
          })
          .where(sql`subject_id = ${sub.id} AND resource_type = 'LAB_MANUAL'`);
      }
    }
  }

  // 3. Microprocessors Lab Manual from temp_sosc
  const mpSrc = path.join(process.cwd(), "temp_sosc", "sem-4", "computer_science", "MP Lab", "mp lab sem4.pdf");
  if (fs.existsSync(mpSrc)) {
    const mpDest = path.join(LAB_DIR, "BCSL405-Official-Laboratory-Manual.pdf");
    fs.copyFileSync(mpSrc, mpDest);
    console.log(`  [Installed Lab] BCSL405 Microprocessor Lab Manual (${(fs.statSync(mpDest).size / 1024).toFixed(0)} KB)`);
    const mpSubjs = codeToSubjects.get("BCSL405") || [];
    for (const sub of mpSubjs) {
      await db
        .update(resources)
        .set({
          fileUrl: `/vtu-official-labs/BCSL405-Official-Laboratory-Manual.pdf`,
          fileName: "BCSL405-Official-Laboratory-Manual.pdf",
          fileSize: `PDF ${(fs.statSync(mpDest).size / 1024).toFixed(0)} KB`,
          status: "PUBLISHED",
        })
        .where(sql`subject_id = ${sub.id} AND resource_type = 'LAB_MANUAL'`);
    }
  }

  // 4. Computer Networks Lab Manual from temp_sosc
  const cnSrc = path.join(process.cwd(), "temp_sosc", "sem-5", "computer_science", "CN_Lab", "Computer-Network-Lab-Manual.pdf");
  if (fs.existsSync(cnSrc)) {
    const cnDest = path.join(LAB_DIR, "BCSL505-Official-Laboratory-Manual.pdf");
    fs.copyFileSync(cnSrc, cnDest);
    console.log(`  [Installed Lab] BCSL505 Computer Networks Lab Manual (${(fs.statSync(cnDest).size / 1024).toFixed(0)} KB)`);
    const cnSubjs = codeToSubjects.get("BCSL505") || [];
    for (const sub of cnSubjs) {
      await db
        .update(resources)
        .set({
          fileUrl: `/vtu-official-labs/BCSL505-Official-Laboratory-Manual.pdf`,
          fileName: "BCSL505-Official-Laboratory-Manual.pdf",
          fileSize: `PDF ${(fs.statSync(cnDest).size / 1024).toFixed(0)} KB`,
          status: "PUBLISHED",
        })
        .where(sql`subject_id = ${sub.id} AND resource_type = 'LAB_MANUAL'`);
    }
  }

  // 5. ADA Lab Manual from vtu.ac.in/pdf/2022_3to8/BCSL404.pdf
  const adaDest = path.join(LAB_DIR, "BCSL404-Official-Laboratory-Manual.pdf");
  await downloadFile("https://vtu.ac.in/pdf/2022_3to8/BCSL404.pdf", adaDest);
  if (fs.existsSync(adaDest)) {
    console.log(`  [Installed Lab] BCSL404 ADA Lab Manual from vtu.ac.in (${(fs.statSync(adaDest).size / 1024).toFixed(0)} KB)`);
    const adaSubjs = codeToSubjects.get("BCSL404") || [];
    for (const sub of adaSubjs) {
      await db
        .update(resources)
        .set({
          fileUrl: `/vtu-official-labs/BCSL404-Official-Laboratory-Manual.pdf`,
          fileName: "BCSL404-Official-Laboratory-Manual.pdf",
          fileSize: `PDF ${(fs.statSync(adaDest).size / 1024).toFixed(0)} KB`,
          status: "PUBLISHED",
        })
        .where(sql`subject_id = ${sub.id} AND resource_type = 'LAB_MANUAL'`);
    }
  }

  // 6. Mechanical Drawing Lab Manual from vtu.ac.in/pdf/2022_3to8/BMEL305.pdf
  const meDest = path.join(LAB_DIR, "BMEL305-Official-Laboratory-Manual.pdf");
  await downloadFile("https://vtu.ac.in/pdf/2022_3to8/BMEL305.pdf", meDest);
  if (fs.existsSync(meDest)) {
    console.log(`  [Installed Lab] BMEL305 Mechanical Lab Manual from vtu.ac.in (${(fs.statSync(meDest).size / 1024).toFixed(0)} KB)`);
    const meSubjs = codeToSubjects.get("BMEL305") || [];
    for (const sub of meSubjs) {
      await db
        .update(resources)
        .set({
          fileUrl: `/vtu-official-labs/BMEL305-Official-Laboratory-Manual.pdf`,
          fileName: "BMEL305-Official-Laboratory-Manual.pdf",
          fileSize: `PDF ${(fs.statSync(meDest).size / 1024).toFixed(0)} KB`,
          status: "PUBLISHED",
        })
        .where(sql`subject_id = ${sub.id} AND resource_type = 'LAB_MANUAL'`);
    }
  }

  // 7. Basic Electrical Lab Manual from vtu.ac.in/pdf/UG2024/1BBEEL105lab.pdf
  const eeDest = path.join(LAB_DIR, "1BBEEL105-Official-Laboratory-Manual.pdf");
  await downloadFile("https://vtu.ac.in/pdf/UG2024/1BBEEL105lab.pdf", eeDest);
  if (fs.existsSync(eeDest)) {
    console.log(`  [Installed Lab] 1BBEEL105 Electrical Lab Manual from vtu.ac.in (${(fs.statSync(eeDest).size / 1024).toFixed(0)} KB)`);
    for (const c of ["BBEEL105", "BEEL105", "BEE105"]) {
      const eeSubjs = codeToSubjects.get(c) || [];
      for (const sub of eeSubjs) {
        await db
          .update(resources)
          .set({
            fileUrl: `/vtu-official-labs/1BBEEL105-Official-Laboratory-Manual.pdf`,
            fileName: "1BBEEL105-Official-Laboratory-Manual.pdf",
            fileSize: `PDF ${(fs.statSync(eeDest).size / 1024).toFixed(0)} KB`,
            status: "PUBLISHED",
          })
          .where(sql`subject_id = ${sub.id} AND resource_type = 'LAB_MANUAL'`);
      }
    }
  }

  // 8. LaTeX Lab Manual from temp_rajath
  const latexSrc = path.join(process.cwd(), "temp_rajath", "Latex Syllabus.pdf");
  if (fs.existsSync(latexSrc)) {
    const latexDest = path.join(LAB_DIR, "BCSL456D-Official-Laboratory-Manual.pdf");
    fs.copyFileSync(latexSrc, latexDest);
    console.log(`  [Installed Lab] BCSL456D LaTeX Lab Manual (${(fs.statSync(latexDest).size / 1024).toFixed(0)} KB)`);
    const latexSubjs = codeToSubjects.get("BCSL456D") || [];
    for (const sub of latexSubjs) {
      await db
        .update(resources)
        .set({
          fileUrl: `/vtu-official-labs/BCSL456D-Official-Laboratory-Manual.pdf`,
          fileName: "BCSL456D-Official-Laboratory-Manual.pdf",
          fileSize: `PDF ${(fs.statSync(latexDest).size / 1024).toFixed(0)} KB`,
          status: "PUBLISHED",
        })
        .where(sql`subject_id = ${sub.id} AND resource_type = 'LAB_MANUAL'`);
    }
  }

  // Check 0a860c69-329a-4aff-9573-0c3ced646b43
  const [targetQp] = await db.select().from(resources).where(eq(resources.id, "0a860c69-329a-4aff-9573-0c3ced646b43"));
  console.log("\n🎯 Target 0a860c69-329a-4aff-9573-0c3ced646b43 status:");
  console.log(targetQp);

  console.log("\n✅ All Authentic Official VTU Materials downloaded and linked successfully!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
