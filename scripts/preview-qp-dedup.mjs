import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function previewQPDedup() {
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);
  const neon = new Client({
    host: ips[0], port: 5432, user: 'neondb_owner', password: 'npg_HsQcpjaRIo48', database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });
  await neon.connect();

  console.log('--- PREVIEW DEDUPLICATING QUESTION PAPERS BY FILE_URL ---');
  const qpDups = await neon.query(`
    SELECT file_url,
           (array_agg(title ORDER BY 
             CASE 
               WHEN title ILIKE '%Model Question Paper with Solutions%' THEN 1
               WHEN title ILIKE '%Official Model Question Paper%' THEN 2
               WHEN title ILIKE '%Previous Year VTU Exam Question Paper%' THEN 3
               ELSE 4
             END, length(title) DESC, id ASC))[1] as keep_title,
           (array_agg(id ORDER BY 
             CASE 
               WHEN title ILIKE '%Model Question Paper with Solutions%' THEN 1
               WHEN title ILIKE '%Official Model Question Paper%' THEN 2
               WHEN title ILIKE '%Previous Year VTU Exam Question Paper%' THEN 3
               ELSE 4
             END, length(title) DESC, id ASC))[1] as keep_id,
           count(*) as total_rows
    FROM resources
    WHERE resource_type = 'QUESTION_PAPER'
    GROUP BY file_url
    HAVING count(*) > 1
  `);

  console.log('Sample kept QP records:');
  console.table(qpDups.rows.slice(0, 10));

  // Check BCV301
  const bcv = qpDups.rows.find(r => r.file_url.includes('BCV301'));
  console.log('BCV301 to be kept:', bcv);

  await neon.end();
}
previewQPDedup().catch(console.error);

