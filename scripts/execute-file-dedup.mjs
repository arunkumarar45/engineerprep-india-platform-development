import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function executeFileDedup() {
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);
  const neon = new Client({
    host: ips[0], port: 5432, user: 'neondb_owner', password: 'npg_HsQcpjaRIo48', database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });
  await neon.connect();

  console.log('--- EXECUTING QUESTION PAPER & NOTES DEDUPLICATION BY FILE URL ---');
  await neon.query('BEGIN');

  try {
    // 1. QUESTION PAPERS
    await neon.query(`
      CREATE TEMP TABLE qp_dedup AS
      SELECT id,
             FIRST_VALUE(id) OVER (
               PARTITION BY file_url
               ORDER BY 
                 CASE 
                   WHEN title ILIKE '%Model Question Paper with Solutions%' THEN 1
                   WHEN title ILIKE '%Official Model Question Paper%' THEN 2
                   WHEN title ILIKE '%Previous Year VTU Exam Question Paper%' THEN 3
                   ELSE 4
                 END, length(title) DESC, id ASC
             ) as keep_id,
             ROW_NUMBER() OVER (
               PARTITION BY file_url
               ORDER BY 
                 CASE 
                   WHEN title ILIKE '%Model Question Paper with Solutions%' THEN 1
                   WHEN title ILIKE '%Official Model Question Paper%' THEN 2
                   WHEN title ILIKE '%Previous Year VTU Exam Question Paper%' THEN 3
                   ELSE 4
                 END, length(title) DESC, id ASC
             ) as rn
      FROM resources
      WHERE resource_type = 'QUESTION_PAPER';
    `);

    // Repoint bookmarks
    await neon.query(`
      UPDATE bookmarks b
      SET ref_id = d.keep_id
      FROM qp_dedup d
      WHERE b.ref_id = d.id AND b.kind = 'RESOURCE' AND d.rn > 1;
    `);

    // Repoint vtu_discovered_resources
    await neon.query(`
      UPDATE vtu_discovered_resources v
      SET uploaded_resource_id = d.keep_id
      FROM qp_dedup d
      WHERE v.uploaded_resource_id = d.id AND d.rn > 1;
    `);

    // Delete redundant QPs
    const qpDel = await neon.query(`
      DELETE FROM resources
      WHERE id IN (SELECT id FROM qp_dedup WHERE rn > 1);
    `);
    console.log(`Deleted ${qpDel.rowCount} duplicate question paper rows.`);

    // 2. NOTES
    await neon.query(`
      CREATE TEMP TABLE notes_dedup AS
      SELECT id,
             FIRST_VALUE(id) OVER (
               PARTITION BY file_url
               ORDER BY 
                 CASE 
                   WHEN title ~* '22[A-Z]{3}[0-9]' THEN 1
                   WHEN title ~* '21[A-Z]{3}[0-9]' THEN 2
                   WHEN title ~* '18[A-Z]{3}[0-9]' THEN 3
                   WHEN title ~* '\\[[A-Z0-9]+\\]' THEN 4
                   ELSE 5
                 END, length(title) DESC, id ASC
             ) as keep_id,
             ROW_NUMBER() OVER (
               PARTITION BY file_url
               ORDER BY 
                 CASE 
                   WHEN title ~* '22[A-Z]{3}[0-9]' THEN 1
                   WHEN title ~* '21[A-Z]{3}[0-9]' THEN 2
                   WHEN title ~* '18[A-Z]{3}[0-9]' THEN 3
                   WHEN title ~* '\\[[A-Z0-9]+\\]' THEN 4
                   ELSE 5
                 END, length(title) DESC, id ASC
             ) as rn
      FROM resources
      WHERE resource_type = 'NOTES';
    `);

    // Repoint bookmarks
    await neon.query(`
      UPDATE bookmarks b
      SET ref_id = d.keep_id
      FROM notes_dedup d
      WHERE b.ref_id = d.id AND b.kind = 'RESOURCE' AND d.rn > 1;
    `);

    // Repoint vtu_discovered_resources
    await neon.query(`
      UPDATE vtu_discovered_resources v
      SET uploaded_resource_id = d.keep_id
      FROM notes_dedup d
      WHERE v.uploaded_resource_id = d.id AND d.rn > 1;
    `);

    // Delete redundant Notes
    const notesDel = await neon.query(`
      DELETE FROM resources
      WHERE id IN (SELECT id FROM notes_dedup WHERE rn > 1);
    `);
    console.log(`Deleted ${notesDel.rowCount} duplicate note rows.`);

    await neon.query('COMMIT');
    console.log('✅ EXECUTED FILE DEDUPLICATION SUCCESSFULLY!');

    const finalCounts = await neon.query(`
      SELECT resource_type, count(*) as count 
      FROM resources 
      GROUP BY resource_type
    `);
    console.table(finalCounts.rows);

    const bcv301 = await neon.query(`
      SELECT id, title, file_url, resource_type 
      FROM resources 
      WHERE subject_code = 'BCV301' OR title ILIKE '%BCV301%'
    `);
    console.log('BCV301 final:');
    console.table(bcv301.rows);

  } catch (e) {
    await neon.query('ROLLBACK');
    console.error('Error during file dedup:', e);
    throw e;
  } finally {
    await neon.end();
  }
}

executeFileDedup().catch(console.error);
