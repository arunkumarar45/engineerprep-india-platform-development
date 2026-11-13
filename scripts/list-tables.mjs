import fs from 'fs';
const content = fs.readFileSync('src/db/schema.ts', 'utf8');
const tables = [...content.matchAll(/export const \w+ = pgTable\(\s*["']([^"']+)["']/g)].map(m => m[1]);
console.log('Total tables in schema:', tables.length);
console.log(tables);

