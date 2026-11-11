import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("=== Inspecting Tables ===");
  const tables = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%dsa%' OR table_name LIKE '%playlist%';
  `);
  console.log("Tables found:", tables.rows);

  // Check columns of dsa_sheets
  const sheetCols = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'dsa_sheets';
  `);
  console.log("\ndsa_sheets columns:", sheetCols.rows);

  // Query all dsa_sheets
  const sheets = await db.execute(sql`SELECT * FROM dsa_sheets;`);
  console.log(`\nFound ${sheets.rows.length} DSA Sheets:`);
  for (const s of sheets.rows) {
    console.log(`  - [${s.id}] "${s.title}" by ${s.creator} (Problems: ${s.total_problems || s.problem_count}, Slug: ${s.slug})`);
  }

  // Check playlists table
  const playlistCols = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'playlists';
  `);
  console.log("\nplaylists columns:", playlistCols.rows);

  const playlists = await db.execute(sql`SELECT * FROM playlists;`);
  console.log(`\nFound ${playlists.rows.length} Playlists:`);
  for (const p of playlists.rows) {
    console.log(`  - [${p.id}] "${p.title}" by ${p.creator || p.channel_title} (URL: ${p.url || p.youtube_url})`);
  }

  process.exit(0);
}
main();

