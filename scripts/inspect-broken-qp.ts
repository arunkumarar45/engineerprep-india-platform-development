import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import { db } from "../src/db";
import { resources, subjects } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const [row] = await db
    .select({
      id: resources.id,
      title: resources.title,
      fileName: resources.fileName,
      fileUrl: resources.fileUrl,
      resourceType: resources.resourceType,
      subjectCode: subjects.code,
      subjectName: subjects.name,
    })
    .from(resources)
    .leftJoin(subjects, eq(resources.subjectId, subjects.id))
    .where(eq(resources.id, "0a860c69-329a-4aff-9573-0c3ced646b43"));

  console.log("Resource 0a860c69-329a-4aff-9573-0c3ced646b43:");
  console.log(row);
  process.exit(0);
}

main().catch(console.error);

