export const runtime = "edge";
/**
 * File Upload API â€” EngineerPrep India
 *
 * Implements real file persistence:
 * - Local storage (default dev): saves to ./uploads/{category}/{uuid}-{filename}
 * - S3-compatible (production):  set USE_S3=true in .env + configure S3_* vars
 *   NOTE: install @aws-sdk/client-s3 separately for S3 mode.
 *
 * Security:
 * - Path traversal protection via path.basename()
 * - MIME type allowlist
 * - File size limit
 * - Requires authenticated user
 */
import { NextResponse } from "next/server";
import { writeFile, mkdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getSessionUser, requireUser } from "@/lib/auth";
import { apiError, apiSuccess, handleError } from "@/lib/api";

/* ------------------------------------------------------------------ */
/* Configuration                                                        */
/* ------------------------------------------------------------------ */

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/json",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": ".pdf",
  "text/csv": ".csv",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/json": ".json",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

/* ------------------------------------------------------------------ */
/* Local storage helpers                                                */
/* ------------------------------------------------------------------ */

function getUploadRoot(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
}

function getUploadDir(category: string): string {
  const safeCategory = category.replace(/[^a-z0-9-]/g, "").slice(0, 40) || "misc";
  return path.join(getUploadRoot(), safeCategory);
}

async function saveLocally(
  buffer: ArrayBuffer,
  originalName: string,
  mimeType: string,
  category: string,
): Promise<{ storedPath: string; publicUrl: string }> {
  const dir = getUploadDir(category);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  const baseName = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, "_");
  const ext = MIME_TO_EXT[mimeType] ?? path.extname(baseName) ?? ".bin";
  const id = randomUUID();
  const fileName = `${id}${ext}`;
  const storedPath = path.join(dir, fileName);

  await writeFile(storedPath, Buffer.from(buffer));

  const safeCategory = category.replace(/[^a-z0-9-]/g, "").slice(0, 40) || "misc";
  const publicUrl = `/api/v1/uploads?path=${safeCategory}/${fileName}`;

  return { storedPath, publicUrl };
}

/* ------------------------------------------------------------------ */
/* S3 storage â€” only used when USE_S3=true                             */
/* Install @aws-sdk/client-s3 for S3 support                          */
/* ------------------------------------------------------------------ */

async function saveToS3(
  buffer: ArrayBuffer,
  originalName: string,
  mimeType: string,
  category: string,
): Promise<{ storedPath: string; publicUrl: string }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const s3Module = require("@aws-sdk/client-s3") as typeof import("@aws-sdk/client-s3");
  const { S3Client, PutObjectCommand } = s3Module;

  const bucket = process.env.STORAGE_BUCKET ?? process.env.S3_BUCKET;
  const region = process.env.STORAGE_REGION ?? process.env.S3_REGION ?? "ap-south-1";
  const endpoint = process.env.STORAGE_ENDPOINT ?? process.env.S3_ENDPOINT;

  if (!bucket) throw new Error("S3_BUCKET or STORAGE_BUCKET env variable is not set");

  const client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY ?? process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.STORAGE_SECRET_KEY ?? process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });

  const baseName = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, "_");
  const ext = MIME_TO_EXT[mimeType] ?? path.extname(baseName) ?? ".bin";
  const safeCategory = category.replace(/[^a-z0-9-]/g, "").slice(0, 40) || "misc";
  const key = `uploads/${safeCategory}/${randomUUID()}${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(buffer),
      ContentType: mimeType,
    }),
  );

  const baseUrl =
    process.env.S3_PUBLIC_BASE_URL ??
    `https://${bucket}.s3.${region}.amazonaws.com`;
  return {
    storedPath: key,
    publicUrl: `${baseUrl}/${key}`,
  };
}

/* ------------------------------------------------------------------ */
/* POST /api/v1/uploads                                                 */
/* ------------------------------------------------------------------ */

export function verifyMagicBytes(buffer: ArrayBuffer | Uint8Array, mimeType: string): boolean {
  if (buffer.byteLength < 4) return false;
  const bytes = buffer instanceof Uint8Array ? buffer.subarray(0, 8) : new Uint8Array(buffer.slice(0, 8));

  if (mimeType === "application/pdf") {
    // %PDF-
    return (
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46 &&
      bytes[4] === 0x2d
    );
  }

  if (mimeType === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }

  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return bytes[0] === 0x50 && bytes[1] === 0x4b;
  }

  return true;
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    // Parse multipart form
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return apiError("Invalid multipart form data", 400);
    }

    const file = form.get("file");
    const category = (form.get("category") as string | null) ?? "misc";

    if (!(file instanceof File)) {
      return apiError("A file field named 'file' is required", 400);
    }

    if (file.size === 0) {
      return apiError("Uploaded file is empty", 400);
    }
    if (file.size > MAX_BYTES) {
      return apiError(
        `File exceeds the ${MAX_BYTES / 1024 / 1024} MB limit`,
        413,
      );
    }

    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return apiError(`Unsupported file type: ${mimeType}`, 415);
    }

    const buffer = await file.arrayBuffer();

    if (!verifyMagicBytes(buffer, mimeType)) {
      return apiError(
        "File signature (magic bytes) does not match the declared MIME type. Malicious or corrupt file rejected.",
        400,
      );
    }

    let result: { storedPath: string; publicUrl: string };

    const isS3 = process.env.STORAGE_TYPE === "s3" || process.env.USE_S3 === "true";
    if (isS3) {
      result = await saveToS3(buffer, file.name, mimeType, category);
    } else {
      result = await saveLocally(buffer, file.name, mimeType, category);
    }

    const fileSizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
        : `${Math.ceil(file.size / 1024)} KB`;

    return apiSuccess(
      {
        originalName: file.name,
        storedPath: result.storedPath,
        publicUrl: result.publicUrl,
        size: file.size,
        fileSizeStr,
        mimeType,
        category,
        storage: isS3 ? "s3" : "local",
        uploadedBy: user.id,
      },
      "File uploaded successfully",
      201,
    );
  } catch (error) {
    return handleError(error, "Upload failed");
  }
}

/* ------------------------------------------------------------------ */
/* GET /api/v1/uploads?path=category/filename                          */
/*  Serve locally stored files with content-type and security headers  */
/* ------------------------------------------------------------------ */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawPath = url.searchParams.get("path") ?? "";

    // Path traversal protection
    const parts = rawPath.split("/").filter(Boolean);
    if (parts.length !== 2) {
      return apiError("Invalid file path. Use ?path=category/filename", 400);
    }

    const [category, filename] = parts;
    const safeCategory = category.replace(/[^a-z0-9-]/g, "").slice(0, 40);
    const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "");

    if (!safeCategory || !safeFilename) {
      return apiError("Invalid file path segments", 400);
    }

    const uploadRoot = getUploadRoot();
    const filePath = path.join(uploadRoot, safeCategory, safeFilename);

    // Ensure resolved path is inside upload root
    const resolvedRoot = path.resolve(uploadRoot);
    const resolvedFile = path.resolve(filePath);
    if (!resolvedFile.startsWith(resolvedRoot)) {
      return apiError("Forbidden", 403);
    }

    let data: Buffer;
    try {
      data = await readFile(resolvedFile);
    } catch {
      return new NextResponse("File not found", { status: 404 });
    }

    const ext = path.extname(safeFilename).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      ".pdf": "application/pdf",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".csv": "text/csv",
      ".json": "application/json",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".xls": "application/vnd.ms-excel",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    const contentType = contentTypeMap[ext] ?? "application/octet-stream";

    return new NextResponse(data as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeFilename}"`,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleError(error, "File serve failed");
  }
}
