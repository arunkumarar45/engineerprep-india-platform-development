/**
 * Fix syllabus mapping — assign the correct official VTU syllabus PDF to each subject.
 *
 * Strategy:
 *  1. Subject-code exact match (e.g., BCS703 → VTU-Official-BCS703-Cryptography-Syllabus.pdf)
 *  2. Branch + Semester scheme document (e.g., CSE Sem7 → VTU-Official-2022-CSE-Sem7-Syllabus.pdf)
 *  3. Only use branch+semester level documents — NEVER assign a wrong-branch document.
 *
 * Key rule: If no exact subject or correct branch/sem PDF exists, leave the existing URL.
 * Do NOT replace a "close" syllabus with an unrelated one.
 */
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import { db } from "@/db";
import { resources, subjects, schemes, semesters, branches } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Map: subject code prefix → specific PDF file
const SUBJECT_CODE_MAP: Record<string, string> = {
  BCS701: "VTU-Official-BCS701-IoT-Syllabus.pdf",
  BCS702: "VTU-Official-BCS702-Parallel-Computing-Syllabus.pdf",
  BCS703: "VTU-Official-BCS703-Cryptography-Syllabus.pdf",
  BCS714A: "VTU-Official-BCS714A-Deep-Learning-Syllabus.pdf",
  BCS714B: "VTU-Official-BCS714B-NLP-Syllabus.pdf",
  BCS714D: "VTU-Official-BCS714D-Big-Data-Analytics-Syllabus.pdf",
  BCS755A: "VTU-Official-BCS755A-DBMS-Syllabus.pdf",
  BCS755B: "VTU-Official-BCS755B-Algorithms-Syllabus.pdf",
  BCS755C: "VTU-Official-BCS755C-Software-Engineering-Syllabus.pdf",
  BEC701: "VTU-Official-2022-ECE-Sem7-Syllabus-BEC701.pdf",
  BCSL404: "VTU-Official-2022-BCSL404-Lab-Syllabus.pdf",
  BCHEM102: "VTU-Official-2022-BCHEM102-Chemistry-Syllabus.pdf",
  BPHYS102: "VTU-Official-2022-BPHYS102-Physics-Syllabus.pdf",
  BMATS101: "VTU-Official-2022-BMATS101-Maths1-Syllabus.pdf",
  BMATC201: "VTU-Official-2022-BMATC201-Maths2-Syllabus.pdf",
  BPOPS103: "VTU-Official-2022-BPOPS103-Programming-in-C-Syllabus.pdf",
};

// Map: (branch, semGroup) → PDF file
// semGroup: "1-2", "3-4", "5", "6", "7"
const BRANCH_SEM_MAP: Record<string, string> = {
  "CSE-3-4": "VTU-Official-2022-CSE-Sem3-4-Syllabus.pdf",
  "CSE-5": "VTU-Official-2022-CSE-Sem5-Syllabus.pdf",
  "CSE-6": "VTU-Official-2022-CSE-Sem6-Syllabus.pdf",
  "CSE-7": "VTU-Official-2022-CSE-Sem7-Syllabus.pdf",
  "CSE-7-elective": "VTU-Official-2022-CSE-Sem7-Electives-Syllabus.pdf",
  "CSE-7-full": "VTU-Official-2022-CSE-Sem7-Full-Syllabus.pdf",
  "ISE-3-4": "VTU-Official-2022-ISE-Sem3-4-Syllabus.pdf",
  "ISE-5": "VTU-Official-2022-ISE-Sem5-Syllabus.pdf",
  "ISE-6": "VTU-Official-2022-ISE-Sem6-Syllabus.pdf",
  "ISE-7": "VTU-Official-2022-ISE-Sem7-Syllabus-BIS701.pdf",
  "ECE-3-4": "VTU-Official-2022-ECE-Sem3-4-Syllabus.pdf",
  "ECE-5": "VTU-Official-2022-ECE-Sem5-Syllabus.pdf",
  "ECE-6": "VTU-Official-2022-ECE-Sem6-Syllabus.pdf",
  "ECE-7": "VTU-Official-2022-ECE-Sem7-Syllabus.pdf",
  "EEE-3-4": "VTU-Official-2022-EEE-Sem3-4-Syllabus.pdf",
  "EEE-5": "VTU-Official-2022-EEE-Sem5-Syllabus.pdf",
  "EEE-7": "VTU-Official-2022-EEE-Sem7-Syllabus-BEE701.pdf",
  "ME-3-4": "VTU-Official-2022-ME-Sem3-4-Syllabus.pdf",
  "ME-5": "VTU-Official-2022-ME-Sem5-Syllabus.pdf",
  "ME-7": "VTU-Official-2022-ME-Sem7-Syllabus-BME701.pdf",
  "CIV-3-4": "VTU-Official-2022-CIV-Sem3-4-Syllabus.pdf",
  "CIV-5": "VTU-Official-2022-CIV-Sem5-Syllabus.pdf",
  "CIV-7": "VTU-Official-2022-CIV-Sem7-Syllabus-BCV701.pdf",
};

// Normalize branch code to key
function normalizeBranch(code: string | null): string | null {
  if (!code) return null;
  const upper = code.toUpperCase();
  if (upper.includes("CSE") || upper.includes("CS")) return "CSE";
  if (upper.includes("ISE") || upper.includes("IS")) return "ISE";
  if (upper.includes("ECE") || upper.includes("EC")) return "ECE";
  if (upper.includes("EEE") || upper.includes("EE")) return "EEE";
  if (upper.includes("MECH") || upper.includes("ME")) return "ME";
  if (upper.includes("CIV") || upper.includes("CV")) return "CIV";
  return null;
}

// Get semester group
function getSemGroup(semNum: number | null): string | null {
  if (!semNum) return null;
  if (semNum <= 2) return "1-2";
  if (semNum <= 4) return "3-4";
  if (semNum === 5) return "5";
  if (semNum === 6) return "6";
  if (semNum >= 7) return "7";
  return null;
}

function getBestUrl(
  subjectCode: string | null,
  branchCode: string | null,
  semNum: number | null
): string | null {
  // 1. Subject-code exact match
  if (subjectCode) {
    const upper = subjectCode.toUpperCase();
    for (const [code, file] of Object.entries(SUBJECT_CODE_MAP)) {
      if (upper === code || upper.startsWith(code)) {
        return `/vtu-official-syllabus/${file}`;
      }
    }
  }

  // 2. Branch + semester match
  const branch = normalizeBranch(branchCode);
  const semGroup = getSemGroup(semNum);
  if (branch && semGroup) {
    const key = `${branch}-${semGroup}`;
    if (BRANCH_SEM_MAP[key]) {
      return `/vtu-official-syllabus/${BRANCH_SEM_MAP[key]}`;
    }
  }

  // 3. No confident match — return null to leave existing
  return null;
}

async function main() {
  const syllabuses = await db
    .select({
      resourceId: resources.id,
      currentUrl: resources.fileUrl,
      subjectId: subjects.id,
      subjectCode: subjects.code,
      schemeId: schemes.id,
      schemeName: schemes.name,
      semesterNum: semesters.number,
      branchCode: branches.code,
    })
    .from(resources)
    .leftJoin(subjects, eq(resources.subjectId, subjects.id))
    .leftJoin(schemes, eq(subjects.schemeId, schemes.id))
    .leftJoin(semesters, eq(subjects.semesterId, semesters.id))
    .leftJoin(branches, eq(subjects.branchId, branches.id))
    .where(eq(resources.resourceType, "SYLLABUS"));

  console.log(`Total syllabus resources: ${syllabuses.length}`);

  let updated = 0;
  let noChange = 0;
  let noMatch = 0;

  for (const s of syllabuses) {
    const newUrl = getBestUrl(s.subjectCode, s.branchCode, s.semesterNum);

    if (!newUrl) {
      noMatch++;
      continue;
    }

    if (newUrl === s.currentUrl) {
      noChange++;
      continue;
    }

    // Apply update
    await db
      .update(resources)
      .set({ fileUrl: newUrl })
      .where(eq(resources.id, s.resourceId));
    updated++;
  }

  console.log(`\nResults:`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Already correct: ${noChange}`);
  console.log(`  No confident match (left unchanged): ${noMatch}`);

  // Verify: show new URL distribution
  const after = await db
    .select({ url: resources.fileUrl })
    .from(resources)
    .where(eq(resources.resourceType, "SYLLABUS"));

  const urlCounts: Record<string, number> = {};
  for (const a of after) {
    const u = a.url ?? "null";
    urlCounts[u] = (urlCounts[u] ?? 0) + 1;
  }
  console.log("\nNew URL distribution:");
  for (const [url, count] of Object.entries(urlCounts).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
    const file = url.split("/").pop() ?? url;
    console.log(`  ${count}x: ${file}`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

