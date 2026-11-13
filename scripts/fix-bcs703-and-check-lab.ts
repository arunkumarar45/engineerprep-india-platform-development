import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import { db } from "@/db";
import { resources } from "@/db/schema";
import { eq, like, and, or } from "drizzle-orm";

async function main() {
  // Fix BCS703 records that still use the full Sem7 PDF
  console.log("=== Fixing BCS703 Cryptography Syllabus Records ===");
  
  // Find BCS703 records pointing to wrong file
  const wrongBcs703 = await db.select({
    id: resources.id,
    title: resources.title,
    fileUrl: resources.fileUrl
  }).from(resources).where(
    and(
      eq(resources.resourceType, "SYLLABUS"),
      like(resources.title, "%BCS703%"),
      like(resources.fileUrl, "%VTU-Official-2022-CSE-Sem7-Syllabus.pdf%")
    )
  );
  
  console.log(`Found ${wrongBcs703.length} BCS703 records with wrong PDF`);
  
  for (const record of wrongBcs703) {
    await db.update(resources)
      .set({ fileUrl: "/vtu-official-syllabus/VTU-Official-BCS703-Cryptography-Syllabus.pdf" })
      .where(eq(resources.id, record.id));
    console.log(`  Fixed: ${record.id} - ${record.title.substring(0, 60)}`);
  }
  
  // Also fix any BCS701 IoT records pointing to wrong file
  const wrongBcs701 = await db.select({
    id: resources.id,
    title: resources.title,
    fileUrl: resources.fileUrl
  }).from(resources).where(
    and(
      eq(resources.resourceType, "SYLLABUS"),
      like(resources.title, "%BCS701%"),
      like(resources.fileUrl, "%VTU-Official-2022-CSE-Sem7-Syllabus.pdf%")
    )
  );
  
  console.log(`\nFound ${wrongBcs701.length} BCS701 records with Sem7 combined PDF`);
  for (const record of wrongBcs701) {
    await db.update(resources)
      .set({ fileUrl: "/vtu-official-syllabus/VTU-Official-BCS701-IoT-Syllabus.pdf" })
      .where(eq(resources.id, record.id));
    console.log(`  Fixed BCS701: ${record.id} - ${record.title.substring(0, 60)}`);
  }

  // Also fix BCS702 Parallel Computing if pointing to wrong file
  const wrongBcs702 = await db.select({
    id: resources.id,
    title: resources.title,
    fileUrl: resources.fileUrl
  }).from(resources).where(
    and(
      eq(resources.resourceType, "SYLLABUS"),
      like(resources.title, "%BCS702%"),
      like(resources.fileUrl, "%VTU-Official-2022-CSE-Sem7-Syllabus.pdf%")
    )
  );
  
  console.log(`\nFound ${wrongBcs702.length} BCS702 records with Sem7 combined PDF`);
  for (const record of wrongBcs702) {
    await db.update(resources)
      .set({ fileUrl: "/vtu-official-syllabus/VTU-Official-BCS702-Parallel-Computing-Syllabus.pdf" })
      .where(eq(resources.id, record.id));
    console.log(`  Fixed BCS702: ${record.id} - ${record.title.substring(0, 60)}`);
  }

  // Check BISL657A specific record
  console.log("\n=== Checking specific LAB MANUAL record 35fe424f ===");
  const labRecord = await db.select().from(resources).where(eq(resources.id, "35fe424f-be1d-403f-b138-176085ce3100"));
  console.log(JSON.stringify(labRecord, null, 2));

  // Final verification
  console.log("\n=== Final BCS703 state ===");
  const finalBcs703 = await db.select({ id: resources.id, title: resources.title, fileUrl: resources.fileUrl }).from(resources).where(
    and(eq(resources.resourceType, "SYLLABUS"), like(resources.title, "%BCS703%"))
  );
  for (const r of finalBcs703) {
    console.log(`  ${r.id}: ${r.fileUrl}`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

