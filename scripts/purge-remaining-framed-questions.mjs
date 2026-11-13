import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:Arun%40018@127.0.0.1:5432/engineerprep_db",
});

async function main() {
  const del = await pool.query("DELETE FROM resources WHERE resource_type = 'ASSIGNMENT'");
  console.log(`Deleted all ${del.rowCount} fabricated question rows from resources.`);
  
  const total = await pool.query("SELECT resource_type, count(*) FROM resources GROUP BY resource_type ORDER BY count(*) DESC");
  console.log('\n=== CURRENT RESOURCES BY TYPE ===');
  console.table(total.rows);

  const imp = await pool.query("SELECT count(*) FROM resources WHERE title ILIKE '%important%'");
  console.log('Remaining resources with "important" in title:', imp.rows[0].count);

  await pool.end();
}

main().catch(console.error);
