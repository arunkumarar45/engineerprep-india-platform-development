import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/db";
import { resources, subjects } from "../src/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("🔗 Re-linking ALL official local materials to all matching subjects...");

  const QP_DIR = path.join(process.cwd(), "public", "vtu-official-qp");
  const SYL_DIR = path.join(process.cwd(), "public", "vtu-official-syllabus");
  const LAB_DIR = path.join(process.cwd(), "public", "vtu-official-labs");

  // 1. Re-link Question Papers
  const qpFiles = fs.readdirSync(QP_DIR);
  for (const file of qpFiles) {
    const m = file.match(/VTU-Official-([A-Z0-9]+)-(?:Model-)?Question-Paper\.pdf/i);
    if (!m) continue;
    const code = m[1].toUpperCase();
    const sizeKb = (fs.statSync(path.join(QP_DIR, file)).size / 1024).toFixed(0);

    const res = await db.execute(sql`
      UPDATE resources
      SET file_url = ${`/vtu-official-qp/${file}`},
          file_name = ${file},
          file_size = ${`PDF ${sizeKb} KB`},
          status = 'PUBLISHED'
      WHERE resource_type = 'QUESTION_PAPER'
        AND subject_id IN (SELECT id FROM subjects WHERE UPPER(code) = ${code} OR UPPER(code) = ${'1' + code});
    `);
    if (res.rowCount && res.rowCount > 0) {
      console.log(`  [QP Linked] ${code} -> ${file} (${res.rowCount} rows)`);
    }
  }

  // 2. Re-link Syllabuses
  const sylFiles = fs.readdirSync(SYL_DIR);
  const sylMapping: Record<string, string[]> = {
    "VTU-Official-2022-CSE-Sem7-Syllabus.pdf": ["BCS701", "BCS702", "BCS703", "BCS704"],
    "VTU-Official-2022-CSE-Sem7-Electives-Syllabus.pdf": ["BCS714A", "BCS714B", "BCS714C", "BCS714D"],
    "VTU-Official-2022-CSE-Sem6-Syllabus.pdf": ["BCS601", "BCS602", "BCS613A", "BCS613C", "BCS613D"],
    "VTU-Official-2022-ECE-Sem7-Syllabus.pdf": ["BEC701", "BEC702", "BEC703"],
    "VTU-Official-2022-ECE-Sem7-Electives-Syllabus.pdf": ["BEC714A", "BEC714B", "BEC714C"],
    "VTU-Official-2022-BCSL404-Lab-Syllabus.pdf": ["BCSL404"],
    "VTU-Official-2022-BMEL305-Lab-Syllabus.pdf": ["BMEL305"],
    "VTU-Official-2022-BAGL606-Lab-Syllabus.pdf": ["BAGL606"],
    "VTU-Official-2022-CSE-Sem5-Syllabus.pdf": ["BCS501", "BCS502", "BCS503", "BCS515B", "BCS515C", "BCS515D"],
    "VTU-Official-2022-CSE-Sem3-4-Syllabus.pdf": ["BCS301", "BCS302", "BCS303", "BCS304", "BCS306A", "BCS401", "BCS402", "BCS403", "BCS405A"],
    "VTU-Official-2022-ECE-Sem5-Syllabus.pdf": ["BEC501", "BEC502", "BEC503"],
    "VTU-Official-2022-ECE-Sem3-4-Syllabus.pdf": ["BEC302", "BEC303", "BEC304", "BEC401", "BEC402", "BEC403"],
    "VTU-Official-2022-CIV-Sem3-4-Syllabus.pdf": ["BCV301", "BCV302", "BCV304", "BCV401", "BCV402", "BCV403"],
    "VTU-Official-2022-CIV-Sem7-Syllabus-BCV701.pdf": ["BCV701", "BCV702", "BCV703"],
    "VTU-Official-2022-EEE-Sem3-4-Syllabus.pdf": ["BEE302", "BEE303", "BEE304", "BEE401", "BEE402", "BEE403"],
    "VTU-Official-2022-EEE-Sem7-Syllabus-BEE701.pdf": ["BEE701", "BEE702", "BEE703"],
    "VTU-Official-2022-ME-Sem3-4-Syllabus.pdf": ["BME301", "BME303", "BME304", "BME401", "BME402", "BME403"],
    "VTU-Official-2022-ME-Sem7-Syllabus-BME701.pdf": ["BME701", "BME702", "BME703"],
    "VTU-Official-2022-BMATS101-Maths1-Syllabus.pdf": ["BMATS101", "BMATC101", "BMATE101"],
    "VTU-Official-2022-BMATC201-Maths2-Syllabus.pdf": ["BMATC201", "BMATS201", "BMATE201"],
    "VTU-Official-2022-BPHYS102-Physics-Syllabus.pdf": ["BPHYS102", "BPHYC102", "BPHYE102"],
    "VTU-Official-2022-BCHEM102-Chemistry-Syllabus.pdf": ["BCHEM102", "BCHEC102", "BCHEE102"],
    "VTU-Official-2022-BPOPS103-Programming-in-C-Syllabus.pdf": ["BPOPS103", "BPLCK105A", "BPLCK105B"],
  };

  for (const [file, codes] of Object.entries(sylMapping)) {
    const fullPath = path.join(SYL_DIR, file);
    if (!fs.existsSync(fullPath)) continue;
    const sizeKb = (fs.statSync(fullPath).size / 1024).toFixed(0);

    for (const code of codes) {
      const res = await db.execute(sql`
        UPDATE resources
        SET file_url = ${`/vtu-official-syllabus/${file}`},
            file_name = ${file},
            file_size = ${`PDF ${sizeKb} KB`},
            status = 'PUBLISHED'
        WHERE resource_type = 'SYLLABUS'
          AND subject_id IN (SELECT id FROM subjects WHERE UPPER(code) = ${code} OR UPPER(code) = ${'1' + code});
      `);
      if (res.rowCount && res.rowCount > 0) {
        console.log(`  [Syllabus Linked] ${code} -> ${file} (${res.rowCount} rows)`);
      }
    }
  }

  // 3. Re-link Lab Manuals
  const labFiles = fs.readdirSync(LAB_DIR);
  for (const file of labFiles) {
    const m = file.match(/([A-Z0-9]+)-(?:Official-)?Laboratory-Manual\.pdf/i);
    if (!m) continue;
    const code = m[1].toUpperCase();
    const fullPath = path.join(LAB_DIR, file);
    const sizeKb = (fs.statSync(fullPath).size / 1024).toFixed(0);

    const res = await db.execute(sql`
      UPDATE resources
      SET file_url = ${`/vtu-official-labs/${file}`},
          file_name = ${file},
          file_size = ${`PDF ${sizeKb} KB`},
          status = 'PUBLISHED'
      WHERE resource_type = 'LAB_MANUAL'
        AND subject_id IN (SELECT id FROM subjects WHERE UPPER(code) = ${code} OR UPPER(code) = ${'1' + code});
    `);
    if (res.rowCount && res.rowCount > 0) {
      console.log(`  [Lab Manual Linked] ${code} -> ${file} (${res.rowCount} rows)`);
    }
  }

  // 4. Ensure NO self-referencing /vtu/view/... URLs exist
  const fixSelf = await db.execute(sql`
    UPDATE resources
    SET file_url = ''
    WHERE file_url LIKE '/vtu/view/%'
  `);
  console.log(`Cleared ${fixSelf.rowCount} self-referencing URLs.`);

  console.log("✅ Re-linking completed successfully!");
  process.exit(0);
}

main().catch(console.error);

