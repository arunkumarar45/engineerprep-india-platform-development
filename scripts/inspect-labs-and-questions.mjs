import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:Arun%40018@127.0.0.1:5432/engineerprep_db",
});

async function main() {
  const notImp = await pool.query("SELECT id, title, file_url FROM resources WHERE resource_type = 'ASSIGNMENT' AND title NOT ILIKE '%important%'");
  console.log('Assignments that do NOT have important in title:', notImp.rows.length);
  console.log(notImp.rows);

  const totalImp = await pool.query("SELECT COUNT(*) FROM resources WHERE title ILIKE '%important%'");
  console.log('Total resources with important in title:', totalImp.rows[0].count);

  const fileUrlImp = await pool.query("SELECT COUNT(*) FROM resources WHERE file_url LIKE '%vtu-official-important-questions%'");
  console.log('Total resources pointing to /vtu-official-important-questions/:', fileUrlImp.rows[0].count);

  const driveImp = await pool.query("SELECT COUNT(*) FROM resources WHERE resource_type = 'ASSIGNMENT' AND file_url LIKE '%drive.google.com%'");
  console.log('ASSIGNMENT resources pointing to Google Drive:', driveImp.rows[0].count);

  await pool.end();
}

main().catch(console.error);
