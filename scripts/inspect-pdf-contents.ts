import fs from "node:fs";
import path from "node:path";

async function main() {
  const file1 = path.join(process.cwd(), "public", "vtu-official-syllabus", "VTU-Official-2022-CSE-Sem7-Syllabus.pdf");
  const file2 = path.join(process.cwd(), "public", "vtu-official-syllabus", "VTU-Official-2022-CSE-Sem7-Syllabus-BCS701.pdf");
  const file3 = path.join(process.cwd(), "public", "vtu-official-syllabus", "VTU-Official-2022-CSE-Sem7-Electives-Syllabus.pdf");

  console.log("File 1 size:", fs.statSync(file1).size);
  console.log("File 2 size:", fs.statSync(file2).size);
  console.log("File 3 size:", fs.statSync(file3).size);

  const buf1 = fs.readFileSync(file1);
  const text1 = buf1.toString("latin1");

  console.log("\nSearching for BCS701 in File 1:", text1.includes("BCS701"));
  console.log("Searching for BCS702 in File 1:", text1.includes("BCS702"));
  console.log("Searching for BCS703 in File 1:", text1.includes("BCS703"));
  console.log("Searching for Cryptography in File 1:", text1.toLowerCase().includes("cryptography"));
  console.log("Searching for Cloud Computing in File 1:", text1.toLowerCase().includes("cloud computing"));

  const buf3 = fs.readFileSync(file3);
  const text3 = buf3.toString("latin1");
  console.log("\nSearching for BCS703 in File 3 (Electives):", text3.includes("BCS703"));
  console.log("Searching for Cryptography in File 3:", text3.toLowerCase().includes("cryptography"));

  process.exit(0);
}
main();

