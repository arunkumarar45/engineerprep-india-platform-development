import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

async function main() {
  console.log("Downloading https://vtu.ac.in/pdf/2022_3to8/7csesyll.pdf...");
  const res = await fetch("https://vtu.ac.in/pdf/2022_3to8/7csesyll.pdf", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  console.log("Status:", res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  console.log("Downloaded size:", buf.length);

  const targetPath = path.join(process.cwd(), "public", "vtu-official-syllabus", "VTU-Official-2022-CSE-Sem7-Full-Syllabus.pdf");
  fs.writeFileSync(targetPath, buf);

  // Check 714cse.pdf (electives)
  console.log("\nDownloading https://vtu.ac.in/pdf/2022_3to8/714cse.pdf...");
  const res2 = await fetch("https://vtu.ac.in/pdf/2022_3to8/714cse.pdf", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  console.log("Status:", res2.status);
  const buf2 = Buffer.from(await res2.arrayBuffer());
  console.log("Downloaded size:", buf2.length);
  const targetPath2 = path.join(process.cwd(), "public", "vtu-official-syllabus", "VTU-Official-2022-CSE-Sem7-Electives-Full-Syllabus.pdf");
  fs.writeFileSync(targetPath2, buf2);

  process.exit(0);
}
main();

