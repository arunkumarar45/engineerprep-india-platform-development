import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";

async function main() {
  console.log("=== Searching VTU Official Syllabus Pages ===");
  const urls = [
    "https://vtu.ac.in/en/b-e-scheme-syllabus/",
    "https://vtu.ac.in/en/category/b-e-scheme-syllabus/",
  ];

  for (const url of urls) {
    try {
      console.log(`\nFetching: ${url}`);
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      console.log(`Status: ${res.status}`);
      if (!res.ok) continue;

      const html = await res.text();
      // Match PDF links with keywords
      const matches = html.matchAll(/<a[^>]+href=["']([^"']+\.pdf)["'][^>]*>(.*?)<\/a>/gi);
      for (const m of matches) {
        const link = m[1];
        const text = m[2].replace(/<[^>]+>/g, "").trim();
        if (
          text.toLowerCase().includes("cse") ||
          text.toLowerCase().includes("computer") ||
          text.toLowerCase().includes("2022") ||
          text.toLowerCase().includes("2021") ||
          text.toLowerCase().includes("7th") ||
          text.toLowerCase().includes("sem") ||
          link.includes("CSE") ||
          link.includes("scheme")
        ) {
          console.log(`  [Link] ${text} -> ${link}`);
        }
      }
    } catch (err) {
      console.error("Error fetching", url, err);
    }
  }

  process.exit(0);
}
main();

