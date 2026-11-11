import fs from "node:fs";
import path from "node:path";

async function main() {
  const dir = path.join(process.cwd(), "public", "vtu-official-syllabus", "temp-electives");
  const files = fs.readdirSync(dir).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ""), 10);
    const numB = parseInt(b.replace(/\D/g, ""), 10);
    return numA - numB;
  });

  for (const f of files) {
    const content = fs.readFileSync(path.join(dir, f)).toString("latin1");
    // Search for course codes like BCS...
    const matches = content.match(/\bB[A-Z]{2,4}[0-9]{3}[A-Z]?\b/g);
    console.log(`${f}: ${matches ? Array.from(new Set(matches)).join(", ") : "no code found"}`);
  }

  process.exit(0);
}
main();

