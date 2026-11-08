import { NextResponse } from "next/server";
import { z, ZodError, type ZodSchema } from "zod";

export function apiSuccess<T>(
  data: T,
  message = "Operation completed successfully",
  status = 200,
) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

export function apiError(
  message: string,
  status = 400,
  errors: Array<{ field: string; message: string }> = [],
) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

export function handleError(error: unknown, fallback = "Unexpected error") {
  if (error instanceof ZodError) {
    return apiError(
      "Validation failed",
      422,
      error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    );
  }
  if (error instanceof Error) {
    const anyErr = error as Error & { status?: number };
    if (anyErr.status === 401 || anyErr.message === "Authentication required")
      return apiError("Authentication required", 401);
    if (anyErr.status === 403)
      return apiError("Administrator access required", 403);
    if (process.env.NODE_ENV !== "production") {
      return apiError(`${fallback}: ${error.message}`, 500);
    }
  }
  return apiError(fallback, 500);
}

export async function parseJson<T>(request: Request, schema: ZodSchema<T>) {
  const body = await request.json().catch(() => ({}));
  return schema.parse(body);
}

export function parseQuery<T>(request: Request, schema: ZodSchema<T>) {
  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  return schema.parse(raw);
}

export const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(9),
});

export function paginate<T>(rows: T[], page: number, pageSize: number) {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pages);
  const start = (current - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    meta: { page: current, pageSize, total, pages },
  };
}

export function num(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: Array<Record<string, unknown>>) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return lines.join("\n");
}
