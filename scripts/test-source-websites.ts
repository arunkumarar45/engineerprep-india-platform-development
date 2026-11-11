import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

async function testSources() {
  const sources = [
    { name: "VTU Official", url: "https://vtu.ac.in/en/model-question-paper-b-e-b-tech-b-arch/" },
    { name: "VTU Circle", url: "https://vtucircle.com" },
    { name: "VTU Sync", url: "https://vtusync.com" },
  ];

  for (const s of sources) {
    try {
      const res = await fetch(s.url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(6000),
      });
      console.log(`[${s.name}] ${s.url} -> HTTP ${res.status}`);
    } catch (e: any) {
      console.log(`[${s.name}] ${s.url} -> Error: ${e.message}`);
    }
  }
  process.exit(0);
}
testSources();

