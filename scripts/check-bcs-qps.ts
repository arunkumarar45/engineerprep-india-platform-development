import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

async function checkBcsQps() {
  const url = "https://vtu.ac.in/en/model-question-paper-b-e-b-tech-b-arch/";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  const anchors = [...html.matchAll(/<a[^>]*href=["'](https?:\/\/[^"']+\.pdf)["'][^>]*>([\s\S]*?)<\/a>/gi)];

  const bcs = [];
  for (const a of anchors) {
    const link = a[1];
    const text = a[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (link.includes("BCS") || text.includes("BCS") || link.includes("BEC") || text.includes("BEC")) {
      bcs.push({ text, link });
    }
  }
  console.log(`BCS / BEC QPs: ${bcs.length}`);
  console.log(bcs.slice(0, 30));
}

checkBcsQps();

