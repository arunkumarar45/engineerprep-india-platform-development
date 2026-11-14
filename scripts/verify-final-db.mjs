import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function verify() {
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);
  const neon = new Client({
    host: ips[0], port: 5432, user: 'neondb_owner', password: 'npg_HsQcpjaRIo48', database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });
  await neon.connect();

  const b = await neon.query('SELECT * FROM branches ORDER BY code');
  console.log('Branches count:', b.rows.length);
  console.table(b.rows);

  const sem = await neon.query('SELECT * FROM semesters ORDER BY number');
  console.log('Semesters count:', sem.rows.length);
  console.table(sem.rows);

  const sc = await neon.query('SELECT * FROM schemes ORDER BY name');
  console.log('Schemes count:', sc.rows.length);
  console.table(sc.rows);

  const cseSem7 = await neon.query(`
    SELECT s.id, s.code, s.name 
    FROM subjects s 
    JOIN branches b ON s.branch_id = b.id 
    JOIN semesters sem ON s.semester_id = sem.id 
    WHERE b.code = 'CSE' AND sem.number = 7
  `);
  console.log('CSE Sem 7 subjects count:', cseSem7.rows.length);
  console.table(cseSem7.rows.slice(0, 15));

  await neon.end();
}
verify().catch(console.error);

