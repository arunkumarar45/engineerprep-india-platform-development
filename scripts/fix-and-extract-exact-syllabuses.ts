import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { db } from "../src/db";
import { resources, subjects } from "../src/db/schema";
import { sql, eq, and, or } from "drizzle-orm";

async function extractRange(srcDoc: PDFDocument, startPage: number, endPage: number, destPath: string) {
  const newDoc = await PDFDocument.create();
  const pageIndices: number[] = [];
  for (let p = startPage - 1; p < endPage; p++) {
    pageIndices.push(p);
  }
  const copied = await newDoc.copyPages(srcDoc, pageIndices);
  for (const page of copied) {
    newDoc.addPage(page);
  }
  const bytes = await newDoc.save();
  fs.writeFileSync(destPath, bytes);
  const sizeKb = (bytes.length / 1024).toFixed(0);
  console.log(`  [Extracted] ${path.basename(destPath)} (${pageIndices.length} pages, ${sizeKb} KB)`);
  return { fileName: path.basename(destPath), sizeKb };
}

async function main() {
  console.log("=== Splitting Official VTU Scheme Syllabuses by Subject ===");

  const SYL_DIR = path.join(process.cwd(), "public", "vtu-official-syllabus");

  // 1. Core Sem 7 Syllabus (7csesyll.pdf)
  const coreSource = path.join(SYL_DIR, "VTU-Official-2022-CSE-Sem7-Syllabus.pdf");
  const coreDoc = await PDFDocument.load(fs.readFileSync(coreSource));

  // BCS701: Pages 1 to 4
  const bcs701 = await extractRange(
    coreDoc,
    1,
    4,
    path.join(SYL_DIR, "VTU-Official-BCS701-IoT-Syllabus.pdf"),
  );

  // BCS702: Pages 5 to 8
  const bcs702 = await extractRange(
    coreDoc,
    5,
    8,
    path.join(SYL_DIR, "VTU-Official-BCS702-Parallel-Computing-Syllabus.pdf"),
  );

  // BCS703: Pages 9 to 11
  const bcs703 = await extractRange(
    coreDoc,
    9,
    11,
    path.join(SYL_DIR, "VTU-Official-BCS703-Cryptography-Syllabus.pdf"),
  );

  // 2. Electives Sem 7 Syllabus (714cse.pdf)
  const electSource = path.join(SYL_DIR, "VTU-Official-2022-CSE-Sem7-Electives-Full-Syllabus.pdf");
  if (fs.existsSync(electSource)) {
    const electDoc = await PDFDocument.load(fs.readFileSync(electSource));

    // BCS714A Deep Learning: Pages 1 to 4
    await extractRange(
      electDoc,
      1,
      4,
      path.join(SYL_DIR, "VTU-Official-BCS714A-Deep-Learning-Syllabus.pdf"),
    );

    // BCS714B NLP: Pages 5 to 8
    await extractRange(
      electDoc,
      5,
      8,
      path.join(SYL_DIR, "VTU-Official-BCS714B-NLP-Syllabus.pdf"),
    );

    // BCS714D Big Data: Pages 9 to 14
    await extractRange(
      electDoc,
      9,
      14,
      path.join(SYL_DIR, "VTU-Official-BCS714D-Big-Data-Analytics-Syllabus.pdf"),
    );

    // BCS755A DBMS: Pages 15 to 17
    await extractRange(
      electDoc,
      15,
      17,
      path.join(SYL_DIR, "VTU-Official-BCS755A-DBMS-Syllabus.pdf"),
    );

    // BCS755B Algorithms: Pages 18 to 21
    await extractRange(
      electDoc,
      18,
      21,
      path.join(SYL_DIR, "VTU-Official-BCS755B-Algorithms-Syllabus.pdf"),
    );

    // BCS755C Software Engineering: Pages 22 to 24
    await extractRange(
      electDoc,
      22,
      24,
      path.join(SYL_DIR, "VTU-Official-BCS755C-Software-Engineering-Syllabus.pdf"),
    );
  }

  // 3. Precise Subject-to-Syllabus Re-mapping
  console.log("\n=== Updating Database with Precise Subject Syllabi ===");

  const mappings = [
    // BCS701 Internet of Things
    {
      codes: ["BCS701", "22BCS701", "25BCS701", "26BCS701"],
      file: "VTU-Official-BCS701-IoT-Syllabus.pdf",
      title: "Internet of Things (IoT) — Official VTU Syllabus & Scheme of Teaching",
    },
    // BCS702 Parallel Computing
    {
      codes: ["BCS702", "22BCS702", "25BCS702", "26BCS702"],
      file: "VTU-Official-BCS702-Parallel-Computing-Syllabus.pdf",
      title: "Parallel Computing — Official VTU Syllabus & Scheme of Teaching",
    },
    // BCS703 Cryptography & Network Security
    {
      codes: ["BCS703", "22BCS703", "25BCS703", "26BCS703"],
      file: "VTU-Official-BCS703-Cryptography-Syllabus.pdf",
      title: "Cryptography and Network Security — Official VTU Syllabus & Scheme of Teaching",
    },
    // BCS714A Deep Learning
    {
      codes: ["BCS714A", "22BCS714A", "25BCS714A", "26BCS714A"],
      file: "VTU-Official-BCS714A-Deep-Learning-Syllabus.pdf",
      title: "Deep Learning — Official VTU Syllabus & Scheme of Teaching",
    },
    // BCS714B Natural Language Processing
    {
      codes: ["BCS714B", "22BCS714B", "25BCS714B", "26BCS714B"],
      file: "VTU-Official-BCS714B-NLP-Syllabus.pdf",
      title: "Natural Language Processing (NLP) — Official VTU Syllabus & Scheme of Teaching",
    },
    // BCS714D Big Data Analytics
    {
      codes: ["BCS714D", "22BCS714D", "25BCS714D", "26BCS714D"],
      file: "VTU-Official-BCS714D-Big-Data-Analytics-Syllabus.pdf",
      title: "Big Data Analytics — Official VTU Syllabus & Scheme of Teaching",
    },
    // BCS755A DBMS
    {
      codes: ["BCS755A"],
      file: "VTU-Official-BCS755A-DBMS-Syllabus.pdf",
      title: "Introduction to DBMS — Official VTU Syllabus & Scheme of Teaching",
    },
    // BCS755B Algorithms
    {
      codes: ["BCS755B"],
      file: "VTU-Official-BCS755B-Algorithms-Syllabus.pdf",
      title: "Introduction to Algorithms — Official VTU Syllabus & Scheme of Teaching",
    },
    // BCS755C Software Engineering
    {
      codes: ["BCS755C"],
      file: "VTU-Official-BCS755C-Software-Engineering-Syllabus.pdf",
      title: "Software Engineering — Official VTU Syllabus & Scheme of Teaching",
    },
  ];

  for (const m of mappings) {
    const fullPath = path.join(SYL_DIR, m.file);
    const sizeKb = (fs.statSync(fullPath).size / 1024).toFixed(0);

    for (const code of m.codes) {
      const res = await db.execute(sql`
        UPDATE resources
        SET file_url = ${`/vtu-official-syllabus/${m.file}`},
            file_name = ${m.file},
            file_size = ${`PDF ${sizeKb} KB`},
            status = 'PUBLISHED'
        WHERE resource_type = 'SYLLABUS'
          AND subject_id IN (SELECT id FROM subjects WHERE UPPER(code) = ${code});
      `);
      console.log(`  [Mapped] ${code} -> ${m.file} (${res.rowCount} rows updated)`);
    }
  }

  // 4. UNLINK IoT Syllabus from All Non-IoT Subjects!
  console.log("\n=== Unlinking IoT Syllabus from Unrelated Non-IoT Subjects ===");
  const unlinkRes = await db.execute(sql`
    DELETE FROM resources
    WHERE resource_type = 'SYLLABUS'
      AND (
        file_url LIKE '%BCS701%' OR
        file_url = '/vtu-official-syllabus/VTU-Official-2022-CSE-Sem7-Syllabus.pdf'
      )
      AND subject_id NOT IN (
        SELECT id FROM subjects
        WHERE UPPER(code) IN ('BCS701', '22BCS701', '25BCS701', '26BCS701')
      );
  `);
  console.log(`Unlinked IoT syllabus from ${unlinkRes.rowCount} unrelated subjects!`);

  // 5. Verification of the target from the screenshot (10596f60-f759-450d-8df7-463e475002ee / BCS703)
  console.log("\n=== Verifying BCS703 Cryptography Syllabus Row ===");
  const bcs703Rows = await db.execute(sql`
    SELECT r.id, r.title, r.file_url, r.file_name, s.code, s.name
    FROM resources r
    JOIN subjects s ON r.subject_id = s.id
    WHERE r.resource_type = 'SYLLABUS' AND s.code = 'BCS703';
  `);
  console.log("BCS703 in database:", bcs703Rows.rows);

  // 6. Verification of Notes count (Must remain 4112)
  const [notesRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(resources)
    .where(eq(resources.resourceType, "NOTES"));
  console.log(`\nNotes Count: ${notesRow.count} (Must be exactly 4112)`);

  // Clean up temp directories
  fs.rmSync(path.join(SYL_DIR, "temp-pages"), { recursive: true, force: true });
  fs.rmSync(path.join(SYL_DIR, "temp-electives"), { recursive: true, force: true });
  console.log("Cleaned up temp directories.");

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

