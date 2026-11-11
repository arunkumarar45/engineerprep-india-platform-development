import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

async function main() {
  const pages = [
    "http://127.0.0.1:3000/",
    "http://127.0.0.1:3000/placements/dsa-sheets",
    "http://127.0.0.1:3000/placements/dsa-playlists",
    "http://127.0.0.1:3000/admin/dsa",
    "http://127.0.0.1:3000/admin/playlists",
  ];

  console.log("Checking Page HTTP status codes...");
  for (const page of pages) {
    try {
      const res = await fetch(page);
      const text = await res.text();
      console.log(`[HTTP ${res.status}] ${page} (Length: ${text.length} bytes)`);
    } catch (e: any) {
      console.log(`[PAGE ERROR] ${page} -> ${e.message}`);
    }
  }
}

main().catch(console.error);

