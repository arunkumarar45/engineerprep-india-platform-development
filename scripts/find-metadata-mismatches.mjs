import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function findRecords() {
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);
  const neon = new Client({
    host: ips[0], port: 5432, user: 'neondb_owner', password: 'npg_HsQcpjaRIo48', database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });
  await neon.connect();

  const r1 = await neon.query(`SELECT id, title, module_number, subject_code, subject_id FROM resources WHERE title ILIKE '%Water Resources%'`);
  console.log('Water Resources:');
  console.table(r1.rows);

  const r2 = await neon.query(`SELECT id, title, module_number, subject_code, subject_id FROM resources WHERE title ILIKE '%Steel Structures%'`);
  console.log('Steel Structures:');
  console.table(r2.rows);

  const r3 = await neon.query(`SELECT id, title, module_number, subject_code, subject_id FROM resources WHERE title ILIKE '%Transportation Engineering%'`);
  console.log('Transportation Engineering:');
  console.table(r3.rows);

  // Check all notes where module in title doesn't match module_number
  const mismatches = await neon.query(`
    SELECT id, title, module_number, 
           SUBSTRING(title FROM '(?i)Module\\s*([1-5])')::int as title_module
    FROM resources
    WHERE title ~* '(?i)Module\\s*([1-5])'
      AND (module_number IS NULL OR module_number != SUBSTRING(title FROM '(?i)Module\\s*([1-5])')::int)
  `);
  console.log('All Module Mismatches count:', mismatches.rows.length);
  console.table(mismatches.rows);

  await neon.end();
}
findRecords().catch(console.error);

