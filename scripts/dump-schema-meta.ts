import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import { db, pool } from "../src/db";
import { sql } from "drizzle-orm";

async function inspectSchema() {
  // Get all columns with data type and is_nullable
  const cols = await db.execute(sql`
    SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);

  // Get all unique constraints
  const uniques = await db.execute(sql`
    SELECT tc.table_name, kcu.column_name, tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `);

  // Get all indexes
  const idxs = await db.execute(sql`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `);

  // Write out as JSON for comprehensive inspection
  const fs = await import("fs");
  fs.writeFileSync("scripts/schema_columns.json", JSON.stringify(cols.rows, null, 2));
  fs.writeFileSync("scripts/schema_uniques.json", JSON.stringify(uniques.rows, null, 2));
  fs.writeFileSync("scripts/schema_indexes.json", JSON.stringify(idxs.rows, null, 2));
  console.log("Schema dumped to scripts/schema_*.json");

  await pool.end();
}

inspectSchema().catch(console.error);
