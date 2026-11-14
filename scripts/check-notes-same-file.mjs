import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function checkNotes() {
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);
  const neon = new Client({
    host: ips[0], port: 5432, user: 'neondb_owner', password: 'npg_HsQcpjaRIo48', database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });
  await neon.connect();

  const dupNotes = await neon.query(`
    SELECT file_url, count(*), array_agg(title) as titles
    FROM resources
    WHERE resource_type = 'NOTES'
    GROUP BY file_url
    HAVING count(*) > 1
    LIMIT 10
  `);
  console.log('Notes with multiple titles for same file_url:');
  console.table(dupNotes.rows);

  await neon.end();
}
checkNotes().catch(console.error);
