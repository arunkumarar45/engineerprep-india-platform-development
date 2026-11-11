import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

async function checkVtuMqp() {
  const url = "https://vtu.ac.in/en/model-question-paper-b-e-b-tech-b-arch/";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  console.log("Status:", res.status);
  if (res.ok) {
    const html = await res.text();
    const pdfs = [...html.matchAll(/href=["'](https?:\/\/[^"']+\.pdf)["']/gi)].map(x => x[1]);
    console.log(`Found ${pdfs.length} PDFs on ${url}`);
    console.log("Sample PDFs:", pdfs.slice(0, 15));
  }
}

checkVtuMqp();

