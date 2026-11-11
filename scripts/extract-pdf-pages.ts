import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

async function main() {
  const filePath = path.join(process.cwd(), "public", "vtu-official-syllabus", "VTU-Official-2022-CSE-Sem7-Syllabus.pdf");
  const data = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(data);
  const total = pdfDoc.getPageCount();

  console.log(`Total pages: ${total}`);

  // Let's create single page PDFs and inspect or check
  for (let i = 0; i < total; i++) {
    const subDoc = await PDFDocument.create();
    const [copiedPage] = await subDoc.copyPages(pdfDoc, [i]);
    subDoc.addPage(copiedPage);
    const subBytes = await subDoc.save();
    
    // Check if raw stream has text or if we can see markers
    const str = Buffer.from(subBytes).toString("latin1");
    // Look for text operators like Tj or TJ
    const textMatches = Array.from(str.matchAll(/\(([^)]+)\)\s*Tj/g)).map(m => m[1]);
    console.log(`Page ${i + 1}: ${textMatches.slice(0, 10).join(" ")}`);
  }

  process.exit(0);
}
main();

