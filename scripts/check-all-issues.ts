import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import { db } from "@/db";
import { resources, dsaSheets, dsaPlaylists } from "@/db/schema";
import { eq, like, and } from "drizzle-orm";

async function main() {
  // Check lab manuals
  const labManuals = await db.select().from(resources).where(eq(resources.resourceType, "LAB_MANUAL"));
  console.log("=== LAB MANUALS ===");
  for (const lm of labManuals) {
    console.log(`  id=${lm.id} subjectCode=${lm.subjectCode} title=${lm.title}`);
    console.log(`    fileUrl=${lm.fileUrl}`);
  }
  console.log("Total lab manuals:", labManuals.length);

  // Check BCS703
  const bcs703 = await db.select().from(resources).where(
    and(eq(resources.resourceType, "SYLLABUS"), eq(resources.subjectCode, "BCS703"))
  );
  console.log("\n=== BCS703 SYLLABUS ===");
  for (const s of bcs703) {
    console.log(`  id=${s.id} title=${s.title}`);
    console.log(`    fileUrl=${s.fileUrl}`);
  }

  // Count QPs with drive links
  const qpDriveAll = await db.select().from(resources).where(
    and(eq(resources.resourceType, "QUESTION_PAPER"), like(resources.fileUrl, "%drive.google.com%"))
  );
  console.log("\n=== QP DRIVE LINKS ===");
  console.log("Total QPs with drive links:", qpDriveAll.length);
  if (qpDriveAll.length > 0) {
    console.log("Sample 5:");
    for (const q of qpDriveAll.slice(0, 5)) {
      console.log(`  id=${q.id} title=${q.title}`);
      console.log(`    fileUrl=${q.fileUrl}`);
    }
  }

  // DSA sheets
  const sheets = await db.select().from(dsaSheets);
  console.log("\n=== DSA SHEETS ===");
  for (const s of sheets) {
    console.log(`  slug=${s.slug} thumbnailUrl=${s.thumbnailUrl}`);
  }

  // DSA playlists
  const playlists = await db.select().from(dsaPlaylists);
  console.log("\n=== DSA PLAYLISTS ===");
  for (const p of playlists) {
    console.log(`  slug=${p.slug} thumbnailUrl=${p.thumbnailUrl}`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

