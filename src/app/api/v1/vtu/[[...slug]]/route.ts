import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, vtuUpdates } from "@/db/schema";
import {
  getBranches,
  getSemesters,
  getSchemes,
  getSubjects,
  getVtuUpdates,
} from "@/lib/queries";
import { requireAdmin } from "@/lib/auth";
import { queueNotification } from "@/lib/automation";
import { apiError, apiSuccess, handleError } from "@/lib/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const { slug } = await context.params;
    if (slug?.[0] === "meta") {
      const [branches, semesters, schemes, subjects] = await Promise.all([
        getBranches(),
        getSemesters(),
        getSchemes(),
        getSubjects(),
      ]);
      return apiSuccess({ branches, semesters, schemes, subjects }, "Metadata loaded");
    }
    const updates = await getVtuUpdates();
    return apiSuccess({ updates }, "VTU updates fetched");
  } catch (error) {
    return handleError(error, "Unable to load VTU data");
  }
}

const updateSchema = z.object({
  title: z.string().min(4),
  category: z.string().min(2),
  summary: z.string().optional(),
  fileUrl: z.string().optional(),
  fileSize: z.string().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const { slug } = await context.params;

    // ── Manual sync from VTU official portal ──────────────────────────
    if (slug?.[0] === "sync") {
      const admin = await requireAdmin();

      let fetched: {
        title: string;
        category: string;
        summary: string;
        fileUrl?: string;
        fileSize?: string;
        publishedAt: Date;
      }[] = [];

      try {
        // Method 1: Official VTU WordPress REST API (fastest, structured, accurate)
        const wpRes = await fetch("https://vtu.ac.in/wp-json/wp/v2/posts?per_page=20", {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(15000),
        });

        if (wpRes.ok) {
          const posts = await wpRes.json();
          if (Array.isArray(posts) && posts.length > 0) {
            fetched = posts.map((p) => {
              const rawTitle = (p.title?.rendered ?? "")
                .replace(/&#8211;/g, "–")
                .replace(/&#8212;/g, "—")
                .replace(/&#8220;/g, '“')
                .replace(/&#8221;/g, '”')
                .replace(/&#038;/g, "&")
                .replace(/&amp;/g, "&")
                .replace(/<[^>]+>/g, "")
                .trim();

              const contentHtml = p.content?.rendered ?? "";
              const pdfMatch = contentHtml.match(/href="([^"]*\.pdf)"/i) || contentHtml.match(/(https?:\/\/[^\s"']+\.pdf)/i);
              const fileUrl = pdfMatch ? pdfMatch[1].replace(/\\\//g, "/") : undefined;

              const sizeMatch = contentHtml.match(/Size:\s*([^<]+)/i);
              const fileSize = sizeMatch ? sizeMatch[1].trim() : fileUrl ? "PDF" : undefined;

              const lower = rawTitle.toLowerCase();
              let category = "General";
              if (lower.includes("exam") || lower.includes("result") || lower.includes("timetable") || lower.includes("revaluation") || lower.includes("marks")) {
                category = "Examinations";
              } else if (lower.includes("circular") || lower.includes("order")) {
                category = "Circular";
              } else if (lower.includes("notification") || lower.includes("fee") || lower.includes("registration")) {
                category = "Notification";
              } else if (lower.includes("academic") || lower.includes("calendar")) {
                category = "Academic";
              }

              return {
                title: rawTitle,
                category,
                summary: rawTitle,
                fileUrl,
                fileSize,
                publishedAt: new Date(p.date ?? Date.now()),
              };
            });
          }
        }
      } catch (err) {
        console.warn("VTU REST API sync failed, trying HTML fallback:", err);
      }

      if (fetched.length === 0) {
        try {
          const res = await fetch("https://vtu.ac.in/", {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              Accept: "text/html",
            },
            signal: AbortSignal.timeout(15000),
          });

          if (res.ok) {
            const html = await res.text();
            fetched = parseVtuAnnouncements(html).map((item) => ({
              ...item,
              publishedAt: new Date(),
            }));
          }
        } catch {
          return apiSuccess(
            { synced: 0, skipped: 0 },
            "VTU portal unreachable. Try again later or add updates manually.",
          );
        }
      }

      let synced = 0;
      let skipped = 0;

      for (const item of fetched) {
        const existing = await db
          .select({ id: vtuUpdates.id })
          .from(vtuUpdates)
          .where(eq(vtuUpdates.title, item.title))
          .limit(1);

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        const [created] = await db
          .insert(vtuUpdates)
          .values({
            title: item.title,
            category: item.category,
            summary: item.summary,
            fileUrl: item.fileUrl ?? null,
            fileSize: item.fileSize ?? null,
            publishedAt: item.publishedAt,
            createdBy: admin.id,
          })
          .returning();

        synced++;
      }

      return apiSuccess(
        { synced, skipped, total: fetched.length },
        synced > 0
          ? `Synced ${synced} real updates from official VTU portal`
          : fetched.length === 0
            ? "No announcements found on VTU portal."
            : `All ${skipped} updates already up to date`,
      );
    }

    // ── Manual update creation ─────────────────────────────────────────
    if (slug?.[0] !== "updates") return apiError("Unknown action", 404);
    const admin = await requireAdmin();
    const body = updateSchema.parse(await request.json());
    const [created] = await db
      .insert(vtuUpdates)
      .values({ ...body, createdBy: admin.id })
      .returning();

    const students = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "STUDENT"));
    for (const student of students) {
      await queueNotification({
        userId: student.id,
        type: "VTU_UPDATE",
        title: created.title,
        body: created.summary ?? "A new VTU update has been published.",
        linkUrl: "/vtu/updates",
        idempotencyKey: `vtu-update-${created.id}-${student.id}`,
      });
    }

    return apiSuccess({ update: created }, "VTU update published", 201);
  } catch (error) {
    return handleError(error, "Unable to publish VTU update");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    await requireAdmin();
    const { slug } = await context.params;
    const id = slug?.[1];
    if (!id) return apiError("Update id is required", 400);
    await db.delete(vtuUpdates).where(eq(vtuUpdates.id, id));
    return apiSuccess({ id }, "VTU update deleted");
  } catch (error) {
    return handleError(error, "Unable to delete VTU update");
  }
}

/* ------------------------------------------------------------------ */
/* VTU HTML parser                                                      */
/* ------------------------------------------------------------------ */

function parseVtuAnnouncements(html: string) {
  const results: {
    title: string;
    category: string;
    summary: string;
    fileUrl?: string;
  }[] = [];

  // Extract announcement items from VTU portal HTML
  // Matches patterns like <li>...<a href="...">Title</a>...</li>
  const listItemRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  const linkRe = /<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i;
  const dateRe = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\w+ \d{4})\b/;

  let match: RegExpExecArray | null;
  while ((match = listItemRe.exec(html)) !== null) {
    const item = match[1];
    const linkMatch = linkRe.exec(item);
    if (!linkMatch) continue;

    const href = linkMatch[1].trim();
    const rawTitle = linkMatch[2].replace(/<[^>]+>/g, "").trim();
    if (!rawTitle || rawTitle.length < 10) continue;

    // Skip navigation items
    if (["Home", "About", "Academics", "Research"].includes(rawTitle)) continue;

    const dateMatch = dateRe.exec(item);
    const dateStr = dateMatch ? ` (${dateMatch[1]})` : "";

    // Categorise by keyword
    let category = "General";
    const lower = rawTitle.toLowerCase();
    if (lower.includes("exam") || lower.includes("result") || lower.includes("timetable")) {
      category = "Examinations";
    } else if (lower.includes("circular") || lower.includes("notice") || lower.includes("order")) {
      category = "Circular";
    } else if (lower.includes("tender") || lower.includes("quotation")) {
      category = "Tenders";
    } else if (lower.includes("admission") || lower.includes("pg") || lower.includes("ug")) {
      category = "Admissions";
    } else if (lower.includes("notification") || lower.includes("announcement")) {
      category = "Announcement";
    }

    const fileUrl = href.startsWith("http") ? href : `https://www.vtu.ac.in${href}`;

    results.push({
      title: rawTitle.slice(0, 255) + dateStr,
      category,
      summary: `Official VTU announcement: ${rawTitle}`,
      fileUrl: href.includes(".pdf") ? fileUrl : undefined,
    });

    if (results.length >= 20) break; // cap at 20 per sync
  }

  return results;
}
