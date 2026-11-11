import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/db";
import { resources, subjects } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";
import { collectorEngine } from "../src/lib/vtu-collector";
import { validateLocalFile } from "../src/lib/vtu-collector/validator";

async function main() {
  console.log("=== Inspecting Downloaded Official Files & Validating Magic Bytes ===");
  
  const folders = [
    { folder: "public/vtu-official-qp", category: "QUESTION_PAPER" as const },
    { folder: "public/vtu-official-syllabus", category: "SYLLABUS" as const },
    { folder: "public/vtu-official-labs", category: "LAB_MANUAL" as const },
    { folder: "public/vtu-official-important-questions", category: "ASSIGNMENT" as const },
  ];

  for (const { folder, category } of folders) {
    const fullPath = path.join(process.cwd(), folder);
    if (!fs.existsSync(fullPath)) {
      console.log(`[${folder}] Not found`);
      continue;
    }
    const files = fs.readdirSync(fullPath).filter((f) => f.endsWith(".pdf"));
    console.log(`\n[${category}] ${folder}: ${files.length} PDF files found.`);
    
    let validCount = 0;
    for (const file of files.slice(0, 5)) {
      const filePath = path.join(fullPath, file);
      const val = validateLocalFile(filePath, category, file);
      if (val.isValid) validCount++;
      console.log(`  - ${file}: Size=${val.fileSizeHuman}, Hash=${val.fileHash.slice(0, 8)}..., Valid=${val.isValid}`);
    }
  }

  console.log("\n=== Checking Database Notes Count (Must Be Exactly 4112) ===");
  const [notesRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(resources)
    .where(eq(resources.resourceType, "NOTES"));
  console.log(`Existing Notes Count: ${notesRow.count} (Strictly Untouched)`);

  console.log("\n=== Running Collector Engine Stats Test ===");
  const stats = await collectorEngine.getStats();
  console.log("Live Resources by Category:", stats.liveResources);
  console.log("Discovered by Category:", stats.discovered.byCategory);

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

