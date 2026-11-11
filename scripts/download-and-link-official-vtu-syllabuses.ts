import fs from "fs";
import path from "path";
import "dotenv/config";
import { db } from "../src/db";
import { resources, subjects, branches, semesters, schemes } from "../src/db/schema";
import { eq, and, sql } from "drizzle-orm";

interface OfficialPdfDef {
  key: string;
  url: string;
  localFile: string;
  branchCode: string;
  semesters: number[];
  displayName: string;
}

const OFFICIAL_VTU_PDFS: OfficialPdfDef[] = [
  // First Year Common Cycles
  {
    key: "MAT1",
    url: "https://vtu.ac.in/pdf/2022syll/BMATS101.pdf",
    localFile: "VTU-Official-2022-BMATS101-Maths1-Syllabus.pdf",
    branchCode: "ALL",
    semesters: [1],
    displayName: "Mathematics-I (BMATS101) Official VTU Syllabus Copy"
  },
  {
    key: "PHY",
    url: "https://vtu.ac.in/pdf/2022syll/BPHYS102.pdf",
    localFile: "VTU-Official-2022-BPHYS102-Physics-Syllabus.pdf",
    branchCode: "ALL",
    semesters: [1],
    displayName: "Applied Physics (BPHYS102) Official VTU Syllabus Copy"
  },
  {
    key: "POP",
    url: "https://vtu.ac.in/pdf/2022syll/BPOPS103.pdf",
    localFile: "VTU-Official-2022-BPOPS103-Programming-in-C-Syllabus.pdf",
    branchCode: "ALL",
    semesters: [1],
    displayName: "Principles of Programming Using C (BPOPS103) Official VTU Syllabus Copy"
  },
  {
    key: "MAT2",
    url: "https://vtu.ac.in/pdf/2022syll/BMATC201.pdf",
    localFile: "VTU-Official-2022-BMATC201-Maths2-Syllabus.pdf",
    branchCode: "ALL",
    semesters: [2],
    displayName: "Mathematics-II (BMATC201) Official VTU Syllabus Copy"
  },
  {
    key: "CHE",
    url: "https://vtu.ac.in/pdf/2022syll/BCHEM102.pdf",
    localFile: "VTU-Official-2022-BCHEM102-Chemistry-Syllabus.pdf",
    branchCode: "ALL",
    semesters: [2],
    displayName: "Applied Chemistry (BCHEM102) Official VTU Syllabus Copy"
  },

  // ECE
  {
    key: "ECE_7",
    url: "https://vtu.ac.in/pdf/2022_3to8/7ecesyll.pdf",
    localFile: "VTU-Official-2022-ECE-Sem7-Syllabus-BEC701.pdf",
    branchCode: "ECE",
    semesters: [7, 8],
    displayName: "ECE 7th & 8th Semester (BEC701-BEC755) Official VTU Syllabus Copy"
  },
  {
    key: "ECE_6",
    url: "https://vtu.ac.in/pdf/2022_3to8/6ecesyll.pdf",
    localFile: "VTU-Official-2022-ECE-Sem6-Syllabus.pdf",
    branchCode: "ECE",
    semesters: [6],
    displayName: "ECE 6th Semester Official VTU Syllabus Copy"
  },
  {
    key: "ECE_5",
    url: "https://vtu.ac.in/pdf/2022_3to8/3ecesyll.pdf",
    localFile: "VTU-Official-2022-ECE-Sem5-Syllabus.pdf",
    branchCode: "ECE",
    semesters: [5],
    displayName: "ECE 5th Semester Official VTU Syllabus Copy"
  },
  {
    key: "ECE_3_4",
    url: "https://vtu.ac.in/pdf/2022_3to8/2ecesyll.pdf",
    localFile: "VTU-Official-2022-ECE-Sem3-4-Syllabus.pdf",
    branchCode: "ECE",
    semesters: [3, 4],
    displayName: "ECE 3rd & 4th Semester Official VTU Syllabus Copy"
  },

  // CSE
  {
    key: "CSE_7",
    url: "https://vtu.ac.in/pdf/2022_3to8/7cssyll.pdf",
    localFile: "VTU-Official-2022-CSE-Sem7-Syllabus-BCS701.pdf",
    branchCode: "CSE",
    semesters: [7, 8],
    displayName: "CSE 7th & 8th Semester (BCS701-BCS714) Official VTU Syllabus Copy"
  },
  {
    key: "CSE_6",
    url: "https://vtu.ac.in/pdf/2022_3to8/6cssyll.pdf",
    localFile: "VTU-Official-2022-CSE-Sem6-Syllabus.pdf",
    branchCode: "CSE",
    semesters: [6],
    displayName: "CSE 6th Semester Official VTU Syllabus Copy"
  },
  {
    key: "CSE_5",
    url: "https://vtu.ac.in/pdf/2022_3to8/3cssyll.pdf",
    localFile: "VTU-Official-2022-CSE-Sem5-Syllabus.pdf",
    branchCode: "CSE",
    semesters: [5],
    displayName: "CSE 5th Semester Official VTU Syllabus Copy"
  },
  {
    key: "CSE_3_4",
    url: "https://vtu.ac.in/pdf/2022_3to8/2cssyll.pdf",
    localFile: "VTU-Official-2022-CSE-Sem3-4-Syllabus.pdf",
    branchCode: "CSE",
    semesters: [3, 4],
    displayName: "CSE 3rd & 4th Semester Official VTU Syllabus Copy"
  },

  // ISE
  {
    key: "ISE_7",
    url: "https://vtu.ac.in/pdf/2022_3to8/7issyll.pdf",
    localFile: "VTU-Official-2022-ISE-Sem7-Syllabus-BIS701.pdf",
    branchCode: "ISE",
    semesters: [7, 8],
    displayName: "ISE 7th & 8th Semester (BIS701-BIS714) Official VTU Syllabus Copy"
  },
  {
    key: "ISE_6",
    url: "https://vtu.ac.in/pdf/2022_3to8/6issyll.pdf",
    localFile: "VTU-Official-2022-ISE-Sem6-Syllabus.pdf",
    branchCode: "ISE",
    semesters: [6],
    displayName: "ISE 6th Semester Official VTU Syllabus Copy"
  },
  {
    key: "ISE_5",
    url: "https://vtu.ac.in/pdf/2022_3to8/3issyll.pdf",
    localFile: "VTU-Official-2022-ISE-Sem5-Syllabus.pdf",
    branchCode: "ISE",
    semesters: [5],
    displayName: "ISE 5th Semester Official VTU Syllabus Copy"
  },
  {
    key: "ISE_3_4",
    url: "https://vtu.ac.in/pdf/2022_3to8/2issyll.pdf",
    localFile: "VTU-Official-2022-ISE-Sem3-4-Syllabus.pdf",
    branchCode: "ISE",
    semesters: [3, 4],
    displayName: "ISE 3rd & 4th Semester Official VTU Syllabus Copy"
  },

  // CIV
  {
    key: "CIV_7",
    url: "https://vtu.ac.in/wp-content/uploads/2026/08/4civsyll.pdf",
    localFile: "VTU-Official-2022-CIV-Sem7-Syllabus-BCV701.pdf",
    branchCode: "CIV",
    semesters: [7, 8],
    displayName: "Civil Engineering 7th & 8th Sem (BCV701) Official VTU Syllabus Copy"
  },
  {
    key: "CIV_5",
    url: "https://vtu.ac.in/pdf/2022_3to8/3civsyll.pdf",
    localFile: "VTU-Official-2022-CIV-Sem5-Syllabus.pdf",
    branchCode: "CIV",
    semesters: [5, 6],
    displayName: "Civil Engineering 5th & 6th Sem Official VTU Syllabus Copy"
  },
  {
    key: "CIV_3_4",
    url: "https://vtu.ac.in/pdf/2022_3to8/2civsyll.pdf",
    localFile: "VTU-Official-2022-CIV-Sem3-4-Syllabus.pdf",
    branchCode: "CIV",
    semesters: [3, 4],
    displayName: "Civil Engineering 3rd & 4th Sem Official VTU Syllabus Copy"
  },

  // EEE
  {
    key: "EEE_7",
    url: "https://vtu.ac.in/pdf/2022_3to8/4eesyll.pdf",
    localFile: "VTU-Official-2022-EEE-Sem7-Syllabus-BEE701.pdf",
    branchCode: "EEE",
    semesters: [7, 8],
    displayName: "EEE 7th & 8th Semester (BEE701) Official VTU Syllabus Copy"
  },
  {
    key: "EEE_5",
    url: "https://vtu.ac.in/pdf/2022_3to8/3eesyll.pdf",
    localFile: "VTU-Official-2022-EEE-Sem5-Syllabus.pdf",
    branchCode: "EEE",
    semesters: [5, 6],
    displayName: "EEE 5th & 6th Semester Official VTU Syllabus Copy"
  },
  {
    key: "EEE_3_4",
    url: "https://vtu.ac.in/pdf/2022_3to8/2eesyll.pdf",
    localFile: "VTU-Official-2022-EEE-Sem3-4-Syllabus.pdf",
    branchCode: "EEE",
    semesters: [3, 4],
    displayName: "EEE 3rd & 4th Semester Official VTU Syllabus Copy"
  },

  // ME
  {
    key: "ME_7",
    url: "https://vtu.ac.in/pdf/2022_3to8/4mecsyll.pdf",
    localFile: "VTU-Official-2022-ME-Sem7-Syllabus-BME701.pdf",
    branchCode: "ME",
    semesters: [7, 8],
    displayName: "Mechanical 7th & 8th Sem (BME701) Official VTU Syllabus Copy"
  },
  {
    key: "ME_5",
    url: "https://vtu.ac.in/pdf/2022_3to8/3mecsyll.pdf",
    localFile: "VTU-Official-2022-ME-Sem5-Syllabus.pdf",
    branchCode: "ME",
    semesters: [5, 6],
    displayName: "Mechanical 5th & 6th Sem Official VTU Syllabus Copy"
  },
  {
    key: "ME_3_4",
    url: "https://vtu.ac.in/pdf/2022_3to8/2mecsyll.pdf",
    localFile: "VTU-Official-2022-ME-Sem3-4-Syllabus.pdf",
    branchCode: "ME",
    semesters: [3, 4],
    displayName: "Mechanical 3rd & 4th Sem Official VTU Syllabus Copy"
  },
];

async function main() {
  console.log("📥 DOWNLOADING OFFICIAL VTU SYLLABUS PDFS FROM VTU.AC.IN...\n");

  const outDir = path.join(process.cwd(), "public", "vtu-official-syllabus");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const downloadedMap = new Map<string, { filePath: string; relativeUrl: string; sizeStr: string }>();

  for (const def of OFFICIAL_VTU_PDFS) {
    const targetPath = path.join(outDir, def.localFile);
    const relativeUrl = `/vtu-official-syllabus/${def.localFile}`;

    // Download if not already downloaded or if file size is 0
    if (!fs.existsSync(targetPath) || fs.statSync(targetPath).size === 0) {
      console.log(`Fetching [${def.key}] ${def.url}...`);
      try {
        const res = await fetch(def.url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          fs.writeFileSync(targetPath, Buffer.from(buffer));
          const sizeKb = (buffer.byteLength / 1024).toFixed(0);
          const sizeMb = (buffer.byteLength / (1024 * 1024)).toFixed(1);
          const sizeStr = buffer.byteLength > 1024 * 1024 ? `PDF ${sizeMb} MB` : `PDF ${sizeKb} KB`;
          console.log(`  ✅ Saved ${def.localFile} (${sizeStr})`);
          downloadedMap.set(def.key, { filePath: targetPath, relativeUrl, sizeStr });
        } else {
          console.warn(`  ⚠️ Failed to fetch ${def.url} (Status: ${res.status})`);
        }
      } catch (e: any) {
        console.warn(`  ⚠️ Error fetching ${def.url}: ${e.message}`);
      }
    } else {
      const stats = fs.statSync(targetPath);
      const sizeMb = (stats.size / (1024 * 1024)).toFixed(1);
      const sizeStr = `PDF ${sizeMb} MB`;
      console.log(`  ✓ Already downloaded: ${def.localFile} (${sizeStr})`);
      downloadedMap.set(def.key, { filePath: targetPath, relativeUrl, sizeStr });
    }
  }

  console.log("\n🔄 LINKING OFFICIAL VTU SYLLABUS PDFS IN DATABASE...");

  const allBranches = await db.select().from(branches);
  const allSemesters = await db.select().from(semesters);

  const branchMap = new Map(allBranches.map(b => [b.code, b.id]));
  const semMap = new Map(allSemesters.map(s => [s.number, s.id]));

  let updatedCount = 0;

  for (const def of OFFICIAL_VTU_PDFS) {
    const downloaded = downloadedMap.get(def.key);
    if (!downloaded) continue;

    for (const semNum of def.semesters) {
      const semId = semMap.get(semNum);
      if (!semId) continue;

      const targetBranchCodes = def.branchCode === "ALL" 
        ? ["CSE", "ISE", "ECE", "EEE", "ME", "CIV"] 
        : [def.branchCode];

      for (const bCode of targetBranchCodes) {
        const bId = branchMap.get(bCode);
        if (!bId) continue;

        // Find all subjects for this branch and semester
        const branchSubjects = await db
          .select({ id: subjects.id, code: subjects.code, name: subjects.name })
          .from(subjects)
          .where(and(eq(subjects.branchId, bId), eq(subjects.semesterId, semId)));

        for (const sub of branchSubjects) {
          // Update all SYLLABUS resources for this subject
          const updateRes = await db
            .update(resources)
            .set({
              fileUrl: downloaded.relativeUrl,
              fileName: `${sub.code}-Official-VTU-Syllabus.pdf`,
              fileSize: downloaded.sizeStr,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(resources.subjectId, sub.id),
                eq(resources.resourceType, "SYLLABUS")
              )
            );
          
          updatedCount++;
        }
      }
    }
  }

  console.log(`\n🎉 Successfully linked ${updatedCount} syllabus records to official VTU PDFs!`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

