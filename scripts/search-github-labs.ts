import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

async function checkRepo(repo: string) {
  const url = `https://api.github.com/repos/${repo}/git/trees/master?recursive=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "EngineerPrep-Crawler/1.0" },
  });
  if (!res.ok) {
    console.log(`Failed ${repo}: ${res.status}`);
    return;
  }
  const data = await res.json();
  const pdfs = (data.tree || []).filter((f: any) => f.path.endsWith(".pdf"));
  console.log(`Repo ${repo} has ${pdfs.length} PDFs:`);
  for (const p of pdfs) {
    console.log(`  - ${p.path} (Size: ${p.size})`);
  }
}

async function main() {
  await checkRepo("fsmk/CS-VTU-Lab-Manual");
  await checkRepo("amruthpillai/CS-VTU-Lab-Manual");
  process.exit(0);
}

main().catch(console.error);
