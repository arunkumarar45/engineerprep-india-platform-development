import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function main() {
  console.log('Resolving Neon host IP via DNS 8.8.8.8...');
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);

  const local = new Client({
    connectionString: 'postgresql://postgres:Arun%40018@127.0.0.1:5432/engineerprep_db'
  });

  const neon = new Client({
    host: ips[0],
    port: 5432,
    user: 'neondb_owner',
    password: 'npg_HsQcpjaRIo48',
    database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });

  await local.connect();
  await neon.connect();
  console.log('Connected to both databases.');

  // Find Neon user id for arun@engineerprep.in or admin
  const neonUserRes = await neon.query("SELECT id FROM users WHERE email = 'arun@engineerprep.in' LIMIT 1");
  const neonArunId = neonUserRes.rows[0]?.id || null;
  console.log(`Neon Arun User ID: ${neonArunId}`);

  console.log('Fetching 6,803 resources from Local DB...');
  const res = await local.query('SELECT * FROM resources ORDER BY created_at ASC');
  const rows = res.rows;
  console.log(`Fetched ${rows.length} resources.`);

  const cols = [
    'id', 'title', 'description', 'resource_type', 'subject_id', 'module_number',
    'file_name', 'file_url', 'file_size', 'uploaded_by', 'status', 'download_count',
    'branch_id', 'scheme_id', 'semester_id', 'subject_code', 'exam_year', 'exam_month',
    'exam_type', 'source_website', 'source_page_url', 'original_file_url', 'file_hash',
    'mime_type', 'download_status', 'verification_status', 'created_at', 'updated_at'
  ];

  const updateCols = cols.filter(c => c !== 'id').map(c => `${c} = EXCLUDED.${c}`).join(', ');

  const BATCH_SIZE = 100;
  let count = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const valuePlaceholders = [];
    const values = [];

    chunk.forEach((row, rowIdx) => {
      // Map uploaded_by to neonArunId if it was the local Arun id
      if (row.uploaded_by) {
        row.uploaded_by = neonArunId;
      }

      const rowPlaceholders = [];
      cols.forEach((col, colIdx) => {
        values.push(row[col]);
        rowPlaceholders.push(`$${rowIdx * cols.length + colIdx + 1}`);
      });
      valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
    });

    const query = `
      INSERT INTO resources (${cols.join(', ')})
      VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT (id) DO UPDATE SET ${updateCols}
    `;

    await neon.query(query, values);
    count += chunk.length;
    process.stdout.write(`\rTransferred: ${count} / ${rows.length} resources...`);
  }

  console.log('\n\n--- Verification on Neon ---');
  const neonCount = await neon.query('SELECT count(*) FROM resources');
  const neonByType = await neon.query(`
    SELECT resource_type, count(*)::int as count 
    FROM resources 
    GROUP BY resource_type 
    ORDER BY count DESC
  `);

  console.log(`\n🎉 Total Resources now in Neon Cloud Database: ${neonCount.rows[0].count}`);
  console.table(neonByType.rows);

  await local.end();
  await neon.end();
}

main().catch(err => {
  console.error('\nSync failed:', err);
  process.exit(1);
});
