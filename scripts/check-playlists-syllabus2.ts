import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import { db } from "@/db";
import { playlists, resources } from "@/db/schema";
import { like, and, eq } from "drizzle-orm";

async function main() {
  const allPlaylists = await db.select({ id: playlists.id, slug: playlists.slug, thumbnailUrl: playlists.thumbnailUrl, title: playlists.title }).from(playlists);
  console.log("=== PLAYLISTS ===");
  for (const p of allPlaylists) {
    console.log(`  slug=${p.slug} thumbnailUrl=${p.thumbnailUrl}`);
  }
  console.log("Total:", allPlaylists.length);

  // Check BCS703 by title search
  const bcs703Title = await db.select({ id: resources.id, subjectCode: resources.subjectCode, title: resources.title, fileUrl: resources.fileUrl }).from(resources).where(
    and(eq(resources.resourceType, "SYLLABUS"), like(resources.title, "%BCS703%"))
  );
  console.log("\n=== BCS703 SYLLABUS by title ===");
  for (const s of bcs703Title) {
    console.log(`  id=${s.id} subjectCode=${s.subjectCode}`);
    console.log(`  title=${s.title}`);
    console.log(`  fileUrl=${s.fileUrl}`);
  }

  // Also check Cryptography syllabus
  const crypto = await db.select({ id: resources.id, subjectCode: resources.subjectCode, title: resources.title, fileUrl: resources.fileUrl }).from(resources).where(
    and(eq(resources.resourceType, "SYLLABUS"), like(resources.title, "%Cryptography%"))
  );
  console.log("\n=== Cryptography SYLLABUS ===");
  for (const s of crypto) {
    console.log(`  id=${s.id} subjectCode=${s.subjectCode}`);
    console.log(`  title=${s.title.substring(0, 80)}`);
    console.log(`  fileUrl=${s.fileUrl}`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

