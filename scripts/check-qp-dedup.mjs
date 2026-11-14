import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function checkQPDedup() {
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);
  const neon = new Client({
    host: ips[0], port: 5432, user: 'neondb_owner', password: 'npg_HsQcpjaRIo48', database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });
  await neon.connect();

  const dupQPCount = await neon.query(`
    SELECT count(*) 
    FROM (
      SELECT file_url, count(*) 
      FROM resources 
      WHERE resource_type = 'QUESTION_PAPER' 
      GROUP BY file_url 
      HAVING count(*) > 1
    ) sub
  `);
  console.log('Unique files with multiple QP entries:', dupQPCount.rows[0].count);

  const totalDups = await neon.query(`
    SELECT sum(cnt - 1) as duplicate_rows
    FROM (
      SELECT file_url, count(*) as cnt
      FROM resources
      WHERE resource_type = 'QUESTION_PAPER'
      GROUP BY file_url
      HAVING count(*) > 1
    ) sub
  `);
  console.log('Total duplicate QP rows that can be purged:', totalDups.rows[0].duplicate_rows);

  await neon.end();
}
checkQPDedup().catch(console.error);

