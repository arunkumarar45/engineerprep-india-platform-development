import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const r = await client.query('SELECT id, slug, title, category, instructor, total_videos, total_duration, playlist_url, thumbnail_url FROM playlists ORDER BY order_index');
console.log('Total playlists in DB:', r.rows.length);
console.table(r.rows);

await client.end();

