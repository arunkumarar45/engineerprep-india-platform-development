import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import { db } from "../src/db";
import { resources, downloads, bookmarks, vtuDiscoveredResources } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";

async function main() {
  console.log("=== DELETING ALL UPLOADED / GENERATED LAB MANUALS ===");

  // 1. Check current lab manual rows
  const labRows = await db
    .select({ id: resources.id, title: resources.title, fileUrl: resources.fileUrl })
    .from(resources)
    .where(eq(resources.resourceType, "LAB_MANUAL"));

  console.log(`Found ${labRows.length} LAB_MANUAL rows in database.`);

  const labIds = labRows.map((r) => r.id);

  if (labIds.length > 0) {
    // 2. Delete associated downloads
    const delDownloads = await db.execute(sql`
      DELETE FROM downloads 
      WHERE resource_id IN (SELECT id FROM resources WHERE resource_type = 'LAB_MANUAL');
    `);
    console.log(`Deleted associated downloads rows:`, delDownloads.rowCount);

    // 3. Delete associated bookmarks
    const delBookmarks = await db.execute(sql`
      DELETE FROM bookmarks 
      WHERE kind = 'RESOURCE' 
      AND ref_id IN (SELECT id FROM resources WHERE resource_type = 'LAB_MANUAL');
    `);
    console.log(`Deleted associated bookmarks rows:`, delBookmarks.rowCount);

    // 4. Clear any reference in vtuDiscoveredResources
    await db.execute(sql`
      UPDATE vtu_discovered_resources 
      SET uploaded_resource_id = NULL, is_uploaded = false 
      WHERE uploaded_resource_id IN (SELECT id FROM resources WHERE resource_type = 'LAB_MANUAL');
    `);
    console.log(`Cleared references in vtu_discovered_resources.`);

    // 5. Delete from resources table
    const delResources = await db.execute(sql`
      DELETE FROM resources 
      WHERE resource_type = 'LAB_MANUAL';
    `);
    console.log(`Successfully deleted ${delResources.rowCount} LAB_MANUAL rows from resources table!`);
  }

  // 6. Delete all files in public/vtu-official-labs
  const labsDir = path.join(process.cwd(), "public", "vtu-official-labs");
  if (fs.existsSync(labsDir)) {
    const files = fs.readdirSync(labsDir);
    console.log(`\nDeleting ${files.length} files from ${labsDir}...`);
    for (const f of files) {
      fs.unlinkSync(path.join(labsDir, f));
    }
    console.log(`Cleared all files from public/vtu-official-labs.`);
  }

  // 7. Remove generate-official-pdfs.ts script to prevent synthetic generation
  const genScript = path.join(process.cwd(), "scripts", "generate-official-pdfs.ts");
  if (fs.existsSync(genScript)) {
    fs.unlinkSync(genScript);
    console.log(`Deleted generator script: scripts/generate-official-pdfs.ts`);
  }

  // 8. Verify post-deletion counts
  console.log("\n=== VERIFYING DATABASE COUNTS AFTER DELETION ===");
  const counts = await db.execute(sql`
    SELECT resource_type, count(*)::int as count 
    FROM resources 
    GROUP BY resource_type 
    ORDER BY resource_type;
  `);
  console.log("Current resource counts by type:");
  for (const row of counts.rows) {
    console.log(`  - ${row.resource_type}: ${row.count}`);
  }

  const [notesRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(resources)
    .where(eq(resources.resourceType, "NOTES"));

  const [labsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(resources)
    .where(eq(resources.resourceType, "LAB_MANUAL"));

  console.log(`\nNotes Count: ${notesRow.count} (MUST BE 4112)`);
  console.log(`Lab Manuals Count: ${labsRow.count} (MUST BE 0)`);

  if (notesRow.count === 4112 && labsRow.count === 0) {
    console.log("\nSUCCESS: All uploaded lab manuals deleted. Notes remain 100% untouched!");
  } else {
    console.error("\nWARNING: Unexpected count mismatch!");
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Deletion error:", err);
  process.exit(1);
});

