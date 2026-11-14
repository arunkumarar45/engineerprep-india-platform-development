import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function check() {
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);
  const neon = new Client({
    host: ips[0], port: 5432, user: 'neondb_owner', password: 'npg_HsQcpjaRIo48', database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });
  await neon.connect();

  const sems = await neon.query('SELECT * FROM semesters ORDER BY number');
  console.log('Semesters in DB:', sems.rows);

  const branches = await neon.query('SELECT * FROM branches ORDER BY code');
  console.log('Branches in DB:', branches.rows);

  const subStats = await neon.query('SELECT count(*) as total, count(branch_id) as with_branch, count(semester_id) as with_sem, count(scheme_id) as with_scheme FROM subjects');
  console.log('Subject stats:', subStats.rows[0]);

  const sampleSubs = await neon.query('SELECT id, code, name, branch_id, semester_id, scheme_id FROM subjects LIMIT 10');
  console.table(sampleSubs.rows);

  const bigData = await neon.query("SELECT * FROM subjects WHERE code LIKE '%BCS7%' OR name ILIKE '%Big Data%' LIMIT 5");
  console.log('Big Data in subjects:', bigData.rows);

  const bcv301 = await neon.query("SELECT id, title, file_url, file_size, module_number, resource_type, subject_code FROM resources WHERE subject_code = 'BCV301' OR title ILIKE '%BCV301%'");
  console.log('BCV301 resources:', bcv301.rows);

  const threeMetadata = await neon.query(`
    SELECT id, title, module_number, subject_code FROM resources 
    WHERE title ILIKE '%Water Resources%Module%' 
       OR title ILIKE '%Design of Steel Structures%Module%' 
       OR title ILIKE '%Transportation Engineering II%Module%'
  `);
  console.log('Target 3 metadata resources:', threeMetadata.rows);

  const assignmentCount = await neon.query("SELECT count(*) FROM resources WHERE resource_type = 'ASSIGNMENT'");
  console.log('Assignment count in DB:', assignmentCount.rows[0]);

  await neon.end();
}
check().catch(console.error);

