import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/db";
import { resources, subjects } from "../src/db/schema";
import { eq, sql, like } from "drizzle-orm";

const NOTES_DIR = path.join(process.cwd(), "public", "vtu-notes");
if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR, { recursive: true });

async function downloadDrivePdf(fileId: string, destPath: string): Promise<boolean> {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 2000) {
    return true;
  }
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return false;
    const buf = await res.arrayBuffer();
    // Verify it is actually a PDF (starts with %PDF)
    const header = Buffer.from(buf).slice(0, 5).toString("utf-8");
    if (header.startsWith("%PDF")) {
      fs.writeFileSync(destPath, Buffer.from(buf));
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

async function main() {
  console.log("📥 Caching Google Drive notes into local public/vtu-notes/ directory...");

  // Specifically download the 3d8388d2-e942-4b2e-9c84-dbcc329e714a (BCS714B Module 5) first!
  const targetId = "3d8388d2-e942-4b2e-9c84-dbcc329e714a";
  const [target] = await db.select().from(resources).where(eq(resources.id, targetId));
  if (target && target.fileUrl) {
    const m = target.fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (m) {
      const destName = `BCS714B-Module-5-Complete-Notes.pdf`;
      const destPath = path.join(NOTES_DIR, destName);
      const ok = await downloadDrivePdf(m[1], destPath);
      if (ok) {
        await db
          .update(resources)
          .set({
            fileUrl: `/vtu-notes/${destName}`,
            fileName: destName,
            fileSize: `PDF ${(fs.statSync(destPath).size / 1024).toFixed(0)} KB`,
            status: "PUBLISHED",
          })
          .where(eq(resources.id, targetId));
        console.log(`✅ Fixed target resource ${targetId} -> /vtu-notes/${destName}!`);
      }
    }
  }

  // Find all remaining NOTES with Google Drive URLs
  const gdriveNotes = await db
    .select({
      id: resources.id,
      title: resources.title,
      fileUrl: resources.fileUrl,
      fileName: resources.fileName,
      subjCode: subjects.code,
    })
    .from(resources)
    .leftJoin(subjects, eq(resources.subjectId, subjects.id))
    .where(like(resources.fileUrl, "%drive.google.com%"));

  console.log(`Found ${gdriveNotes.length} resources with Google Drive URLs.`);
  let successCount = 0;
  let failCount = 0;

  for (const item of gdriveNotes) {
    const m = item.fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!m) continue;
    const driveId = m[1];
    const safeCode = (item.subjCode || "VTU").replace(/[^a-zA-Z0-9]/g, "");
    const safeName = (item.fileName || `${safeCode}-Notes.pdf`).replace(/[^a-zA-Z0-9_.-]/g, "_");
    const destName = `${safeCode}-${safeName}`;
    const destPath = path.join(NOTES_DIR, destName);

    const ok = await downloadDrivePdf(driveId, destPath);
    if (ok) {
      const sizeKb = (fs.statSync(destPath).size / 1024).toFixed(0);
      await db
        .update(resources)
        .set({
          fileUrl: `/vtu-notes/${destName}`,
          fileName: destName,
          fileSize: `PDF ${sizeKb} KB`,
          status: "PUBLISHED",
        })
        .where(eq(resources.id, item.id));
      successCount++;
      if (successCount % 10 === 0) {
        console.log(`  Downloaded & cached ${successCount} notes PDFs...`);
      }
    } else {
      failCount++;
    }
  }

  console.log(`\n🎉 Results: Successfully cached ${successCount} Google Drive notes to local PDFs. (Failed/Expired: ${failCount})`);
  process.exit(0);
}

main().catch(console.error);

