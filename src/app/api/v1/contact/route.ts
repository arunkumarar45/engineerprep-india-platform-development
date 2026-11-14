import { z } from "zod";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { apiError, apiSuccess, handleError } from "@/lib/api";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please provide a valid email address"),
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(150),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = contactSchema.safeParse(json);

    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message || "Invalid contact form submission";
      return apiError(msg, 400);
    }

    const { name, email, subject, message } = parsed.data;

    // Log the contact inquiry in audit_logs for admin tracking
    await db.insert(auditLogs).values({
      action: "CONTACT_INQUIRY",
      entity: "contact",
      entityId: email,
      metadata: {
        name,
        email,
        subject,
        message,
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        submittedAt: new Date().toISOString(),
      },
    });

    return apiSuccess(
      {
        received: true,
        email,
      },
      "Thank you! Your message has been received. Our team will contact you shortly."
    );
  } catch (error) {
    return handleError(error, "Failed to submit contact message");
  }
}
