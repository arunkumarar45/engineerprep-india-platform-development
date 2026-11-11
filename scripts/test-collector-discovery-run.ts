import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import { db } from "../src/db";
import { vtuDiscoveredResources, vtuCollectionJobs } from "../src/db/schema";
import { collectorEngine } from "../src/lib/vtu-collector";
import { count } from "drizzle-orm";

async function main() {
  console.log("=== Testing VTU Collector Discovery Execution ===");

  const job = await collectorEngine.createJob("DISCOVERY", undefined, "ALL", {});
  console.log(`Created Discovery Job: ${job.id}`);

  const result = await collectorEngine.runDiscovery(job.id, {});
  console.log("Discovery Run Completed:", result);

  const [totalDiscovered] = await db
    .select({ count: count() })
    .from(vtuDiscoveredResources);

  console.log(`Total Discovered Resources in Queue: ${totalDiscovered.count}`);

  const sample = await db
    .select()
    .from(vtuDiscoveredResources)
    .limit(5);

  console.log("\nSample Discovered Items:");
  for (const item of sample) {
    console.log(`- [${item.category}] ${item.title} (Source: ${item.sourceWebsite}, URL: ${item.originalFileUrl.slice(0, 60)}...)`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Discovery test error:", err);
  process.exit(1);
});

