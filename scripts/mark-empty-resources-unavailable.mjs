import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

console.log('=== Updating Empty Resources to Accurate UNAVAILABLE Status ===');
const res = await client.query(`
  UPDATE resources 
  SET download_status = 'UNAVAILABLE',
      verification_status = 'PENDING_FILE',
      updated_at = NOW()
  WHERE file_url IS NULL OR file_url = ''
  RETURNING id
`);
console.log(`Updated ${res.rowCount} records to download_status='UNAVAILABLE', verification_status='PENDING_FILE'.`);

// Also verify status counts
const counts = await client.query(`
  SELECT download_status, verification_status, COUNT(*) as cnt
  FROM resources
  GROUP BY download_status, verification_status
`);
console.table(counts.rows);

await client.end();

