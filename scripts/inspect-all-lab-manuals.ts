import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import { db } from "../src/db";
import { resources, vtuDiscoveredResources } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const labRows = await db
    .select({
      id: resources.id,
      title: resources.title,
      fileUrl: resources.fileUrl,
      fileName: resources.fileName,
      fileSize: resources.fileSize,
      createdAt: resources.createdAt,
    })
    .from(resources)
    .where(eq(resources.resourceType, "LAB_MANUAL"));

  console.log(`Total LAB_MANUAL rows in 'resources' table: ${labRows.length}`);
  
  // Group by fileUrl pattern
  const urls: Record<string, number> = {};
  for (const r of labRows) {
    const prefix = r.fileUrl.startsWith("/") ? r.fileUrl.split("/")[1] : "external";
    urls[prefix] = (urls[prefix] || 0) + 1;
  }
  console.log("File URL distribution:", urls);

  // Check specific resource from screenshot: 35fe424f-be1d-403f-b138-176085ce3100
  const [specific] = await db
    .select()
    .from(resources)
    .where(eq(resources.id, "35fe424f-be1d-403f-b138-176085ce3100"));
  console.log("\nResource from user screenshot (35fe424f-be1d-403f-b138-176085ce3100):", specific);

  // Check public/vtu-official-labs
  const labsDir = path.join(process.cwd(), "public", "vtu-official-labs");
  if (fs.existsSync(labsDir)) {
    const files = fs.readdirSync(labsDir);
    console.log(`\nFiles in public/vtu-official-labs: ${files.length}`);
    console.log("Sample files:", files.slice(0, 10));
  }

  // Also check if any other generated files exist in public or scripts
  const [discLabs] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(vtuDiscoveredResources)
    .where(eq(vtuDiscoveredResources.category, "LAB_MANUAL"));
  console.log(`\nDiscovered lab manuals in vtuDiscoveredResources: ${discLabs.count}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

