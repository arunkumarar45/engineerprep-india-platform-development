import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

console.log('\n=== BCS6xx/BCS7xx SYLLABUS RECORDS ===');
const res = await client.query(
  `SELECT id, title, file_url FROM resources 
   WHERE resource_type='SYLLABUS' AND (title LIKE '%BCS7%' OR title LIKE '%BCS6%') 
   ORDER BY title`
);
res.rows.forEach(r => console.log(r.id, '|', r.title.padEnd(60), '|', (r.file_url||'EMPTY').substring(0, 90)));

console.log('\n=== ALL SYLLABUS COUNT & SAMPLE ===');
const all = await client.query(
  `SELECT COUNT(*) as cnt FROM resources WHERE resource_type='SYLLABUS'`
);
console.log('Total syllabi:', all.rows[0].cnt);

console.log('\n=== PLAYLISTS WITH THUMBNAIL ===');
const pl = await client.query(
  `SELECT id, name, thumbnail_url FROM playlists ORDER BY name`
);
pl.rows.forEach(r => console.log(r.id, '|', r.name.padEnd(60), '|', r.thumbnail_url || 'NO_THUMB'));

await client.end();

