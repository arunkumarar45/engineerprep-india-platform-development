import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function previewDeduplication() {
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);
  const neon = new Client({
    host: ips[0], port: 5432, user: 'neondb_owner', password: 'npg_HsQcpjaRIo48', database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });
  await neon.connect();

  console.log('--- PREVIEW DEDUPLICATION ---');
  
  // 1. Branches
  const branches = await neon.query(`
    SELECT code, count(*), (array_agg(id ORDER BY id))[1] as keep_id, array_agg(id) as all_ids
    FROM branches
    GROUP BY code
  `);
  console.log('Branches distinct count:', branches.rows.length);

  // 2. Semesters
  const semesters = await neon.query(`
    SELECT number, count(*), (array_agg(id ORDER BY id))[1] as keep_id, array_agg(id) as all_ids
    FROM semesters
    GROUP BY number
  `);
  console.log('Semesters distinct count:', semesters.rows.length);

  // 3. Schemes
  const schemes = await neon.query(`
    SELECT regexp_replace(name, ' Scheme$', '') as norm_name, count(*), (array_agg(id ORDER BY id))[1] as keep_id, array_agg(id) as all_ids
    FROM schemes
    GROUP BY regexp_replace(name, ' Scheme$', '')
  `);
  console.log('Schemes distinct count:', schemes.rows.length);

  // 4. Check BCV301 before
  const bcv301Before = await neon.query(`
    SELECT id, title, file_url FROM resources WHERE subject_code = 'BCV301' OR title ILIKE '%BCV301%'
  `);
  console.log('BCV301 rows before:', bcv301Before.rows.length);

  // 5. Total resources to delete
  const resDups = await neon.query(`
    SELECT id
    FROM (
      SELECT id, ROW_NUMBER() OVER (
        PARTITION BY resource_type, title, file_url 
        ORDER BY created_at ASC NULLS LAST, id ASC
      ) as rn
      FROM resources
    ) t
    WHERE t.rn > 1
  `);
  console.log('Total redundant duplicate resource rows to delete:', resDups.rows.length);

  await neon.end();
}
previewDeduplication().catch(console.error);
