import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/db";
import { resources, subjects } from "../src/db/schema";
import { eq, and, sql, ilike } from "drizzle-orm";

const QP_DIR = path.join(process.cwd(), "public", "vtu-official-qp");
if (!fs.existsSync(QP_DIR)) {
  fs.mkdirSync(QP_DIR, { recursive: true });
}

// Download helper with retry
async function downloadPdf(url: string, destFileName: string): Promise<string | null> {
  const destPath = path.join(QP_DIR, destFileName);
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
    console.log(`  [Cached] ${destFileName}`);
    return `/vtu-official-qp/${destFileName}`;
  }

  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (res.ok) {
        const buffer = await res.arrayBuffer();
        if (buffer.byteLength > 1000) {
          fs.writeFileSync(destPath, Buffer.from(buffer));
          console.log(`  [Downloaded] ${destFileName} (${(buffer.byteLength / 1024).toFixed(0)} KB)`);
          return `/vtu-official-qp/${destFileName}`;
        }
      }
    } catch (e: any) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  return null;
}

async function main() {
  console.log("🚀 Starting VTU Official Question Paper Downloader & Database Linker...");

  // 1. Scrape VTU model question paper page for all official /pdf/QP/ links
  const url = "https://vtu.ac.in/en/model-question-paper-b-e-b-tech-b-arch/";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) {
    console.error("Could not fetch VTU MQP page:", res.status);
    process.exit(1);
  }

  const html = await res.text();
  const anchors = [...html.matchAll(/<a[^>]*href=["'](https?:\/\/[^"']+\.pdf)["'][^>]*>([\s\S]*?)<\/a>/gi)];

  const qpMap = new Map<string, string>(); // code -> url

  for (const a of anchors) {
    const link = a[1];
    const text = a[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (link.includes("/pdf/QP/") || link.includes("/QP/") || link.includes("BEC30") || link.includes("BCS")) {
      // Extract subject code, e.g. BCS301, 1BMATC101, BEC302, etc.
      const match = link.match(/\/([12]?[A-Z]{2,4}\d{3}[A-Z]?)(?:set\d|_\w+)?\.pdf$/i) || text.match(/^([12]?[A-Z]{2,4}\d{3}[A-Z]?)$/i);
      if (match) {
        const code = match[1].toUpperCase().replace(/^1/, ""); // normalize 1BMATC101 -> BMATC101
        if (!qpMap.has(code)) {
          qpMap.set(code, link);
        }
      }
    }
  }

  console.log(`Discovered ${qpMap.size} distinct official subject QP links from vtu.ac.in`);

  let totalUpdated = 0;

  for (const [code, qpUrl] of qpMap.entries()) {
    // Find matching subjects in our DB
    const matchedSubjects = await db
      .select()
      .from(subjects)
      .where(sql`code ILIKE ${code} OR code ILIKE ${'%' + code}`);

    if (matchedSubjects.length === 0) continue;

    console.log(`\nSubject Match: ${code} (${matchedSubjects.length} records in DB)`);
    const localFileName = `VTU-Official-${code}-Model-Question-Paper.pdf`;
    const localUrl = await downloadPdf(qpUrl, localFileName);

    if (localUrl) {
      for (const subj of matchedSubjects) {
        const result = await db
          .update(resources)
          .set({
            fileUrl: localUrl,
            fileName: localFileName,
            fileSize: "PDF 450 KB",
          })
          .where(
            and(
              eq(resources.subjectId, subj.id),
              eq(resources.resourceType, "QUESTION_PAPER")
            )
          );
        totalUpdated += result.rowCount || 0;
      }
    }
  }

  // 2. Also clean up any remaining self-referencing /vtu/view/ URLs across all resources
  console.log("\n🧹 Cleaning up any remaining self-referencing /vtu/view/ URLs...");
  const cleanResult = await db.execute(sql`
    UPDATE resources
    SET file_url = ''
    WHERE file_url LIKE '/vtu/view/%'
  `);
  console.log(`Cleared ${cleanResult.rowCount} self-referencing URLs.`);

  console.log(`\n🎉 Success! Updated ${totalUpdated} question papers with real official VTU PDFs.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

