import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

async function checkLabDetail() {
  const url = "https://vtucircle.com/data-structure-laboratory-bcsl305/";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  const entryIdx = html.indexOf('class="entry-content');
  if (entryIdx !== -1) {
    console.log(html.substring(entryIdx, entryIdx + 3000));
  }
}

checkLabDetail();

