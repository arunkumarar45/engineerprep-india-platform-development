import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function checkResources() {
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);
  const neon = new Client({
    host: ips[0], port: 5432, user: 'neondb_owner', password: 'npg_HsQcpjaRIo48', database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });
  await neon.connect();

  const total = await neon.query("SELECT count(*) FROM resources");
  console.log('Total in resources:', total.rows[0].count);

  const byType = await neon.query("SELECT resource_type, count(*) FROM resources GROUP BY resource_type");
  console.table(byType.rows);

  const exactDups = await neon.query(`
    SELECT resource_type, title, file_url, count(*) 
    FROM resources 
    GROUP BY resource_type, title, file_url 
    HAVING count(*) > 1
  `);
  console.log('Number of duplicate (resource_type, title, file_url) groups:', exactDups.rows.length);

  // Total rows that are redundant copies
  const redundant = await neon.query(`
    SELECT sum(cnt - 1) as duplicate_rows_count
    FROM (
      SELECT count(*) as cnt
      FROM resources
      GROUP BY resource_type, title, file_url
      HAVING count(*) > 1
    ) sub
  `);
  console.log('Total redundant duplicate rows:', redundant.rows[0].duplicate_rows_count);

  await neon.end();
}
checkResources().catch(console.error);

