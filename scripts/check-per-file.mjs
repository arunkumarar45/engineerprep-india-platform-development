import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function checkPerFile() {
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);
  const neon = new Client({
    host: ips[0], port: 5432, user: 'neondb_owner', password: 'npg_HsQcpjaRIo48', database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });
  await neon.connect();

  const res = await neon.query(`
    SELECT resource_type, count(DISTINCT file_url) as distinct_files, count(*) as current_records
    FROM resources
    GROUP BY resource_type
  `);
  console.table(res.rows);

  const totalDistinct = await neon.query(`
    SELECT count(DISTINCT file_url) as total_distinct_files, count(*) as total_records
    FROM resources
  `);
  console.log('Total distinct files vs records:', totalDistinct.rows[0]);

  await neon.end();
}
checkPerFile().catch(console.error);
