import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import { db } from "../src/db";
import { resources, subjects } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

async function main() {
  const [bcs703] = await db.select().from(subjects).where(eq(subjects.code, "BCS703"));
  if (bcs703) {
    const res = await db
      .update(resources)
      .set({
        fileUrl: "/vtu-official-qp/VTU-Official-BCS703-Question-Paper.pdf",
        fileName: "VTU-Official-BCS703-Question-Paper.pdf",
        fileSize: "PDF 92 KB",
        status: "PUBLISHED",
      })
      .where(sql`subject_id = ${bcs703.id} AND resource_type = 'QUESTION_PAPER'`);
    console.log(`Updated ${res.rowCount} BCS703 question paper rows!`);
  }

  const [row] = await db.select().from(resources).where(eq(resources.id, "4309e78a-a1cd-44b5-a78b-111b1f50d5cf"));
  console.log("Updated 4309e78a-a1cd-44b5-a78b-111b1f50d5cf:", row);
  process.exit(0);
}
main();

