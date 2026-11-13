import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('src/data/playlists.json', 'utf8'));

const meta = raw.map(p => ({
  slug: p.slug,
  title: p.title,
  category: p.category,
  instructor: p.instructor,
  channel: p.channel,
  totalVideos: p.totalVideos || (p.sections?.reduce((a, s) => a + (s.videos?.length || 0), 0) ?? 0) || (p.lectures?.length ?? 0),
  totalDuration: p.totalDuration,
  rating: p.rating,
  badge: p.badge,
  description: p.description,
  playlistUrl: p.playlistUrl,
  thumbnailUrl: p.thumbnailUrl || `/thumbnails/dsa-playlists/${p.slug}.jpg`,
  thumbnailAlt: p.thumbnailAlt || `${p.title} by ${p.instructor || p.channel}`,
}));

fs.writeFileSync('src/data/playlists-meta.json', JSON.stringify(meta, null, 2), 'utf8');
const sizeKb = Math.round(fs.statSync('src/data/playlists-meta.json').size / 1024);
console.log(`Generated src/data/playlists-meta.json: ${meta.length} items, size: ${sizeKb} KB (reduced from 858 KB)`);

