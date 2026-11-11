import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

async function main() {
  const filePath = path.join(process.cwd(), "public", "vtu-official-syllabus", "VTU-Official-2022-CSE-Sem7-Syllabus.pdf");
  const data = fs.readFileSync(filePath);

  // Find all FlateDecode streams and decompress them
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  let streamIndex = 0;
  let fullText = "";

  while ((match = streamRegex.exec(data.toString("binary"))) !== null) {
    const rawStream = Buffer.from(match[1], "binary");
    try {
      const decompressed = zlib.inflateSync(rawStream);
      const text = decompressed.toString("utf8");
      fullText += `\n--- Stream ${streamIndex++} ---\n` + text;
    } catch (e) {
      // not flate or error
    }
  }

  // Look for course codes like BCS... or subject names
  console.log("Decompressed text length:", fullText.length);
  const codes = fullText.match(/\bB[A-Z]{2,4}[0-9]{3}[A-Z]?\b/g);
  console.log("Course codes found in VTU-Official-2022-CSE-Sem7-Syllabus.pdf:", Array.from(new Set(codes)));

  // Look for subject titles
  const lines = fullText.split("\n").filter(l => l.includes("Course Code") || l.includes("Semester") || l.includes("Credits") || l.includes("BCS"));
  console.log("Sample lines:", lines.slice(0, 30));

  process.exit(0);
}
main();

