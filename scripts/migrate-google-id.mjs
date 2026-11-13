import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:Arun%40018@127.0.0.1:5432/engineerprep_db",
});

async function main() {
  console.log("Adding google_id column and unique index to users table...");
  
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(120);
  `);
  
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_idx ON users(google_id) WHERE google_id IS NOT NULL;
  `);

  console.log("Successfully added google_id column and partial unique index to users table!");
  await pool.end();
}

main().catch(console.error);
