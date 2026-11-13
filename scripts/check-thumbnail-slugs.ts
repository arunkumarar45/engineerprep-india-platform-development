import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import { db } from "@/db";
import { sql } from "drizzle-orm";

async function main() {
  const sheets = await db.execute(sql`SELECT slug, thumbnail_url FROM dsa_sheets`);
  console.log("=== DSA SHEETS ===");
  for (const row of sheets.rows) console.log(JSON.stringify(row));

  const playlists = await db.execute(sql`SELECT slug, thumbnail_url FROM playlists LIMIT 20`);
  console.log("=== PLAYLISTS ===");
  for (const row of playlists.rows) console.log(JSON.stringify(row));

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });

