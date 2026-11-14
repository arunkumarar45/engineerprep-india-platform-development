import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function investigate() {
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);
  const neon = new Client({
    host: ips[0], port: 5432, user: 'neondb_owner', password: 'npg_HsQcpjaRIo48', database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });
  await neon.connect();

  console.log('--- DUPLICATE BRANCHES ---');
  const dupBranches = await neon.query(`
    SELECT code, count(*), array_agg(id) as ids, array_agg(name) as names 
    FROM branches GROUP BY code HAVING count(*) > 1
  `);
  console.table(dupBranches.rows);

  console.log('--- DUPLICATE SEMESTERS ---');
  const dupSemesters = await neon.query(`
    SELECT number, count(*), array_agg(id) as ids 
    FROM semesters GROUP BY number HAVING count(*) > 1
  `);
  console.table(dupSemesters.rows);

  console.log('--- DUPLICATE SCHEMES ---');
  const dupSchemes = await neon.query(`
    SELECT name, count(*), array_agg(id) as ids 
    FROM schemes GROUP BY name HAVING count(*) > 1
  `);
  console.table(dupSchemes.rows);

  console.log('--- SEARCHING TITLES ---');
  const titles = await neon.query(`
    SELECT id, title, module_number, subject_code, resource_type, file_url 
    FROM resources 
    WHERE title ILIKE '%Water%' 
       OR title ILIKE '%Steel%' 
       OR title ILIKE '%Transportation%'
  `);
  console.table(titles.rows);

  console.log('--- BCV301 DUPLICATES ---');
  const bcv = await neon.query(`
    SELECT id, title, file_url, file_size 
    FROM resources 
    WHERE subject_code = 'BCV301' OR title ILIKE '%BCV301%'
  `);
  console.table(bcv.rows);

  console.log('--- DUPLICATE RESOURCES OVERALL (same title and file_url) ---');
  const dupRes = await neon.query(`
    SELECT title, file_url, count(*), array_agg(id) as ids
    FROM resources
    GROUP BY title, file_url
    HAVING count(*) > 1
  `);
  console.log('Total duplicate resource groups:', dupRes.rows.length);
  if (dupRes.rows.length > 0) {
    console.table(dupRes.rows.slice(0, 10));
  }

  await neon.end();
}
investigate().catch(console.error);
