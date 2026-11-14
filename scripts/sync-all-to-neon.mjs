import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function main() {
  console.log('Resolving Neon host IP via DNS 8.8.8.8...');
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);
  console.log(`Resolved Neon IP: ${ips[0]}`);

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
  console.log('Connected to Local PostgreSQL');
  await neon.connect();
  console.log('Connected to Neon Cloud PostgreSQL');

  // 1. Sync Schemes
  console.log('\n--- Syncing Schemes ---');
  const schemes = await local.query('SELECT * FROM schemes');
  for (const s of schemes.rows) {
    await neon.query(
      `INSERT INTO schemes (id, name) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [s.id, s.name]
    );
  }
  console.log(`Synced ${schemes.rows.length} schemes`);

  // 2. Sync Branches
  console.log('\n--- Syncing Branches ---');
  const branches = await local.query('SELECT * FROM branches');
  for (const b of branches.rows) {
    await neon.query(
      `INSERT INTO branches (id, code, name) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name`,
      [b.id, b.code, b.name]
    );
  }
  console.log(`Synced ${branches.rows.length} branches`);

  // 3. Sync Semesters
  console.log('\n--- Syncing Semesters ---');
  const semesters = await local.query('SELECT * FROM semesters');
  for (const sem of semesters.rows) {
    await neon.query(
      `INSERT INTO semesters (id, number, label) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET number = EXCLUDED.number, label = EXCLUDED.label`,
      [sem.id, sem.number, sem.label]
    );
  }
  console.log(`Synced ${semesters.rows.length} semesters`);

  // 4. Sync Subjects
  console.log('\n--- Syncing Subjects ---');
  const subjects = await local.query('SELECT * FROM subjects');
  for (const sub of subjects.rows) {
    await neon.query(
      `INSERT INTO subjects (id, name, code, branch_id, semester_id, scheme_id, credits)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         code = EXCLUDED.code,
         branch_id = EXCLUDED.branch_id,
         semester_id = EXCLUDED.semester_id,
         scheme_id = EXCLUDED.scheme_id,
         credits = EXCLUDED.credits`,
      [sub.id, sub.name, sub.code, sub.branch_id, sub.semester_id, sub.scheme_id, sub.credits]
    );
  }
  console.log(`Synced ${subjects.rows.length} subjects`);

  // 5. Sync Resources (All 6,803)
  console.log('\n--- Syncing Resources (6,803 total) ---');
  const resCount = await local.query('SELECT count(*) FROM resources');
  console.log(`Found ${resCount.rows[0].count} resources in local DB`);

  const resources = await local.query('SELECT * FROM resources ORDER BY created_at ASC');
  let inserted = 0;
  let batchSize = 100;

  for (let i = 0; i < resources.rows.length; i += batchSize) {
    const chunk = resources.rows.slice(i, i + batchSize);
    
    // Process chunk in a transaction
    await neon.query('BEGIN');
    for (const r of chunk) {
      await neon.query(
        `INSERT INTO resources (
           id, title, description, resource_type, subject_id, module_number,
           file_name, file_url, file_size, uploaded_by, status, download_count,
           branch_id, scheme_id, semester_id, subject_code, exam_year, exam_month,
           exam_type, source_website, source_page_url, original_file_url, file_hash,
           mime_type, download_status, verification_status, created_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6,
           $7, $8, $9, $10, $11, $12,
           $13, $14, $15, $16, $17, $18,
           $19, $20, $21, $22, $23,
           $24, $25, $26, $27, $28
         )
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           resource_type = EXCLUDED.resource_type,
           subject_id = EXCLUDED.subject_id,
           module_number = EXCLUDED.module_number,
           file_name = EXCLUDED.file_name,
           file_url = EXCLUDED.file_url,
           file_size = EXCLUDED.file_size,
           uploaded_by = EXCLUDED.uploaded_by,
           status = EXCLUDED.status,
           download_count = EXCLUDED.download_count,
           branch_id = EXCLUDED.branch_id,
           scheme_id = EXCLUDED.scheme_id,
           semester_id = EXCLUDED.semester_id,
           subject_code = EXCLUDED.subject_code,
           exam_year = EXCLUDED.exam_year,
           exam_month = EXCLUDED.exam_month,
           exam_type = EXCLUDED.exam_type,
           source_website = EXCLUDED.source_website,
           source_page_url = EXCLUDED.source_page_url,
           original_file_url = EXCLUDED.original_file_url,
           file_hash = EXCLUDED.file_hash,
           mime_type = EXCLUDED.mime_type,
           download_status = EXCLUDED.download_status,
           verification_status = EXCLUDED.verification_status,
           created_at = EXCLUDED.created_at,
           updated_at = EXCLUDED.updated_at`,
        [
          r.id, r.title, r.description, r.resource_type, r.subject_id, r.module_number,
          r.file_name, r.file_url, r.file_size, r.uploaded_by, r.status, r.download_count,
          r.branch_id, r.scheme_id, r.semester_id, r.subject_code, r.exam_year, r.exam_month,
          r.exam_type, r.source_website, r.source_page_url, r.original_file_url, r.file_hash,
          r.mime_type, r.download_status, r.verification_status, r.created_at, r.updated_at
        ]
      );
    }
    await neon.query('COMMIT');
    inserted += chunk.length;
    process.stdout.write(`\rProgress: ${inserted} / ${resources.rows.length} resources synced...`);
  }

  console.log('\n\n--- Verification on Neon ---');
  const neonTotal = await neon.query('SELECT count(*) FROM resources');
  const neonByType = await neon.query(`
    SELECT resource_type, count(*)::int as count 
    FROM resources 
    GROUP BY resource_type 
    ORDER BY count DESC
  `);

  console.log(`Total resources in Neon: ${neonTotal.rows[0].count}`);
  console.table(neonByType.rows);

  await local.end();
  await neon.end();
  console.log('\nSync finished successfully!');
}

main().catch(err => {
  console.error('\nSync failed:', err);
  process.exit(1);
});

