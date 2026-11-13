import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const populated = await client.query(`
  SELECT resource_type, COUNT(*) as cnt
  FROM resources
  WHERE file_url IS NOT NULL AND file_url != ''
  GROUP BY resource_type
`);
console.table(populated.rows);

// Check if any of these populated files exist locally on disk
const localSample = await client.query(`
  SELECT id, resource_type, title, file_url
  FROM resources
  WHERE file_url LIKE '/vtu-%' OR file_url LIKE '/api/v1/uploads%'
  LIMIT 10
`);
console.table(localSample.rows);

await client.end();

