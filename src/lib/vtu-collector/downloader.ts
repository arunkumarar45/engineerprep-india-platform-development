import fs from "node:fs";
import path from "node:path";
import { formatBytes, validatePdfBuffer } from "./validator";
import { ValidationResult, VtuAcademicCategory } from "./types";

export interface DownloadOptions {
  timeoutMs?: number;
  maxSizeBytes?: number;
  retries?: number;
  category: VtuAcademicCategory;
  suggestedFileName?: string;
}

export interface DownloadResult {
  success: boolean;
  publicUrl?: string;
  localPath?: string;
  fileName?: string;
  fileSizeBytes?: number;
  fileSizeHuman?: string;
  fileHash?: string;
  mimeType?: string;
  validation?: ValidationResult;
  error?: string;
}

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function normalizeDownloadUrl(rawUrl: string): string {
  // If Google Drive link, extract ID and convert to direct download stream
  const gDriveMatch = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || rawUrl.match(/id=([a-zA-Z0-9_-]+)/);
  if (gDriveMatch && (rawUrl.includes("drive.google.com") || rawUrl.includes("docs.google.com"))) {
    return `https://drive.google.com/uc?export=download&id=${gDriveMatch[1]}&confirm=t`;
  }
  return rawUrl;
}

export async function downloadAndValidateFile(
  url: string,
  options: DownloadOptions,
): Promise<DownloadResult> {
  const timeoutMs = options.timeoutMs || 25000;
  const maxSizeBytes = options.maxSizeBytes || 50 * 1024 * 1024; // 50MB
  const maxRetries = options.retries || 2;
  const targetUrl = normalizeDownloadUrl(url);

  let lastError = "";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 EngineerPrepAcademicBot/2.0",
          Accept: "application/pdf,application/octet-stream,*/*",
        },
      });

      clearTimeout(timer);

      if (!response.ok) {
        lastError = `HTTP ${response.status} ${response.statusText}`;
        if (response.status === 404 || response.status === 403 || response.status === 410) {
          break; // Don't retry non-recoverable client/auth errors
        }
        continue;
      }

      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
        return {
          success: false,
          error: `File size exceeds allowed limit of ${formatBytes(maxSizeBytes)}`,
        };
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length > maxSizeBytes) {
        return {
          success: false,
          error: `Downloaded file size (${formatBytes(buffer.length)}) exceeds max limit.`,
        };
      }

      // Validate the PDF buffer
      const validation = validatePdfBuffer(buffer, options.category, options.suggestedFileName);
      if (!validation.isValid) {
        return {
          success: false,
          validation,
          error: validation.error || "File failed authenticity and integrity validation.",
        };
      }

      // Determine category target directory
      let categoryFolder = "vtu-official-qp";
      if (options.category === "SYLLABUS") categoryFolder = "vtu-official-syllabus";
      else if (options.category === "LAB_MANUAL") categoryFolder = "vtu-official-labs";
      else if (options.category === "ASSIGNMENT") categoryFolder = "vtu-official-important-questions";

      const targetDir = path.join(process.cwd(), "public", categoryFolder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      let baseName = options.suggestedFileName
        ? sanitizeFileName(options.suggestedFileName)
        : `vtu-${options.category.toLowerCase()}-${validation.fileHash.slice(0, 10)}.pdf`;

      if (!baseName.toLowerCase().endsWith(".pdf")) {
        baseName += ".pdf";
      }

      const localPath = path.join(targetDir, baseName);
      fs.writeFileSync(localPath, buffer);

      const publicUrl = `/${categoryFolder}/${baseName}`;

      return {
        success: true,
        publicUrl,
        localPath,
        fileName: baseName,
        fileSizeBytes: buffer.length,
        fileSizeHuman: validation.fileSizeHuman,
        fileHash: validation.fileHash,
        mimeType: validation.mimeType,
        validation,
      };
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  return {
    success: false,
    error: `Download failed after ${maxRetries} attempts: ${lastError}`,
  };
}

