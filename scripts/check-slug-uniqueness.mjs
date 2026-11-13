import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

async function checkDuplicates(table, col) {
  const res = await client.query(`
    SELECT ${col}, COUNT(*) as cnt 
    FROM ${table} 
    GROUP BY ${col} 
    HAVING COUNT(*) > 1
  `);
  if (res.rows.length > 0) {
    console.log(`DUPLICATES in ${table}.${col}:`, res.rows);
  } else {
    console.log(`OK: No duplicates in ${table}.${col}`);
  }
}

await checkDuplicates('dsa_sheets', 'slug');
await checkDuplicates('dsa_patterns', 'slug');
await checkDuplicates('dsa_problems', 'slug');
await checkDuplicates('roadmaps', 'slug');
await checkDuplicates('mock_tests', 'slug');

await client.end();

