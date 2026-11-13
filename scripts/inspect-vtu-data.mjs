import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

console.log('=== VTU DISCOVERED RESOURCES STATUS ===');
const disc = await client.query(`
  SELECT download_status, validation_status, COUNT(*) as cnt 
  FROM vtu_discovered_resources 
  GROUP BY download_status, validation_status
`);
console.table(disc.rows);

console.log('\n=== SAMPLE DISCOVERED RESOURCES ===');
const sample = await client.query(`
  SELECT id, title, source_website, original_file_url, download_status, validation_status, category
  FROM vtu_discovered_resources 
  LIMIT 10
`);
console.table(sample.rows);

console.log('\n=== EMPTY RESOURCES BREAKDOWN ===');
const emptyRes = await client.query(`
  SELECT resource_type, status, COUNT(*) as cnt
  FROM resources
  WHERE file_url IS NULL OR file_url = ''
  GROUP BY resource_type, status
`);
console.table(emptyRes.rows);

console.log('\n=== NON-EMPTY RESOURCES SAMPLE ===');
const nonEmpty = await client.query(`
  SELECT resource_type, title, file_url 
  FROM resources 
  WHERE file_url IS NOT NULL AND file_url != '' 
  LIMIT 10
`);
console.table(nonEmpty.rows);

console.log('\n=== TOTAL RESOURCES IN RESOURCES TABLE ===');
const totalRes = await client.query(`
  SELECT resource_type, COUNT(*) as total,
         COUNT(CASE WHEN file_url IS NOT NULL AND file_url != '' THEN 1 END) as has_url,
         COUNT(CASE WHEN file_url IS NULL OR file_url = '' THEN 1 END) as empty_url
  FROM resources
  GROUP BY resource_type
`);
console.table(totalRes.rows);

await client.end();
