import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import { db } from "../src/db";
import { resources, subjects, branches, semesters, schemes } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

async function main() {
  console.log("=== Comprehensive Analysis of Syllabus in Database ===");

  const rows = await db
    .select({
      resourceId: resources.id,
      title: resources.title,
      fileUrl: resources.fileUrl,
      fileName: resources.fileName,
      subjectId: subjects.id,
      subjectCode: subjects.code,
      subjectName: subjects.name,
      branchCode: branches.code,
      semesterNumber: semesters.number,
      schemeName: schemes.name,
    })
    .from(resources)
    .leftJoin(subjects, eq(resources.subjectId, subjects.id))
    .leftJoin(branches, eq(subjects.branchId, branches.id))
    .leftJoin(semesters, eq(subjects.semesterId, semesters.id))
    .leftJoin(schemes, eq(subjects.schemeId, schemes.id))
    .where(eq(resources.resourceType, "SYLLABUS"));

  console.log(`Total Syllabus rows: ${rows.length}`);

  // Count how many have mismatch between subjectCode and fileName
  let matchingFile = 0;
  let genericSemesterBundle = 0;
  let completelyWrong = 0;

  const bcs703Rows = rows.filter(r => r.subjectCode === "BCS703");
  console.log("\nAll BCS703 Syllabus rows:", bcs703Rows);

  const sem7Rows = rows.filter(r => r.semesterNumber === 7 && r.branchCode === "CSE");
  console.log(`\nCSE Semester 7 Syllabus rows (${sem7Rows.length}):`);
  for (const r of sem7Rows) {
    console.log(`  - [${r.subjectCode}] ${r.subjectName} -> ${r.fileUrl}`);
  }

  process.exit(0);
}
main();

