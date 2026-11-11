import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";

async function main() {
  const res = await fetch("https://vtu.ac.in/en/b-e-scheme-syllabus/", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  const html = await res.text();

  const regex = /<a[^>]+href=["']([^"']+\.pdf)["'][^>]*>(.*?)<\/a>/gi;
  let match;
  const list2022_3to8: { text: string; link: string }[] = [];

  while ((match = regex.exec(html)) !== null) {
    const link = match[1];
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    if (link.includes("2022_3to8")) {
      list2022_3to8.push({ text, link });
    }
  }

  console.log(`Found ${list2022_3to8.length} links in 2022_3to8:`);
  for (const item of list2022_3to8) {
    console.log(`  - [${item.text}] -> ${item.link}`);
  }

  process.exit(0);
}
main();

