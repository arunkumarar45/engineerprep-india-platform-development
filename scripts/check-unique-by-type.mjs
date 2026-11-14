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

  const res = await neon.query(`
    SELECT resource_type, count(DISTINCT (title || '___' || file_url)) as unique_count
    FROM resources
    GROUP BY resource_type
  `);
  console.table(res.rows);

  const total = await neon.query(`
    SELECT count(DISTINCT (title || '___' || file_url)) as total_unique
    FROM resources
  `);
  console.log('Total unique resources:', total.rows[0].total_unique);

  await neon.end();
}
check().catch(console.error);

