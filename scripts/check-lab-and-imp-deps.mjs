import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:Arun%40018@127.0.0.1:5432/engineerprep_db",
});

async function main() {
  const labDownloads = await pool.query("SELECT COUNT(*) FROM downloads WHERE resource_id IN (SELECT id FROM resources WHERE resource_type = 'LAB_MANUAL')");
  console.log('Lab manual downloads:', labDownloads.rows[0].count);

  const labBookmarks = await pool.query("SELECT COUNT(*) FROM bookmarks WHERE kind = 'RESOURCE' AND ref_id IN (SELECT id FROM resources WHERE resource_type = 'LAB_MANUAL')");
  console.log('Lab manual bookmarks:', labBookmarks.rows[0].count);

  const impDownloads = await pool.query("SELECT COUNT(*) FROM downloads WHERE resource_id IN (SELECT id FROM resources WHERE file_url LIKE '%vtu-official-important-questions%' OR title ILIKE '%Important Exam Questions%')");
  console.log('Important questions downloads:', impDownloads.rows[0].count);

  const impBookmarks = await pool.query("SELECT COUNT(*) FROM bookmarks WHERE kind = 'RESOURCE' AND ref_id IN (SELECT id FROM resources WHERE file_url LIKE '%vtu-official-important-questions%' OR title ILIKE '%Important Exam Questions%')");
  console.log('Important questions bookmarks:', impBookmarks.rows[0].count);

  await pool.end();
}
main().catch(console.error);
