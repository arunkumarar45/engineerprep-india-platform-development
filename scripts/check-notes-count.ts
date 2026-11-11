import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import { db } from "../src/db";
import { resources } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

async function main() {
  const [notesRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(resources)
    .where(eq(resources.resourceType, "NOTES"));
  console.log(`VERIFICATION: Current Notes count in DB is ${notesRow.count}`);
  if (notesRow.count === 4112) {
    console.log("SUCCESS: Notes count is 100% untouched and preserved!");
  } else {
    console.error("FAIL: Notes count changed!");
    process.exit(1);
  }
  process.exit(0);
}
main();

