import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:Arun%40018@127.0.0.1:5432/engineerprep_db",
});

async function main() {
  const imp = await pool.query("SELECT count(*) FROM resources WHERE title ILIKE '%important%'");
  console.log('Remaining resources with "important" in title:', imp.rows[0].count);
  if (parseInt(imp.rows[0].count) > 0) {
    const samples = await pool.query("SELECT id, title, file_url, resource_type FROM resources WHERE title ILIKE '%important%' LIMIT 10");
    console.log('Samples:', samples.rows);
  }
  const assign = await pool.query("SELECT count(*) FROM resources WHERE resource_type = 'ASSIGNMENT'");
  console.log('Remaining ASSIGNMENT resources:', assign.rows[0].count);
  const sampleAssign = await pool.query("SELECT id, title, file_url FROM resources WHERE resource_type = 'ASSIGNMENT' LIMIT 10");
  console.log('Sample ASSIGNMENT resources:', sampleAssign.rows);
  await pool.end();
}

main().catch(console.error);
