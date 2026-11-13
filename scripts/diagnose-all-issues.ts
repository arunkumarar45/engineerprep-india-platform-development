/**
 * Diagnostic script — inspect current DB state for all resource types,
 * DSA sheets/playlists, and check for broken links.
 */
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import { db } from "@/db";
import { resources, dsaSheets, subjects, schemes, branches, semesters } from "@/db/schema";
import { sql, eq, and } from "drizzle-orm";

async function main() {
  console.log("\n=== RESOURCE TYPE COUNTS ===");
  const counts = await db
    .select({ type: resources.resourceType, count: sql<number>`count(*)::int` })
    .from(resources)
    .groupBy(resources.resourceType);
  for (const r of counts) console.log(`  ${r.type}: ${r.count}`);

  console.log("\n=== QUESTION PAPERS (first 10) ===");
  const qps = await db
    .select({ id: resources.id, title: resources.title, fileUrl: resources.fileUrl, fileName: resources.fileName })
    .from(resources)
    .where(eq(resources.resourceType, "QUESTION_PAPER"))
    .limit(10);
  for (const r of qps) {
    const url = r.fileUrl ?? "(null)";
    const urlType = url.startsWith("http") ? "EXTERNAL" : url.startsWith("/") ? "LOCAL" : "UNKNOWN";
    console.log(`  [${urlType}] ${r.title}`);
    console.log(`    URL: ${url.substring(0, 100)}`);
  }

  console.log("\n=== LAB MANUALS (first 10) ===");
  const labs = await db
    .select({ id: resources.id, title: resources.title, fileUrl: resources.fileUrl, fileName: resources.fileName })
    .from(resources)
    .where(eq(resources.resourceType, "LAB_MANUAL"))
    .limit(10);
  for (const r of labs) {
    const url = r.fileUrl ?? "(null)";
    const urlType = url.startsWith("http") ? "EXTERNAL" : url.startsWith("/") ? "LOCAL" : "UNKNOWN";
    console.log(`  [${urlType}] ${r.title}`);
    console.log(`    URL: ${url.substring(0, 100)}`);
  }

  console.log("\n=== SYLLABUSES (first 10) ===");
  const syllabuses = await db
    .select({ 
      id: resources.id, 
      title: resources.title, 
      fileUrl: resources.fileUrl,
      subjectId: resources.subjectId,
    })
    .from(resources)
    .where(eq(resources.resourceType, "SYLLABUS"))
    .limit(10);
  for (const r of syllabuses) {
    const url = r.fileUrl ?? "(null)";
    const urlType = url.startsWith("http") ? "EXTERNAL" : url.startsWith("/") ? "LOCAL" : "UNKNOWN";
    console.log(`  [${urlType}] ${r.title} | subjectId: ${r.subjectId ?? "null"}`);
    console.log(`    URL: ${url.substring(0, 100)}`);
  }

  console.log("\n=== DSA SHEETS (all) ===");
  const sheets = await db.select().from(dsaSheets).limit(20);
  for (const s of sheets) {
    console.log(`  ${s.title} | thumbnail: ${s.thumbnailUrl ?? "null"} | imageUrl: ${(s as any).imageUrl ?? "null"}`);
  }

  console.log("\n=== SUBJECTS SAMPLE (5) ===");
  const subjs = await db.select({ id: subjects.id, name: subjects.name, code: subjects.code }).from(subjects).limit(5);
  for (const s of subjs) console.log(`  ${s.code} | ${s.name} | id: ${s.id}`);

  console.log("\n=== DONE ===");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

