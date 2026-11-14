import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function checkFKs() {
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);
  const neon = new Client({
    host: ips[0], port: 5432, user: 'neondb_owner', password: 'npg_HsQcpjaRIo48', database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });
  await neon.connect();

  const fks = await neon.query(`
    SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name IN ('resources', 'branches', 'semesters', 'schemes', 'subjects');
  `);
  console.table(fks.rows);

  // Check bookmarks or downloads referencing resources
  const bCount = await neon.query("SELECT count(*) FROM bookmarks WHERE kind = 'RESOURCE'");
  console.log('Bookmarks count on RESOURCE:', bCount.rows[0].count);

  const dCount = await neon.query("SELECT count(*) FROM downloads");
  console.log('Downloads count:', dCount.rows[0].count);

  await neon.end();
}
checkFKs().catch(console.error);

