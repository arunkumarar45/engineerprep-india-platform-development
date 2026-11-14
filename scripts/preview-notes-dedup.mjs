import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function previewNotesDedup() {
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);
  const neon = new Client({
    host: ips[0], port: 5432, user: 'neondb_owner', password: 'npg_HsQcpjaRIo48', database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });
  await neon.connect();

  console.log('--- PREVIEW DEDUPLICATING NOTES BY FILE_URL ---');
  const notesDups = await neon.query(`
    SELECT file_url,
           (array_agg(title ORDER BY 
             CASE 
               WHEN title ~* '22[A-Z]{3}[0-9]' THEN 1
               WHEN title ~* '21[A-Z]{3}[0-9]' THEN 2
               WHEN title ~* '18[A-Z]{3}[0-9]' THEN 3
               WHEN title ~* '\\[[A-Z0-9]+\\]' THEN 4
               ELSE 5
             END, length(title) DESC, id ASC))[1] as keep_title,
           (array_agg(id ORDER BY 
             CASE 
               WHEN title ~* '22[A-Z]{3}[0-9]' THEN 1
               WHEN title ~* '21[A-Z]{3}[0-9]' THEN 2
               WHEN title ~* '18[A-Z]{3}[0-9]' THEN 3
               WHEN title ~* '\\[[A-Z0-9]+\\]' THEN 4
               ELSE 5
             END, length(title) DESC, id ASC))[1] as keep_id,
           count(*) as total_rows
    FROM resources
    WHERE resource_type = 'NOTES'
    GROUP BY file_url
    HAVING count(*) > 1
  `);

  console.log('Sample kept Note records:');
  console.table(notesDups.rows.slice(0, 10));

  await neon.end();
}
previewNotesDedup().catch(console.error);
