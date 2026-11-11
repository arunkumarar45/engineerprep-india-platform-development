import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

async function main() {
  const urls = [
    "http://127.0.0.1:3000/images/hero-student.png",
    "http://127.0.0.1:3000/thumbnails/dsa-sheets/striver-a2z-dsa-sheet.jpg",
    "http://127.0.0.1:3000/thumbnails/dsa-sheets/love-babbar-dsa-sheet.jpg",
    "http://127.0.0.1:3000/thumbnails/dsa-sheets/shraddha-khapra-dsa-sheet.jpg",
    "http://127.0.0.1:3000/thumbnails/dsa-sheets/rohit-negi-dsa-sheet.jpg",
    "http://127.0.0.1:3000/thumbnails/dsa-sheets/arsh-goyal-dsa-sheet.jpg",
    "http://127.0.0.1:3000/thumbnails/dsa-sheets/neetcode-dsa-sheet.jpg",
    "http://127.0.0.1:3000/thumbnails/dsa-sheets/20-essential-dsa-patterns.jpg",
    "http://127.0.0.1:3000/thumbnails/dsa-playlists/kunal-kushwaha-dsa-bootcamp.jpg",
    "http://127.0.0.1:3000/thumbnails/dsa-playlists/fraz-dsa-playlist.jpg",
    "http://127.0.0.1:3000/thumbnails/dsa-playlists/code-with-aryan-system-design-playlist.jpg",
  ];

  console.log("Checking HTTP status codes on local server...");
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      console.log(`[HTTP ${res.status}] ${url}`);
    } catch (e: any) {
      console.log(`[CONNECT ERROR] ${url} -> ${e.message}`);
    }
  }
}

main().catch(console.error);

