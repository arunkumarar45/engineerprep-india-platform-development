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
  const list: { text: string; link: string }[] = [];

  while ((match = regex.exec(html)) !== null) {
    const link = match[1];
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    if (link.includes("2022") || link.includes("2021") || link.includes("cs") || link.includes("CS") || text.includes("CS") || text.includes("CSE")) {
      list.push({ text, link });
    }
  }

  console.log(`Found ${list.length} relevant syllabus links:`);
  for (const item of list) {
    console.log(`- ${item.text}: ${item.link}`);
  }

  process.exit(0);
}
main();

