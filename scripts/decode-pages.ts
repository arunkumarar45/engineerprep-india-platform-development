import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { PDFDocument } from "pdf-lib";

async function main() {
  const filePath = path.join(process.cwd(), "public", "vtu-official-syllabus", "VTU-Official-2022-CSE-Sem7-Syllabus.pdf");
  const data = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(data);

  // Let's inspect objects in context to find ToUnicode maps
  let cmaps: string[] = [];
  pdfDoc.context.enumerateIndirectObjects().forEach(([ref, obj]) => {
    if (obj.constructor.name === "PDFStream") {
      try {
        const stream = obj as any;
        const uncompressed = zlib.inflateSync(Buffer.from(stream.contents));
        const str = uncompressed.toString("utf8");
        if (str.includes("beginbfchar") || str.includes("beginbfrange")) {
          cmaps.push(str);
        }
      } catch (e) {}
    }
  });

  console.log(`Found ${cmaps.length} ToUnicode CMaps.`);
  if (cmaps.length > 0) {
    // Build unicode map from hex to char
    const map = new Map<string, string>();
    for (const cmap of cmaps) {
      const charMatches = cmap.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g);
      for (const m of charMatches) {
        const charCode = parseInt(m[2], 16);
        map.set(m[1].toLowerCase(), String.fromCharCode(charCode));
      }
      const rangeMatches = cmap.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g);
      for (const m of rangeMatches) {
        const start = parseInt(m[1], 16);
        const end = parseInt(m[2], 16);
        let dest = parseInt(m[3], 16);
        for (let code = start; code <= end; code++) {
          const hex = code.toString(16).padStart(4, "0").toLowerCase();
          map.set(hex, String.fromCharCode(dest++));
        }
      }
    }
    console.log(`Loaded ${map.size} glyph mappings!`);

    // Now decode each page!
    const total = pdfDoc.getPageCount();
    for (let i = 0; i < total; i++) {
      const page = pdfDoc.getPage(i);
      const contents = page.node.Contents();
      let decoded = "";

      if (contents) {
        const streams = Array.isArray(contents) ? contents : [contents];
        for (const sRef of streams) {
          try {
            const stream = pdfDoc.context.lookup(sRef) as any;
            const uncompressed = zlib.inflateSync(Buffer.from(stream.contents));
            const s = uncompressed.toString("latin1");
            const hexMatches = s.matchAll(/<([0-9A-Fa-f]+)>/g);
            for (const hm of hexMatches) {
              const hex = hm[1];
              for (let c = 0; c < hex.length; c += 4) {
                const part = hex.slice(c, c + 4).toLowerCase();
                decoded += map.get(part) || "";
              }
            }
          } catch (e) {}
        }
      }

      console.log(`\n=== PAGE ${i + 1} Decoded ===`);
      console.log(decoded.replace(/\s+/g, " ").slice(0, 250));
    }
  }

  process.exit(0);
}
main();

