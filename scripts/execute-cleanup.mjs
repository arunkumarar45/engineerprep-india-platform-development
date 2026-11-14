import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import { Client } from 'pg';

async function cleanup() {
  const neonHost = 'ep-restless-lab-b3mahzws-pooler.c-4.ap-southeast-1.aws.neon.tech';
  const ips = await dns.resolve4(neonHost);
  const neon = new Client({
    host: ips[0], port: 5432, user: 'neondb_owner', password: 'npg_HsQcpjaRIo48', database: 'neondb',
    ssl: { rejectUnauthorized: false, servername: neonHost }
  });
  await neon.connect();

  console.log('--- STARTING DATABASE CANONICALIZATION & DEDUPLICATION ---');
  await neon.query('BEGIN');

  try {
    // 1. CANONICALIZE BRANCHES
    console.log('1. Canonicalizing branches...');
    const branches = await neon.query(`SELECT id, code, name FROM branches`);
    const branchMap = new Map(); // code -> { keepId, removeIds: [] }
    for (const b of branches.rows) {
      if (!branchMap.has(b.code)) {
        branchMap.set(b.code, { keepId: b.id, removeIds: [] });
      } else {
        // Find which one has more subjects
        const prev = branchMap.get(b.code);
        const prevCount = (await neon.query('SELECT count(*) FROM subjects WHERE branch_id = $1', [prev.keepId])).rows[0].count;
        const curCount = (await neon.query('SELECT count(*) FROM subjects WHERE branch_id = $1', [b.id])).rows[0].count;
        if (Number(curCount) > Number(prevCount)) {
          prev.removeIds.push(prev.keepId);
          prev.keepId = b.id;
        } else {
          prev.removeIds.push(b.id);
        }
      }
    }

    for (const [code, info] of branchMap.entries()) {
      if (info.removeIds.length > 0) {
        console.log(`Branch ${code}: keeping ${info.keepId}, removing ${info.removeIds.join(', ')}`);
        for (const remId of info.removeIds) {
          await neon.query('UPDATE subjects SET branch_id = $1 WHERE branch_id = $2', [info.keepId, remId]);
          await neon.query('UPDATE resources SET branch_id = $1 WHERE branch_id = $2', [info.keepId, remId]);
          await neon.query('UPDATE vtu_discovered_resources SET branch_id = $1 WHERE branch_id = $2', [info.keepId, remId]);
          await neon.query('DELETE FROM branches WHERE id = $1', [remId]);
        }
      }
    }

    // 2. CANONICALIZE SEMESTERS
    console.log('2. Canonicalizing semesters...');
    const semesters = await neon.query(`SELECT id, number, label FROM semesters ORDER BY number`);
    const semMap = new Map(); // number -> { keepId, removeIds: [] }
    for (const s of semesters.rows) {
      if (!semMap.has(s.number)) {
        semMap.set(s.number, { keepId: s.id, removeIds: [] });
      } else {
        const prev = semMap.get(s.number);
        const prevCount = (await neon.query('SELECT count(*) FROM subjects WHERE semester_id = $1', [prev.keepId])).rows[0].count;
        const curCount = (await neon.query('SELECT count(*) FROM subjects WHERE semester_id = $1', [s.id])).rows[0].count;
        if (Number(curCount) > Number(prevCount)) {
          prev.removeIds.push(prev.keepId);
          prev.keepId = s.id;
        } else {
          prev.removeIds.push(s.id);
        }
      }
    }

    for (const [number, info] of semMap.entries()) {
      if (info.removeIds.length > 0) {
        console.log(`Semester ${number}: keeping ${info.keepId}, removing ${info.removeIds.join(', ')}`);
        for (const remId of info.removeIds) {
          await neon.query('UPDATE subjects SET semester_id = $1 WHERE semester_id = $2', [info.keepId, remId]);
          await neon.query('UPDATE resources SET semester_id = $1 WHERE semester_id = $2', [info.keepId, remId]);
          await neon.query('UPDATE vtu_discovered_resources SET semester_id = $1 WHERE semester_id = $2', [info.keepId, remId]);
          await neon.query('DELETE FROM semesters WHERE id = $1', [remId]);
        }
      }
    }

    // 3. CANONICALIZE SCHEMES
    console.log('3. Canonicalizing schemes...');
    const schemes = await neon.query(`SELECT id, name FROM schemes`);
    const schemeMap = new Map(); // normName -> { keepId, removeIds: [] }
    for (const sc of schemes.rows) {
      const norm = sc.name.replace(/\s*Scheme$/i, '').trim();
      if (!schemeMap.has(norm)) {
        schemeMap.set(norm, { keepId: sc.id, removeIds: [] });
      } else {
        const prev = schemeMap.get(norm);
        const prevCount = (await neon.query('SELECT count(*) FROM subjects WHERE scheme_id = $1', [prev.keepId])).rows[0].count;
        const curCount = (await neon.query('SELECT count(*) FROM subjects WHERE scheme_id = $1', [sc.id])).rows[0].count;
        if (Number(curCount) > Number(prevCount)) {
          prev.removeIds.push(prev.keepId);
          prev.keepId = sc.id;
        } else {
          prev.removeIds.push(sc.id);
        }
      }
    }

    for (const [norm, info] of schemeMap.entries()) {
      // Standardize scheme name
      await neon.query('UPDATE schemes SET name = $1 WHERE id = $2', [norm, info.keepId]);
      if (info.removeIds.length > 0) {
        console.log(`Scheme ${norm}: keeping ${info.keepId}, removing ${info.removeIds.join(', ')}`);
        for (const remId of info.removeIds) {
          await neon.query('UPDATE subjects SET scheme_id = $1 WHERE scheme_id = $2', [info.keepId, remId]);
          await neon.query('UPDATE resources SET scheme_id = $1 WHERE scheme_id = $2', [info.keepId, remId]);
          await neon.query('UPDATE vtu_discovered_resources SET scheme_id = $1 WHERE scheme_id = $2', [info.keepId, remId]);
          await neon.query('DELETE FROM schemes WHERE id = $1', [remId]);
        }
      }
    }

    // 4. LINK RESOURCES WITH SUBJECTS & THEIR BRANCH/SEMESTER/SCHEME
    console.log('4. Linking resources to subjects, branches, semesters, schemes...');
    // Link subject_id if null but subject_code matches
    await neon.query(`
      UPDATE resources r
      SET subject_id = s.id
      FROM subjects s
      WHERE r.subject_id IS NULL AND r.subject_code IS NOT NULL AND r.subject_code = s.code
    `);

    // Propagate branch_id, semester_id, scheme_id from subjects to resources
    await neon.query(`
      UPDATE resources r
      SET branch_id = s.branch_id,
          semester_id = s.semester_id,
          scheme_id = s.scheme_id
      FROM subjects s
      WHERE r.subject_id = s.id AND (r.branch_id IS NULL OR r.semester_id IS NULL OR r.scheme_id IS NULL)
    `);

    // 5. DEDUPLICATE RESOURCES
    console.log('5. Deduplicating resources table...');
    const dups = await neon.query(`
      SELECT id,
             FIRST_VALUE(id) OVER (
               PARTITION BY resource_type, title, file_url 
               ORDER BY created_at ASC NULLS LAST, id ASC
             ) as keep_id,
             ROW_NUMBER() OVER (
               PARTITION BY resource_type, title, file_url 
               ORDER BY created_at ASC NULLS LAST, id ASC
             ) as rn
      FROM resources
    `);

    const toDelete = dups.rows.filter(r => r.rn > 1);
    console.log(`Found ${toDelete.length} redundant duplicate resources to delete.`);

    for (const d of toDelete) {
      // Repoint any references in bookmarks
      await neon.query('UPDATE bookmarks SET ref_id = $1 WHERE ref_id = $2 AND kind = $3', [d.keep_id, d.id, 'RESOURCE']);
      // Repoint any references in vtu_discovered_resources
      await neon.query('UPDATE vtu_discovered_resources SET uploaded_resource_id = $1 WHERE uploaded_resource_id = $2', [d.keep_id, d.id]);
      // Repoint any references in downloads
      await neon.query('UPDATE downloads SET resource_id = $1 WHERE resource_id = $2', [d.keep_id, d.id]);
      // Delete the duplicate resource
      await neon.query('DELETE FROM resources WHERE id = $1', [d.id]);
    }

    // 6. FIX ANY REMAINING MODULE MISMATCHES
    console.log('6. Checking module numbers in titles...');
    const fixModuleResult = await neon.query(`
      UPDATE resources
      SET module_number = SUBSTRING(title FROM '(?i)Module\\s*([1-5])')::int
      WHERE title ~* '(?i)Module\\s*([1-5])'
        AND (module_number IS NULL OR module_number != SUBSTRING(title FROM '(?i)Module\\s*([1-5])')::int)
    `);
    console.log(`Module numbers updated: ${fixModuleResult.rowCount}`);

    await neon.query('COMMIT');
    console.log('✅ DATABASE CLEANUP COMMITTED SUCCESSFULLY!');

    // Post-check counts
    const finalCounts = await neon.query(`
      SELECT resource_type, count(*) as count 
      FROM resources 
      GROUP BY resource_type
    `);
    console.log('Final Resource counts:');
    console.table(finalCounts.rows);

    const bcv301After = await neon.query(`
      SELECT id, title, file_url FROM resources WHERE subject_code = 'BCV301' OR title ILIKE '%BCV301%'
    `);
    console.log('BCV301 records after deduplication:', bcv301After.rows.length);
    console.table(bcv301After.rows);

  } catch (err) {
    await neon.query('ROLLBACK');
    console.error('FAILED, ROLLED BACK:', err);
    throw err;
  } finally {
    await neon.end();
  }
}

cleanup().catch(console.error);
