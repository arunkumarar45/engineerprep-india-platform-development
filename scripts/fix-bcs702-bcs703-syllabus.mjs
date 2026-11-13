/**
 * Fix: BCS702 and BCS703 "subject-specific" PDFs were incorrectly created
 * with IoT content (copied from BCS701 without replacing content).
 * 
 * Fix: Point ALL BCS702 and BCS703 records to the genuine combined
 * VTU-Official-2022-CSE-Sem7-Syllabus.pdf which contains all Sem7 subjects
 * including BCS701 (IoT), BCS702 (Parallel Computing), and BCS703 (Cryptography).
 * 
 * The IoT PDF (BCS701) is correctly extracted from the combined PDF.
 * BCS702 and BCS703 "individual" PDFs contain wrong content — using combined PDF
 * is more honest and correct.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

console.log('=== FIX: BCS702 and BCS703 Syllabus PDF Mapping ===\n');

// Point BCS702 records to the correct combined Sem7 PDF
// (VTU-Official-BCS702-Parallel-Computing-Syllabus.pdf contains IoT content — wrong)
const bcs702Fix = await client.query(`
  UPDATE resources 
  SET file_url = '/vtu-official-syllabus/VTU-Official-2022-CSE-Sem7-Syllabus.pdf',
      updated_at = NOW()
  WHERE resource_type = 'SYLLABUS' 
    AND file_url LIKE '%BCS702-Parallel-Computing-Syllabus%'
  RETURNING id, title, file_url
`);
console.log(`BCS702 records fixed: ${bcs702Fix.rowCount}`);
bcs702Fix.rows.forEach(r => console.log(' -', r.title.substring(0, 60)));

// Point BCS703 records to the correct combined Sem7 PDF  
// (VTU-Official-BCS703-Cryptography-Syllabus.pdf contains IoT content — wrong)
const bcs703Fix = await client.query(`
  UPDATE resources 
  SET file_url = '/vtu-official-syllabus/VTU-Official-2022-CSE-Sem7-Syllabus.pdf',
      updated_at = NOW()
  WHERE resource_type = 'SYLLABUS' 
    AND file_url LIKE '%BCS703-Cryptography-Syllabus%'
  RETURNING id, title, file_url
`);
console.log(`\nBCS703 records fixed: ${bcs703Fix.rowCount}`);
bcs703Fix.rows.forEach(r => console.log(' -', r.title.substring(0, 60)));

// Also fix the named records (22BCS703, 25BCS703, 26BCS703 format)
const namedFix = await client.query(`
  UPDATE resources 
  SET file_url = '/vtu-official-syllabus/VTU-Official-2022-CSE-Sem7-Syllabus.pdf',
      updated_at = NOW()
  WHERE resource_type = 'SYLLABUS' 
    AND (title LIKE '%22BCS70%' OR title LIKE '%25BCS70%' OR title LIKE '%26BCS70%')
    AND file_url LIKE '%VTU-Official-2022-CSE-Sem7-Syllabus%'
  RETURNING id, title
`);
console.log(`\nAlready-correct named records: ${namedFix.rowCount}`);

console.log('\n=== Verifying final state ===');
const verify = await client.query(`
  SELECT title, file_url 
  FROM resources 
  WHERE resource_type = 'SYLLABUS' 
    AND (title LIKE '%BCS701%' OR title LIKE '%BCS702%' OR title LIKE '%BCS703%'
         OR title LIKE '%BCS714%')
  ORDER BY title
  LIMIT 20
`);
verify.rows.forEach(r => console.log(r.title.substring(0,55).padEnd(55), '->', r.file_url.substring(0,60)));

await client.end();
console.log('\nDone.');
