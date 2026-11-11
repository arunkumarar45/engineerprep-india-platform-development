import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

async function checkQPsAndLabs() {
  const urls = [
    "https://vtucircle.com/vtu-question-paper/",
    "https://vtucircle.com/operating-systems-laboratory-bcs303/",
    "https://vtucircle.com/data-structure-laboratory-bcsl305/",
    "https://vtucircle.com/analysis-and-design-of-algorithms-lab-bcsl404/",
    "https://vtucircle.com/database-management-system-laboratory-bcs403/",
    "https://vtucircle.com/internet-of-things-lab-bcs701/",
    "https://vtucircle.com/cryptography-and-network-security-bcs703/",
  ];

  for (const u of urls) {
    try {
      const res = await fetch(u, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      console.log(`\nURL: ${u} (Status: ${res.status})`);
      if (res.ok) {
        const html = await res.text();
        const drives = [...html.matchAll(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/g)].map(x => x[1]);
        console.log("  Drives:", drives);

        const pdfLinks = [...html.matchAll(/href=["'](https?:\/\/[^"']+\.pdf)["']/gi)].map(x => x[1]);
        console.log("  Direct PDFs:", pdfLinks);

        // Find module or download links
        const downloadBtns = [...html.matchAll(/href=["'](https:\/\/vtucircle\.com\/([a-z0-9-]+)\/?)["'][^>]*class=["'][^"']*download[^"']*["']/gi)].map(x => x[1]);
        console.log("  Download buttons:", downloadBtns);
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }
  }
}

checkQPsAndLabs();

