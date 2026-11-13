import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import { db, pool } from "../src/db";
import { sql } from "drizzle-orm";

async function runDetailedAudit() {
  console.log("=== DETAILED DATABASE INSPECTION ===");

  // 1. Resources Breakdown by URL Type
  const resourceUrlTypes = await db.execute(sql`
    SELECT 
      resource_type, 
      count(*)::int as total,
      SUM(CASE WHEN file_url = '' OR file_url IS NULL THEN 1 ELSE 0 END)::int as empty_url,
      SUM(CASE WHEN file_url LIKE 'http%' THEN 1 ELSE 0 END)::int as http_url,
      SUM(CASE WHEN file_url LIKE '/%' THEN 1 ELSE 0 END)::int as local_url,
      SUM(CASE WHEN file_url NOT LIKE 'http%' AND file_url NOT LIKE '/%' AND file_url != '' AND file_url IS NOT NULL THEN 1 ELSE 0 END)::int as other_url
    FROM resources
    GROUP BY resource_type
    ORDER BY total DESC;
  `);
  console.log("\n--- Resource URL Types by Resource Type ---");
  console.table(resourceUrlTypes.rows);

  // 2. Resources with NULL subject_id
  const orphanResource = await db.execute(sql`
    SELECT id, title, file_name, resource_type, file_url 
    FROM resources 
    WHERE subject_id IS NULL;
  `);
  console.log("\n--- Resources with NULL subject_id ---");
  console.table(orphanResource.rows);

  // 3. Subjects statistics
  const subjectStats = await db.execute(sql`
    SELECT 
      COUNT(*)::int as total_subjects,
      SUM(CASE WHEN branch_id IS NULL THEN 1 ELSE 0 END)::int as null_branch,
      SUM(CASE WHEN semester_id IS NULL THEN 1 ELSE 0 END)::int as null_sem,
      SUM(CASE WHEN scheme_id IS NULL THEN 1 ELSE 0 END)::int as null_scheme,
      COUNT(DISTINCT code)::int as unique_codes
    FROM subjects;
  `);
  console.log("\n--- Subjects Null & Unique Checks ---");
  console.table(subjectStats.rows);

  // 4. Duplicate subject codes across same branch/sem/scheme or across table
  const dupSubjectCodes = await db.execute(sql`
    SELECT code, COUNT(*)::int as count 
    FROM subjects 
    GROUP BY code 
    HAVING COUNT(*) > 1 
    ORDER BY count DESC 
    LIMIT 10;
  `);
  console.log("\n--- Duplicate Subject Codes in DB ---");
  console.table(dupSubjectCodes.rows);

  // 5. VTU Discovered Resources Details
  const discoveredDetails = await db.execute(sql`
    SELECT 
      category, 
      download_status, 
      validation_status, 
      approval_status, 
      is_uploaded,
      COUNT(*)::int as count
    FROM vtu_discovered_resources
    GROUP BY category, download_status, validation_status, approval_status, is_uploaded
    ORDER BY count DESC;
  `);
  console.log("\n--- VTU Discovered Resources Status Matrix ---");
  console.table(discoveredDetails.rows);

  // 6. Check foreign key definitions in PostgreSQL database
  const fkRes = await db.execute(sql`
    SELECT
      tc.table_name, 
      kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `);
  console.log(`\n--- DB Foreign Keys Count: ${fkRes.rows.length} ---`);

  // 7. Check indexes in DB
  const indexRes = await db.execute(sql`
    SELECT
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `);
  console.log(`--- DB Total Indexes Count: ${indexRes.rows.length} ---`);

  // 8. Check connection pool configuration in src/db/index.ts
  console.log("\nDetailed inspection done.");
  await pool.end();
}

runDetailedAudit().catch(err => {
  console.error("Error in detailed audit:", err);
  process.exit(1);
});
