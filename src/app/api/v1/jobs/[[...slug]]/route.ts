import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { companies, jobApplications, opportunities, savedOpportunities } from "@/db/schema";
import { getOpportunities } from "@/lib/queries";
import { requireAdmin, requireUser } from "@/lib/auth";
import { queueNotification } from "@/lib/automation";
import { apiError, apiSuccess, handleError, paginate } from "@/lib/api";

const filterSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  branch: z.string().optional(),
  batch: z.string().optional(),
  location: z.string().optional(),
  mode: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(6),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const { slug } = await context.params;
    const url = new URL(request.url);

    if (slug?.[0] === "saved") {
      const user = await requireUser();
      const rows = await db
        .select({ opportunityId: savedOpportunities.opportunityId })
        .from(savedOpportunities)
        .where(eq(savedOpportunities.userId, user.id));
      const ids = new Set(rows.map((r) => r.opportunityId));
      const all = await getOpportunities();
      return apiSuccess(
        { opportunities: all.filter((o) => ids.has(o.id)) },
        "Saved opportunities fetched",
      );
    }

    const filters = filterSchema.parse(Object.fromEntries(url.searchParams));
    const rows = await getOpportunities(filters);
    const { rows: page, meta } = paginate(rows, filters.page, filters.pageSize);
    return apiSuccess({ opportunities: page, meta }, "Opportunities fetched");
  } catch (error) {
    return handleError(error, "Unable to load opportunities");
  }
}

const applySchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  college: z.string().min(2),
  branch: z.string().min(1),
  graduationYear: z.coerce.number().int().min(2020).max(2035),
  resumeUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  notes: z.string().optional(),
});

// Community job submission schema (anyone can post)
const submitJobSchema = z.object({
  companyName: z.string().min(2).max(160),
  title: z.string().min(3).max(220),
  location: z.string().min(2).max(160),
  experienceRange: z.string().default("0-1"),
  opportunityType: z.enum(["JOB", "INTERNSHIP", "OFF_CAMPUS"]).default("JOB"),
  workMode: z.enum(["ONSITE", "REMOTE", "HYBRID"]).default("ONSITE"),
  applicationUrl: z.string().url("Must be a valid URL"),
  whatsappChannelUrl: z.string().url().optional(),
  source: z.string().default("Community"),
  description: z.string().max(1000).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const { slug } = await context.params;
    const user = await requireUser();
    const id = slug?.[1];

    // ── Community job submission (any logged-in user) ──────────────────
    if (slug?.[0] === "submit") {
      const body = submitJobSchema.parse(await request.json());

      // Auto-create or find company record
      let companyId: string | null = null;
      const [existingCompany] = await db
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.name, body.companyName))
        .limit(1);

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        // Create a minimal company record
        const logoText = body.companyName.slice(0, 2).toUpperCase();
        const logoColors = ["#1a56db", "#0ea5e9", "#7c3aed", "#059669", "#dc2626", "#d97706"];
        const logoColor = logoColors[body.companyName.charCodeAt(0) % logoColors.length];
        const [newCompany] = await db
          .insert(companies)
          .values({
            name: body.companyName,
            logoText,
            logoColor,
            website: body.applicationUrl,
          })
          .returning();
        companyId = newCompany.id;
      }

      // Build description with extra metadata
      const descParts = [];
      if (body.description) descParts.push(body.description);
      descParts.push(`Experience: ${body.experienceRange} years`);
      descParts.push(`Source: ${body.source}`);
      if (body.whatsappChannelUrl) {
        descParts.push(`WhatsApp Channel: ${body.whatsappChannelUrl}`);
      }
      descParts.push(`Submitted by community member. Under review.`);

      const [created] = await db
        .insert(opportunities)
        .values({
          companyId,
          title: body.title,
          description: descParts.join("\n"),
          opportunityType: body.opportunityType,
          location: body.location,
          workMode: body.workMode,
          applicationUrl: body.applicationUrl,
          status: "PENDING", // goes into review queue
          postedAt: new Date(),
        })
        .returning();

      // Notify admins to review
      await queueNotification({
        userId: user.id,
        type: "SYSTEM",
        title: "Job tip submitted for review",
        body: `Your job tip for "${body.title}" at ${body.companyName} is under review and will be published shortly.`,
        linkUrl: "/jobs",
        idempotencyKey: `job-submit-${created.id}-${user.id}`,
      });

      return apiSuccess(
        { opportunityId: created.id, status: "PENDING" },
        "Job tip submitted successfully! It will be reviewed and published shortly.",
        201,
      );
    }

    if (slug?.[0] === "save" && id) {
      const [existing] = await db
        .select()
        .from(savedOpportunities)
        .where(
          and(
            eq(savedOpportunities.userId, user.id),
            eq(savedOpportunities.opportunityId, id),
          ),
        )
        .limit(1);
      if (existing) {
        await db
          .delete(savedOpportunities)
          .where(eq(savedOpportunities.id, existing.id));
        return apiSuccess({ saved: false }, "Removed from saved jobs");
      }
      await db
        .insert(savedOpportunities)
        .values({ userId: user.id, opportunityId: id });
      return apiSuccess({ saved: true }, "Job saved");
    }

    if (slug?.[0] === "apply" && id) {
      const body = applySchema.parse(await request.json());
      const [opp] = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, id))
        .limit(1);
      if (!opp) return apiError("Opportunity not found", 404);

      const [existing] = await db
        .select()
        .from(jobApplications)
        .where(
          and(
            eq(jobApplications.userId, user.id),
            eq(jobApplications.opportunityId, id),
          ),
        )
        .limit(1);
      if (existing)
        return apiError("You have already applied to this opportunity", 409);

      const [application] = await db
        .insert(jobApplications)
        .values({
          userId: user.id,
          opportunityId: id,
          status: "APPLIED",
          ...body,
          resumeUrl: body.resumeUrl ?? null,
          portfolioUrl: body.portfolioUrl ?? null,
        })
        .returning();

      await queueNotification({
        userId: user.id,
        type: "APPLICATION_UPDATE",
        title: "Application submitted",
        body: `You applied to ${opp.title}. We'll notify you of updates.`,
        linkUrl: "/jobs/applications",
        idempotencyKey: `apply-${application.id}`,
      });

      return apiSuccess(
        { application },
        "Application submitted successfully!",
        201,
      );
    }

    return apiError("Unknown job action", 404);
  } catch (error) {
    return handleError(error, "Job action failed");
  }
}

const opportunitySchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  opportunityType: z.enum(["JOB", "INTERNSHIP", "OFF_CAMPUS"]),
  location: z.string().min(2),
  workMode: z.enum(["ONSITE", "REMOTE", "HYBRID"]).default("ONSITE"),
  graduationBatch: z.coerce.number().int().optional(),
  stipend: z.coerce.number().int().optional(),
  salaryMin: z.coerce.number().int().optional(),
  salaryMax: z.coerce.number().int().optional(),
  duration: z.string().optional(),
  applicationUrl: z.string().optional(),
  status: z.string().optional(),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const admin = await requireAdmin();
    const { slug } = await context.params;
    const id = slug?.[1];
    if (!id) return apiError("Opportunity id is required", 400);
    const body = await request.json();
    await db
      .update(opportunities)
      .set({ ...body })
      .where(eq(opportunities.id, id));
    void admin;
    return apiSuccess({ id }, "Opportunity updated");
  } catch (error) {
    return handleError(error, "Opportunity update failed");
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
    if (!id) return apiError("Opportunity id is required", 400);
    await db.delete(opportunities).where(eq(opportunities.id, id));
    return apiSuccess({ id }, "Opportunity deleted");
  } catch (error) {
    return handleError(error, "Opportunity delete failed");
  }
}

export { opportunitySchema };
