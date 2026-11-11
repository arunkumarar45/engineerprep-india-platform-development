import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

async function checkHigherSemesters() {
  const url = "https://vtu.ac.in/en/model-question-paper-b-e-b-tech-b-arch/";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  const anchors = [...html.matchAll(/<a[^>]*href=["'](https?:\/\/[^"']+\.pdf)["'][^>]*>([\s\S]*?)<\/a>/gi)];

  const sem3to8 = [];
  for (const a of anchors) {
    const link = a[1];
    const text = a[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (link.includes("/pdf/QP/") || link.includes("/QP/")) {
      const codeMatch = link.match(/\/([A-Z0-9]+)\.pdf$/i) || text.match(/([A-Z0-9]+)/i);
      if (codeMatch && /[3-8]\d{2}/.test(codeMatch[1])) {
        sem3to8.push({ text, code: codeMatch[1], link });
      }
    }
  }
  console.log(`Higher semester QP matches: ${sem3to8.length}`);
  console.log("Sample:", sem3to8.slice(0, 30));
}

checkHigherSemesters();

