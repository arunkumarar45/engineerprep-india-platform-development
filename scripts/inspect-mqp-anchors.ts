import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

async function filterMqp() {
  const url = "https://vtu.ac.in/en/model-question-paper-b-e-b-tech-b-arch/";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  const anchors = [...html.matchAll(/<a[^>]*href=["'](https?:\/\/[^"']+\.pdf)["'][^>]*>([\s\S]*?)<\/a>/gi)];

  const matched = [];
  for (const a of anchors) {
    const link = a[1];
    const text = a[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (/(BCS|BEC|BEE|BME|BCV|BIS|BMAT|BPHY|BCHE|BPOP|21|22|MQP|Model|Question)/i.test(text) || /(BCS|BEC|BEE|BME|BCV|BIS|21|22|mqp)/i.test(link)) {
      matched.push({ text, link });
    }
  }
  console.log(`Matched Model Question Papers: ${matched.length}`);
  console.log(matched.slice(0, 30));
}

filterMqp();
