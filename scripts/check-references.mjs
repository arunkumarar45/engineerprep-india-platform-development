import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function checkReferences() {
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);
  const neon = new Client({
    host: ips[0], port: 5432, user: 'neondb_owner', password: 'npg_HsQcpjaRIo48', database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });
  await neon.connect();

  console.log('--- BRANCH REFERENCES ---');
  const bRefs = await neon.query(`
    SELECT b.id, b.code, b.name,
           (SELECT count(*) FROM subjects s WHERE s.branch_id = b.id) as subjects_count,
           (SELECT count(*) FROM resources r WHERE r.branch_id = b.id) as resources_count
    FROM branches b
    ORDER BY b.code, b.id
  `);
  console.table(bRefs.rows);

  console.log('--- SEMESTER REFERENCES ---');
  const sRefs = await neon.query(`
    SELECT sem.id, sem.number, sem.label,
           (SELECT count(*) FROM subjects s WHERE s.semester_id = sem.id) as subjects_count,
           (SELECT count(*) FROM resources r WHERE r.semester_id = sem.id) as resources_count
    FROM semesters sem
    ORDER BY sem.number, sem.id
  `);
  console.table(sRefs.rows);

  console.log('--- SCHEME REFERENCES ---');
  const scRefs = await neon.query(`
    SELECT sc.id, sc.name,
           (SELECT count(*) FROM subjects s WHERE s.scheme_id = sc.id) as subjects_count,
           (SELECT count(*) FROM resources r WHERE r.scheme_id = sc.id) as resources_count
    FROM schemes sc
    ORDER BY sc.name, sc.id
  `);
  console.table(scRefs.rows);

  await neon.end();
}
checkReferences().catch(console.error);

