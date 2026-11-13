/**
 * Fix syllabus mapping — assign correct official VTU syllabus PDFs to subjects.
 *
 * The problem: ALL 847 syllabus resources have the same fileUrl
 * pointing to BPOPS103 programming-in-C syllabus PDF.
 *
 * Fix strategy:
 *  1. Query all subjects with their branch, semester, scheme info.
 *  2. For each subject's syllabus record, assign the correct semester-level syllabus PDF.
 *  3. Local syllabus files in /public/vtu-official-syllabus/ are used.
 *  4. If no matching file, the subject-level PDF from the official VTU scheme document is used.
 *
 * Available official syllabus PDFs (from /public/vtu-official-syllabus/):
 */
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import fs from "node:fs";
import path from "node:path";
import { db } from "@/db";
import { resources, subjects, schemes, semesters, branches } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

const PUBLIC_DIR = path.join(process.cwd(), "public", "vtu-official-syllabus");

async function main() {
  // List available syllabus files
  const availableFiles = fs.existsSync(PUBLIC_DIR)
    ? fs.readdirSync(PUBLIC_DIR).filter(f => f.endsWith(".pdf"))
    : [];
  console.log(`Available syllabus PDFs (${availableFiles.length}):`);
  for (const f of availableFiles) console.log("  " + f);

  // Get all syllabus resources with subject info
  const syllabuses = await db
    .select({
      resourceId: resources.id,
      resourceTitle: resources.title,
      currentUrl: resources.fileUrl,
      subjectId: subjects.id,
      subjectCode: subjects.code,
      subjectName: subjects.name,
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
    .where(eq(resources.resourceType, "SYLLABUS"))
    .orderBy(branches.code, semesters.number, subjects.code);

  console.log(`\nTotal syllabus resources: ${syllabuses.length}`);

  // Understand what's available
  const urlCounts: Record<string, number> = {};
  for (const s of syllabuses) {
    const u = s.currentUrl ?? "null";
    urlCounts[u] = (urlCounts[u] ?? 0) + 1;
  }
  console.log("\nCurrent URL distribution:");
  for (const [url, count] of Object.entries(urlCounts).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`  ${count}x: ${url}`);
  }

  // Build a mapping from (branch, scheme, semester) -> best matching PDF
  // Available files:
  //   VTU-Official-2022-CSE-Sem3-4-Syllabus.pdf
  //   VTU-Official-2022-CSE-Sem7-Syllabus.pdf
  //   VTU-Official-2022-BPOPS103-Programming-in-C-Syllabus.pdf
  //   VTU-Official-2022-ISE-Sem5-6-Syllabus.pdf (if exists)
  //   etc.

  const fileMapping: Record<string, string> = {};
  for (const f of availableFiles) {
    fileMapping[f] = `/vtu-official-syllabus/${f}`;
  }

  console.log("\nFile mapping:");
  for (const [k, v] of Object.entries(fileMapping)) console.log(`  ${k} -> ${v}`);

  // Create a smart assignment:
  // Find which PDF file best matches a given subject
  function getBestSyllabusUrl(
    branchCode: string | null,
    schemeName: string | null,
    semNum: number | null,
    subjectCode: string | null
  ): string | null {
    // Try subject-code specific first
    if (subjectCode) {
      const specific = availableFiles.find(
        f => f.toLowerCase().includes(subjectCode.toLowerCase())
      );
      if (specific) return fileMapping[specific];
    }

    // Try branch+semester-level match
    if (branchCode && semNum) {
      const semGroup = semNum <= 2 ? "1-2" : semNum <= 4 ? "3-4" : semNum <= 6 ? "5-6" : "7-8";
      const semAlt = `Sem${semNum}`;
      const branchMatch = availableFiles.find(f =>
        f.toLowerCase().includes(branchCode.toLowerCase()) &&
        (f.includes(semGroup) || f.includes(semAlt))
      );
      if (branchMatch) return fileMapping[branchMatch];
    }

    // Try scheme + semester-level
    if (schemeName && semNum) {
      const year = schemeName.replace(/[^0-9]/g, "");
      const semGroup = semNum <= 2 ? "1-2" : semNum <= 4 ? "3-4" : semNum <= 6 ? "5-6" : "7-8";
      const semAlt = `Sem${semNum}`;
      const schemeMatch = availableFiles.find(f =>
        f.includes(year) &&
        (f.includes(semGroup) || f.includes(semAlt))
      );
      if (schemeMatch) return fileMapping[schemeMatch];
    }

    // Fall back to any matching semester
    if (semNum) {
      const semGroup = semNum <= 2 ? "Sem1" : semNum <= 4 ? "Sem3" : semNum <= 6 ? "Sem5" : "Sem7";
      const semMatch = availableFiles.find(f => f.includes(semGroup));
      if (semMatch) return fileMapping[semMatch];
    }

    // Absolute fallback: use the first available file that is a comprehensive scheme document
    const comprehensive = availableFiles.find(f => !f.includes("BPOPS103") && f.includes("2022"));
    if (comprehensive) return fileMapping[comprehensive];

    return availableFiles.length > 0 ? fileMapping[availableFiles[0]] : null;
  }

  // Analyze what updates would be made
  let sameUrl = 0;
  let differentUrl = 0;
  const updates: Array<{ id: string; newUrl: string; oldUrl: string; subject: string }> = [];

  for (const s of syllabuses) {
    const newUrl = getBestSyllabusUrl(s.branchCode, s.schemeName, s.semesterNum, s.subjectCode);
    if (!newUrl) continue;
    if (newUrl !== s.currentUrl) {
      updates.push({ id: s.resourceId, newUrl, oldUrl: s.currentUrl ?? "", subject: `${s.subjectCode} ${s.subjectName}` });
      differentUrl++;
    } else {
      sameUrl++;
    }
  }

  console.log(`\nWould update: ${differentUrl} records`);
  console.log(`Already correct: ${sameUrl} records`);

  if (updates.length > 0) {
    console.log("\nSample updates (first 10):");
    for (const u of updates.slice(0, 10)) {
      console.log(`  ${u.subject}`);
      console.log(`    OLD: ${u.oldUrl}`);
      console.log(`    NEW: ${u.newUrl}`);
    }
  }

  // Show what unique URLs we'd assign
  const newUrlSet = new Set(updates.map(u => u.newUrl));
  console.log(`\nDistinct new URLs: ${newUrlSet.size}`);
  for (const u of newUrlSet) console.log("  " + u);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

