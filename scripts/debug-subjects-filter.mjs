import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function test() {
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);
  const neon = new Client({
    host: ips[0], port: 5432, user: 'neondb_owner', password: 'npg_HsQcpjaRIo48', database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });
  await neon.connect();

  const cse = await neon.query("SELECT id, code FROM branches WHERE code = 'CSE'");
  const sem7 = await neon.query("SELECT id, number FROM semesters WHERE number = 7");
  const scheme2022 = await neon.query("SELECT id, name FROM schemes WHERE name LIKE '%2022%'");

  console.log('CSE Branch ID:', cse.rows[0]?.id);
  console.log('Sem 7 ID:', sem7.rows[0]?.id);
  console.log('Scheme 2022 ID:', scheme2022.rows[0]?.id);

  const cseId = cse.rows[0]?.id;
  const sem7Id = sem7.rows[0]?.id;
  const sch22Id = scheme2022.rows[0]?.id;

  const exactMatch = await neon.query(`
    SELECT id, code, name, branch_id, semester_id, scheme_id 
    FROM subjects 
    WHERE branch_id = $1 AND semester_id = $2
  `, [cseId, sem7Id]);
  console.log('Exact branch_id + semester_id matches count:', exactMatch.rows.length);
  console.table(exactMatch.rows);

  const anySem7 = await neon.query(`
    SELECT id, code, name, branch_id, semester_id, scheme_id 
    FROM subjects 
    WHERE semester_id = $1
  `, [sem7Id]);
  console.log('Total subjects with semester_id = sem 7:', anySem7.rows.length);
  console.table(anySem7.rows.slice(0, 10));

  await neon.end();
}
test().catch(console.error);

