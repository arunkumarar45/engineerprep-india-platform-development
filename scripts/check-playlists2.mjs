import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

console.log('\n=== PLAYLISTS TABLE COLUMNS ===');
const cols = await client.query(
  `SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name='playlists' ORDER BY ordinal_position`
);
cols.rows.forEach(r => console.log(r.column_name, '-', r.data_type));

console.log('\n=== PLAYLISTS DATA ===');
const pl = await client.query(`SELECT * FROM playlists ORDER BY created_at LIMIT 20`);
pl.rows.forEach(r => {
  const thumb = r.thumbnail_url || r.thumbnailUrl || r.thumbnail || r.image_url || r.imageUrl || 'NO_THUMB_COL';
  const title = r.title || r.name || r.playlist_name || Object.values(r).find(v => typeof v === 'string' && v.length > 5) || '?';
  console.log(r.id, '|', String(title).substring(0,50).padEnd(50), '|', thumb);
});

await client.end();

