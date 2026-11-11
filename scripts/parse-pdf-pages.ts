import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { PDFDocument } from "pdf-lib";

async function main() {
  const filePath = path.join(process.cwd(), "public", "vtu-official-syllabus", "VTU-Official-2022-CSE-Sem7-Syllabus.pdf");
  const data = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(data);
  const total = pdfDoc.getPageCount();

  for (let i = 0; i < total; i++) {
    const page = pdfDoc.getPage(i);
    // page.node is the PDFPageLeaf
    const contents = page.node.Contents();
    let pageText = "";

    if (contents) {
      const streams = Array.isArray(contents) ? contents : [contents];
      for (const streamRef of streams) {
        try {
          const stream = pdfDoc.context.lookup(streamRef) as any;
          const raw = stream.contents;
          const uncompressed = zlib.inflateSync(Buffer.from(raw));
          const s = uncompressed.toString("latin1");
          // Extract strings inside parentheses
          const matches = Array.from(s.matchAll(/\(([^)\\]*(?:\\.[^)\\]*)*)\)/g)).map(m => m[1]);
          pageText += matches.join(" ");
        } catch (e) {
          // not compressed
        }
      }
    }

    console.log(`\n=== PAGE ${i + 1} ===`);
    console.log(pageText.slice(0, 300));
  }

  process.exit(0);
}
main();

