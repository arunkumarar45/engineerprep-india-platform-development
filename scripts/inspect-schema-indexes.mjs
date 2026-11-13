import fs from 'fs';
const content = fs.readFileSync('src/db/schema.ts', 'utf8');

const targetTables = ['dsa_sheets', 'playlists', 'dsa_patterns', 'dsa_problems', 'roadmaps', 'mock_tests', 'opportunities'];
for (const t of targetTables) {
  const regex = new RegExp(`export const \\w+ = pgTable\\(\\s*["']${t}["'][\\s\\S]*?\\n\\);`, 'g');
  const match = regex.exec(content);
  if (match) {
    console.log(`=== ${t} ===`);
    console.log(match[0].slice(0, 800));
  }
}

