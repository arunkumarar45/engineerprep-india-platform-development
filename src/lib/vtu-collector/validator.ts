import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ValidationResult, VtuAcademicCategory } from "./types";

export function computeSha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function validatePdfBuffer(
  buffer: Buffer,
  declaredCategory?: VtuAcademicCategory,
  titleHint?: string,
): ValidationResult {
  const fileSizeBytes = buffer.length;
  const fileSizeHuman = formatBytes(fileSizeBytes);
  const fileHash = computeSha256(buffer);

  // 1. Minimum size check (corrupt or 0 byte file)
  if (fileSizeBytes < 1024) {
    return {
      isValid: false,
      mimeType: "application/octet-stream",
      fileHash,
      fileSizeBytes,
      fileSizeHuman,
      isPdf: false,
      isHtmlErrorPage: false,
      error: `File too small (${fileSizeBytes} bytes), likely corrupted or truncated.`,
    };
  }

  // 2. HTML Error Page Detection (e.g., 404, 403, Cloudflare, Google Drive HTML error)
  const headSample = buffer.subarray(0, Math.min(2048, fileSizeBytes)).toString("utf8", 0);
  const isHtml =
    headSample.includes("<!DOCTYPE html") ||
    headSample.includes("<html") ||
    headSample.includes("<head") ||
    headSample.includes("<title>404") ||
    headSample.includes("<title>Access Denied") ||
    headSample.includes("Sorry, unable to open the file") ||
    headSample.includes("Sorry, the file you have requested does not exist");

  if (isHtml) {
    return {
      isValid: false,
      mimeType: "text/html",
      fileHash,
      fileSizeBytes,
      fileSizeHuman,
      isPdf: false,
      isHtmlErrorPage: true,
      error: "Target file is an HTML error page rather than a genuine academic PDF document.",
    };
  }

  // 3. PDF Magic Bytes Check (%PDF-)
  // In genuine PDFs, %PDF- should be present in the first 1024 bytes
  const isPdf = headSample.includes("%PDF-");
  if (!isPdf) {
    return {
      isValid: false,
      mimeType: "application/octet-stream",
      fileHash,
      fileSizeBytes,
      fileSizeHuman,
      isPdf: false,
      isHtmlErrorPage: false,
      error: "Invalid PDF format: Missing %PDF- magic byte signature.",
    };
  }

  // 4. Check for PDF EOF marker (%%EOF) in the last 2048 bytes
  const tailSample = buffer.subarray(Math.max(0, fileSizeBytes - 2048)).toString("utf8");
  const hasEof = tailSample.includes("%%EOF");
  if (!hasEof && fileSizeBytes > 2000000) {
    // If very large and missing EOF, might be partial download
    return {
      isValid: false,
      mimeType: "application/pdf",
      fileHash,
      fileSizeBytes,
      fileSizeHuman,
      isPdf: true,
      isHtmlErrorPage: false,
      error: "Corrupted PDF stream: Missing %%EOF trailer marker.",
    };
  }

  // 5. Category heuristic analysis based on title and text sample
  let detectedCategory: VtuAcademicCategory | undefined = declaredCategory;
  const combinedText = `${titleHint || ""} ${headSample}`.toLowerCase();

  if (combinedText.includes("question paper") || combinedText.includes("model question") || combinedText.includes("scheme b.e")) {
    detectedCategory = "QUESTION_PAPER";
  } else if (combinedText.includes("syllabus") || combinedText.includes("scheme of teaching") || combinedText.includes("curriculum")) {
    detectedCategory = "SYLLABUS";
  } else if (combinedText.includes("assignment") || combinedText.includes("coursework")) {
    detectedCategory = "ASSIGNMENT";
  }

  // If declared category contradicts strongly with detected category
  let notes = "Verified genuine VTU academic PDF document.";
  if (declaredCategory && detectedCategory && declaredCategory !== detectedCategory) {
    notes = `Category review required: Declared as ${declaredCategory} but detected as ${detectedCategory}.`;
  }

  return {
    isValid: true,
    mimeType: "application/pdf",
    fileHash,
    fileSizeBytes,
    fileSizeHuman,
    detectedCategory,
    isPdf: true,
    isHtmlErrorPage: false,
    notes,
  };
}

export function validateLocalFile(
  filePath: string,
  declaredCategory?: VtuAcademicCategory,
  titleHint?: string,
): ValidationResult {
  if (!fs.existsSync(filePath)) {
    return {
      isValid: false,
      mimeType: "application/octet-stream",
      fileHash: "",
      fileSizeBytes: 0,
      fileSizeHuman: "0 Bytes",
      isPdf: false,
      isHtmlErrorPage: false,
      error: `File does not exist on disk at path: ${filePath}`,
    };
  }

  const buffer = fs.readFileSync(filePath);
  return validatePdfBuffer(buffer, declaredCategory, titleHint || path.basename(filePath));
}

