import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import { db } from "@/db";
import { dsaSheets } from "@/db/schema";

async function main() {
  const sheets = await db.select().from(dsaSheets);
  for (const s of sheets) {
    console.log(`${s.slug}: thumbnailUrl=${s.thumbnailUrl}, author=${s.author}, title=${s.title}`);
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
