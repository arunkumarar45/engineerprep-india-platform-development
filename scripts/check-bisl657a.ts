import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import { db } from "@/db";
import { resources } from "@/db/schema";
import { eq, like, and, or } from "drizzle-orm";

async function main() {
  // Search for BISL657A anywhere
  const bisl = await db.select({ id: resources.id, resourceType: resources.resourceType, title: resources.title, fileUrl: resources.fileUrl }).from(resources).where(
    or(
      like(resources.title, "%BISL657A%"),
      like(resources.fileUrl, "%BISL657A%"),
      like(resources.subjectCode, "%BISL657A%")
    )
  );
  console.log("BISL657A records:", JSON.stringify(bisl, null, 2));

  // Check if any files exist with BISL657A
  const labManuals = await db.select({ id: resources.id, title: resources.title, fileUrl: resources.fileUrl }).from(resources).where(eq(resources.resourceType, "LAB_MANUAL"));
  console.log("\n=== Current LAB_MANUAL records ===");
  for (const lm of labManuals) {
    console.log(`id=${lm.id}`);
    console.log(`title=${lm.title}`);
    console.log(`fileUrl=${lm.fileUrl}\n`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

