import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

async function checkHigherSem() {
  const url = "https://vtu.ac.in/en/model-question-paper-b-e-b-tech-b-arch/";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  const anchors = [...html.matchAll(/<a[^>]*href=["'](https?:\/\/[^"']+\.pdf)["'][^>]*>([\s\S]*?)<\/a>/gi)];

  const qpList = [];
  for (const a of anchors) {
    const link = a[1];
    const text = a[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (link.includes("/pdf/QP/") || link.includes("/QP/") || link.includes("model")) {
      qpList.push({ text, link });
    }
  }
  console.log(`Total /QP/ links: ${qpList.length}`);
  console.log("Sample:", qpList.slice(20, 60));
}

checkHigherSem();

