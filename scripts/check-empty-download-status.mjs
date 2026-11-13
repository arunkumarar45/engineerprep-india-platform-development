import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const r = await client.query(`
  SELECT download_status, verification_status, COUNT(*) as cnt
  FROM resources
  WHERE file_url IS NULL OR file_url = ''
  GROUP BY download_status, verification_status
`);
console.table(r.rows);

await client.end();

