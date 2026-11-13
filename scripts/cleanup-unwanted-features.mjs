import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:Arun%40018@127.0.0.1:5432/engineerprep_db",
});

async function main() {
  console.log("=== STEP 1: CLEANING UP LAB MANUALS IN DATABASE ===");
  
  // 1. Delete downloads and bookmarks referencing LAB_MANUAL
  await pool.query("DELETE FROM downloads WHERE resource_id IN (SELECT id FROM resources WHERE resource_type = 'LAB_MANUAL')");
  await pool.query("DELETE FROM bookmarks WHERE kind = 'RESOURCE' AND ref_id IN (SELECT id FROM resources WHERE resource_type = 'LAB_MANUAL')");
  
  // 2. Clear any reference in vtu_discovered_resources
  await pool.query("UPDATE vtu_discovered_resources SET uploaded_resource_id = NULL, is_uploaded = false WHERE uploaded_resource_id IN (SELECT id FROM resources WHERE resource_type = 'LAB_MANUAL')");

  // 3. Delete LAB_MANUAL rows from resources table
  const delLabs = await pool.query("DELETE FROM resources WHERE resource_type = 'LAB_MANUAL'");
  console.log(`Deleted ${delLabs.rowCount} LAB_MANUAL rows from resources table.`);

  console.log("\n=== STEP 2: CLEANING UP AUTOMATICALLY FRAMED IMPORTANT QUESTIONS ===");

  // 1. Delete downloads and bookmarks referencing generated important questions
  await pool.query(`
    DELETE FROM downloads 
    WHERE resource_id IN (
      SELECT id FROM resources 
      WHERE file_url LIKE '%vtu-official-important-questions%' 
         OR (resource_type = 'ASSIGNMENT' AND title ILIKE '%Important Exam Questions%')
         OR (resource_type = 'ASSIGNMENT' AND title ILIKE '%Comprehensive 10-Mark High-Yield Question Bank%')
    )
  `);

  await pool.query(`
    DELETE FROM bookmarks 
    WHERE kind = 'RESOURCE' AND ref_id IN (
      SELECT id FROM resources 
      WHERE file_url LIKE '%vtu-official-important-questions%' 
         OR (resource_type = 'ASSIGNMENT' AND title ILIKE '%Important Exam Questions%')
         OR (resource_type = 'ASSIGNMENT' AND title ILIKE '%Comprehensive 10-Mark High-Yield Question Bank%')
    )
  `);

  // 2. Reclassify genuine VTU Circle Question Bank items that were mistakenly labeled ASSIGNMENT to QUESTION_PAPER
  const reclassify = await pool.query(`
    UPDATE resources 
    SET resource_type = 'QUESTION_PAPER' 
    WHERE resource_type = 'ASSIGNMENT' 
      AND title ILIKE '%Official VTU Question Bank%' 
      AND file_url LIKE '%drive.google.com%'
  `);
  console.log(`Reclassified ${reclassify.rowCount} genuine VTU Circle Question Banks from ASSIGNMENT to QUESTION_PAPER.`);

  // 3. Delete automatically generated Important Question rows
  const delImp = await pool.query(`
    DELETE FROM resources 
    WHERE file_url LIKE '%vtu-official-important-questions%' 
       OR (resource_type = 'ASSIGNMENT' AND title ILIKE '%Important Exam Questions%')
       OR (resource_type = 'ASSIGNMENT' AND title ILIKE '%Comprehensive 10-Mark High-Yield Question Bank%')
  `);
  console.log(`Deleted ${delImp.rowCount} automatically generated Important Questions rows from resources table.`);

  // Check remaining resources by type
  const counts = await pool.query("SELECT resource_type, count(*) FROM resources GROUP BY resource_type ORDER BY count(*) DESC");
  console.log("\n=== REMAINING RESOURCES IN DATABASE ===");
  console.table(counts.rows);

  console.log("\n=== STEP 3: CLEANING UP PHYSICAL FILES ===");
  // Remove public/vtu-official-labs if exists
  const labsDir = path.join(process.cwd(), "public", "vtu-official-labs");
  if (fs.existsSync(labsDir)) {
    fs.rmSync(labsDir, { recursive: true, force: true });
    console.log(`Removed directory: ${labsDir}`);
  }

  // Remove public/vtu-official-important-questions if exists
  const impDir = path.join(process.cwd(), "public", "vtu-official-important-questions");
  if (fs.existsSync(impDir)) {
    fs.rmSync(impDir, { recursive: true, force: true });
    console.log(`Removed directory: ${impDir}`);
  }

  // Also remove src/lib/vtu-document-content.ts which housed mock/generated lab manual data
  const docContentFile = path.join(process.cwd(), "src", "lib", "vtu-document-content.ts");
  if (fs.existsSync(docContentFile)) {
    fs.unlinkSync(docContentFile);
    console.log(`Removed file: ${docContentFile}`);
  }

  await pool.end();
  console.log("\nDatabase and filesystem cleanup completed successfully!");
}

main().catch(console.error);
