import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import { db } from "../src/db";
import { resources, subjects } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";

async function main() {
  console.log("=== Inspecting Syllabus Records in Database ===");

  const syllabusRows = await db
    .select({
      id: resources.id,
      title: resources.title,
      fileUrl: resources.fileUrl,
      fileName: resources.fileName,
      subjectId: resources.subjectId,
    })
    .from(resources)
    .where(eq(resources.resourceType, "SYLLABUS"));

  console.log(`Total SYLLABUS records: ${syllabusRows.length}`);

  // Count occurrences of each fileUrl
  const fileUrlCounts: Record<string, number> = {};
  for (const row of syllabusRows) {
    fileUrlCounts[row.fileUrl] = (fileUrlCounts[row.fileUrl] || 0) + 1;
  }

  console.log("\nUnique fileUrl distribution for SYLLABUS:");
  for (const [url, count] of Object.entries(fileUrlCounts)) {
    console.log(`  - ${url}: ${count} subjects`);
  }

  // Check resource from user screenshot: 10596f60-f759-450d-8df7-463e175002ee
  const [target] = await db
    .select()
    .from(resources)
    .where(eq(resources.id, "10596f60-f759-450d-8df7-463e175002ee"));
  console.log("\nUser screenshot resource (10596f60-f759-450d-8df7-463e175002ee):", target);

  if (target?.subjectId) {
    const [subj] = await db.select().from(subjects).where(eq(subjects.id, target.subjectId));
    console.log("Target Subject:", subj);
  }

  // Check files in public/vtu-official-syllabus
  const sylDir = path.join(process.cwd(), "public", "vtu-official-syllabus");
  if (fs.existsSync(sylDir)) {
    const files = fs.readdirSync(sylDir);
    console.log(`\nFiles in public/vtu-official-syllabus (${files.length}):`);
    for (const f of files) {
      const stats = fs.statSync(path.join(sylDir, f));
      console.log(`  - ${f} (${(stats.size / 1024).toFixed(1)} KB)`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

