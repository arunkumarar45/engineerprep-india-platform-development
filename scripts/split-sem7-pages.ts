import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

async function main() {
  const filePath = path.join(process.cwd(), "public", "vtu-official-syllabus", "VTU-Official-2022-CSE-Sem7-Syllabus.pdf");
  const data = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(data);
  const total = pdfDoc.getPageCount();

  const outDir = path.join(process.cwd(), "public", "vtu-official-syllabus", "temp-pages");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (let i = 0; i < total; i++) {
    const subDoc = await PDFDocument.create();
    const [copiedPage] = await subDoc.copyPages(pdfDoc, [i]);
    subDoc.addPage(copiedPage);
    const subBytes = await subDoc.save();
    fs.writeFileSync(path.join(outDir, `page-${i + 1}.pdf`), subBytes);
  }

  console.log(`Exported all ${total} pages to public/vtu-official-syllabus/temp-pages/`);

  // Let's also check 714cse.pdf
  const electPath = path.join(process.cwd(), "public", "vtu-official-syllabus", "VTU-Official-2022-CSE-Sem7-Electives-Full-Syllabus.pdf");
  if (fs.existsSync(electPath)) {
    const electData = fs.readFileSync(electPath);
    const electDoc = await PDFDocument.load(electData);
    console.log(`714cse.pdf (Electives) total pages: ${electDoc.getPageCount()}`);
  }

  process.exit(0);
}
main();

