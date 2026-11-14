import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function fastCleanup() {
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);
  const neon = new Client({
    host: ips[0], port: 5432, user: 'neondb_owner', password: 'npg_HsQcpjaRIo48', database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });
  await neon.connect();

  console.log('--- STARTING FAST BATCH DATABASE CLEANUP ---');
  await neon.query('BEGIN');

  try {
    // 1. CANONICALIZE BRANCHES
    console.log('1. Canonicalizing branches...');
    const bCIV = '90035796-8785-4d9a-a771-4485e82d1c2b'; // 162 subjects
    const bCSE = '88171def-3722-4ec4-9072-6a42960ae0d3'; // 229 subjects
    const bECE = '3ad35192-4033-4312-b24a-f37c0cc4b76c'; // 165 subjects
    const bEEE = 'b698cc91-571a-41d2-8378-34e6985d4376'; // 162 subjects
    const bISE = '7f3048df-2c16-4b3b-aa2c-6fa567e706cf'; // 129 subjects
    const bME  = 'dd1769ad-81cd-4370-933c-62397cc54d4e'; // 159 subjects

    const branchCanonical = [
      { code: 'CIV', keep: bCIV, remove: 'b2f9979e-6598-482e-a1e4-9dfe67bd4f0e' },
      { code: 'CSE', keep: bCSE, remove: '41df8d06-f622-4e7d-854c-7424e9aa9097' },
      { code: 'ECE', keep: bECE, remove: 'aaccd162-2a78-4f86-997b-d490ab4818d3' },
      { code: 'EEE', keep: bEEE, remove: 'cff8baba-f99b-4dd4-88ad-c4ea4fe76556' },
      { code: 'ISE', keep: bISE, remove: 'e66b987c-8856-4a8a-a0bc-2daefcc6201c' },
      { code: 'ME',  keep: bME,  remove: '9fad2177-fcf8-4ccd-be27-8fdecba9426e' },
    ];

    for (const b of branchCanonical) {
      await neon.query('UPDATE subjects SET branch_id = $1 WHERE branch_id = $2', [b.keep, b.remove]);
      await neon.query('UPDATE resources SET branch_id = $1 WHERE branch_id = $2', [b.keep, b.remove]);
      await neon.query('UPDATE vtu_discovered_resources SET branch_id = $1 WHERE branch_id = $2', [b.keep, b.remove]);
      await neon.query('DELETE FROM branches WHERE id = $1', [b.remove]);
    }

    // 2. CANONICALIZE SEMESTERS
    console.log('2. Canonicalizing semesters...');
    const s1 = 'a95cf6d9-50b6-460d-a7ca-19daf4621ba0';
    const s2 = 'c945cdfd-eb5b-4fb4-8a31-8c57309e289f';
    const s3 = 'f34f46c4-8ea5-43c0-b867-efa39ac01786';
    const s4 = '51718510-9118-4d93-a18c-04fc1f2c8cad';
    const s5 = '632c5a5b-d96d-4e74-808a-0d0a0d7c7498';
    const s6 = '0f446a43-50f9-4ec3-9bdb-bbff574345fe';
    const s7 = 'efb3987e-1c7f-41d5-9c89-e8c241a1cc71';
    const s8 = '4c8474a5-2d31-4a1e-aca2-bb42ceb259a7';

    const semCanonical = [
      { sem: 1, keep: s1, remove: '3b152ce1-7678-492a-a63c-1c6117eebaf0' },
      { sem: 2, keep: s2, remove: 'b133ecb4-9e92-4c17-a1ed-559f61d2a788' },
      { sem: 3, keep: s3, remove: '7fdfb735-1971-41a1-87ae-c783bd3ed9a1' },
      { sem: 4, keep: s4, remove: '5697387b-cd54-4971-a4d2-f1410244c911' },
      { sem: 5, keep: s5, remove: 'd5634a87-c637-49cc-8f76-7d44ed7f937f' },
      { sem: 6, keep: s6, remove: '8d9c5b8c-0e73-42bd-a8b3-c319ed8621ef' },
      { sem: 7, keep: s7, remove: '0b45c7e2-b59b-4fec-a553-45b939810c32' },
      { sem: 8, keep: s8, remove: '8bd900f1-8e32-4886-85c4-687b46ce4a1a' },
    ];

    for (const s of semCanonical) {
      await neon.query('UPDATE subjects SET semester_id = $1 WHERE semester_id = $2', [s.keep, s.remove]);
      await neon.query('UPDATE resources SET semester_id = $1 WHERE semester_id = $2', [s.keep, s.remove]);
      await neon.query('UPDATE vtu_discovered_resources SET semester_id = $1 WHERE semester_id = $2', [s.keep, s.remove]);
      await neon.query('DELETE FROM semesters WHERE id = $1', [s.remove]);
    }

    // 3. CANONICALIZE SCHEMES
    console.log('3. Canonicalizing schemes...');
    const sc2018 = 'be7ae251-5407-4108-ae63-fce59b16f294';
    const sc2021 = '957b58ea-0651-49a1-92c2-b5b8aaebb82d';
    const sc2022 = 'f384a7c0-ba66-4f32-89e2-1152809e830c';
    const sc2025 = 'ae57adea-b5e3-40af-aab5-0403bc1a4dfd';
    const sc2026 = '9acd1c3b-934a-4ab7-85c9-a96666fb9d61';

    const schemeCanonical = [
      { name: '2022', keep: sc2022, remove: '933dbaf5-f6a8-4667-ab28-81817dbd6225' },
      { name: '2025', keep: sc2025, remove: 'bbb895c1-a553-4375-8765-6267a08946c9' },
      { name: '2026', keep: sc2026, remove: '5ce7232f-fb5e-4a86-b66b-cb6545a9ea03' },
    ];

    for (const sc of schemeCanonical) {
      await neon.query('UPDATE subjects SET scheme_id = $1 WHERE scheme_id = $2', [sc.keep, sc.remove]);
      await neon.query('UPDATE resources SET scheme_id = $1 WHERE scheme_id = $2', [sc.keep, sc.remove]);
      await neon.query('UPDATE vtu_discovered_resources SET scheme_id = $1 WHERE scheme_id = $2', [sc.keep, sc.remove]);
      await neon.query('DELETE FROM schemes WHERE id = $1', [sc.remove]);
    }

    // Ensure scheme names are clean (without trailing ' Scheme' for 2018/2021/etc. or standardizing)
    await neon.query("UPDATE schemes SET name = '2018' WHERE name = '2018 Scheme'");
    await neon.query("UPDATE schemes SET name = '2021' WHERE name = '2021 Scheme'");

    // 4. LINK RESOURCES TO SUBJECTS & METADATA
    console.log('4. Linking resources to subjects, branches, semesters, schemes...');
    await neon.query(`
      UPDATE resources r
      SET subject_id = s.id
      FROM subjects s
      WHERE r.subject_id IS NULL AND r.subject_code IS NOT NULL AND r.subject_code = s.code
    `);

    await neon.query(`
      UPDATE resources r
      SET branch_id = s.branch_id,
          semester_id = s.semester_id,
          scheme_id = s.scheme_id
      FROM subjects s
      WHERE r.subject_id = s.id AND (r.branch_id IS NULL OR r.semester_id IS NULL OR r.scheme_id IS NULL)
    `);

    // 5. BATCH DEDUPLICATE RESOURCES
    console.log('5. Batch deduplicating resources table...');
    // Create temporary table with keep_id and duplicate ids
    await neon.query(`
      CREATE TEMP TABLE res_dups_to_delete AS
      SELECT id,
             FIRST_VALUE(id) OVER (
               PARTITION BY resource_type, title, file_url 
               ORDER BY created_at ASC NULLS LAST, id ASC
             ) as keep_id,
             ROW_NUMBER() OVER (
               PARTITION BY resource_type, title, file_url 
               ORDER BY created_at ASC NULLS LAST, id ASC
             ) as rn
      FROM resources;
    `);

    // Repoint references
    await neon.query(`
      UPDATE bookmarks b
      SET ref_id = d.keep_id
      FROM res_dups_to_delete d
      WHERE b.ref_id = d.id AND b.kind = 'RESOURCE' AND d.rn > 1;
    `);

    await neon.query(`
      UPDATE vtu_discovered_resources v
      SET uploaded_resource_id = d.keep_id
      FROM res_dups_to_delete d
      WHERE v.uploaded_resource_id = d.id AND d.rn > 1;
    `);

    await neon.query(`
      UPDATE downloads dl
      SET resource_id = d.keep_id
      FROM res_dups_to_delete d
      WHERE dl.resource_id = d.id AND d.rn > 1;
    `);

    // Batch delete
    const delRes = await neon.query(`
      DELETE FROM resources
      WHERE id IN (SELECT id FROM res_dups_to_delete WHERE rn > 1);
    `);
    console.log(`Deleted ${delRes.rowCount} redundant duplicate resources in single batch.`);

    // 6. FIX ANY MODULE NUMBER MISMATCHES
    const fixMod = await neon.query(`
      UPDATE resources
      SET module_number = SUBSTRING(title FROM '(?i)Module\\s*([1-5])')::int
      WHERE title ~* '(?i)Module\\s*([1-5])'
        AND (module_number IS NULL OR module_number != SUBSTRING(title FROM '(?i)Module\\s*([1-5])')::int);
    `);
    console.log(`Fixed module numbers: ${fixMod.rowCount}`);

    await neon.query('COMMIT');
    console.log('✅ BATCH CLEANUP COMMITTED SUCCESSFULLY!');

    // Verify final stats
    const stats = await neon.query(`
      SELECT resource_type, count(*) as count 
      FROM resources 
      GROUP BY resource_type
    `);
    console.log('Final counts:');
    console.table(stats.rows);

    const bcv301 = await neon.query(`
      SELECT id, title, file_url, file_size 
      FROM resources 
      WHERE subject_code = 'BCV301' OR title ILIKE '%BCV301%'
    `);
    console.log('BCV301 rows remaining:');
    console.table(bcv301.rows);

  } catch (e) {
    await neon.query('ROLLBACK');
    console.error('ERROR during batch cleanup:', e);
    throw e;
  } finally {
    await neon.end();
  }
}

fastCleanup().catch(console.error);

