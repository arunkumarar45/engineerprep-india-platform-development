import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

async function main() {
  const filePath = path.join(process.cwd(), "public", "vtu-official-syllabus", "VTU-Official-2022-CSE-Sem7-Syllabus.pdf");
  const data = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(data);
  const pageCount = pdfDoc.getPageCount();

  console.log(`VTU-Official-2022-CSE-Sem7-Syllabus.pdf has ${pageCount} pages.`);

  // Let's create single-subject PDFs or check how subjects are divided!
  // In VTU scheme:
  // Semester 7 CSE has:
  // BCS701: Internet of Things (IoT)
  // BCS702: Parallel Computing
  // BCS703: Cryptography and Network Security
  // BCS704: ...
  
  process.exit(0);
}
main();

