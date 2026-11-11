import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

async function findQpsAndLabs() {
  const res1 = await fetch("https://vtucircle.com/post-sitemap.xml", { headers: { "User-Agent": "Mozilla/5.0" } });
  const text1 = await res1.text();
  const res2 = await fetch("https://vtucircle.com/page-sitemap.xml", { headers: { "User-Agent": "Mozilla/5.0" } });
  const text2 = await res2.text();

  const allUrls = [
    ...text1.matchAll(/<loc>([^<]+)<\/loc>/g),
    ...text2.matchAll(/<loc>([^<]+)<\/loc>/g),
  ].map(x => x[1]);

  console.log("Total sitemap URLs:", allUrls.length);

  const labUrls = allUrls.filter(u => u.includes("lab") || u.includes("laboratory") || u.includes("program"));
  console.log(`\n=== Found ${labUrls.length} Lab/Program URLs ===`);
  console.log(labUrls);

  const qpUrls = allUrls.filter(u => u.includes("question") || u.includes("paper") || u.includes("model"));
  console.log(`\n=== Found ${qpUrls.length} Question Paper URLs ===`);
  console.log(qpUrls);
}

findQpsAndLabs();

