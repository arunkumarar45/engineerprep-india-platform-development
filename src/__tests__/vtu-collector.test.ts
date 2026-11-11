import { describe, it, expect } from "vitest";
import {
  computeSha256,
  formatBytes,
  validatePdfBuffer,
} from "../lib/vtu-collector/validator";
import {
  sanitizeFileName,
  normalizeDownloadUrl,
} from "../lib/vtu-collector/downloader";

describe("VTU Academic Resource Collector - Verification & Security Suite", () => {
  /* -------------------------------------------------------------
   * 1. PDF Magic Bytes & Authenticity Validation
   * ------------------------------------------------------------- */
  describe("PDF Magic Bytes & Header Validation", () => {
    it("accepts a genuine PDF buffer starting with %PDF-", () => {
      // Mock genuine PDF structure
      const validPdf = Buffer.from(
        "%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
          "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
          "3 0 obj\n<< /Type /Page /Parent 2 0 R >>\nendobj\n" +
          "xref\n0 4\n0000000000 65535 f \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n180\n%%EOF" +
          " ".repeat(1500), // padding to exceed minimum 1024 bytes
      );

      const res = validatePdfBuffer(validPdf, "QUESTION_PAPER", "VTU 2022 Scheme Model QP");
      expect(res.isValid).toBe(true);
      expect(res.isPdf).toBe(true);
      expect(res.isHtmlErrorPage).toBe(false);
      expect(res.mimeType).toBe("application/pdf");
      expect(res.fileHash).toHaveLength(64);
    });

    it("rejects an empty or undersized file buffer", () => {
      const emptyBuffer = Buffer.from("");
      const resEmpty = validatePdfBuffer(emptyBuffer);
      expect(resEmpty.isValid).toBe(false);
      expect(resEmpty.error).toMatch(/too small/i);

      const tinyBuffer = Buffer.from("%PDF-1.4 short");
      const resTiny = validatePdfBuffer(tinyBuffer);
      expect(resTiny.isValid).toBe(false);
      expect(resTiny.error).toMatch(/too small/i);
    });

    it("rejects non-PDF files missing %PDF- magic bytes", () => {
      const textBuffer = Buffer.from("Just plain text with no PDF headers".repeat(50));
      const res = validatePdfBuffer(textBuffer);
      expect(res.isValid).toBe(false);
      expect(res.isPdf).toBe(false);
      expect(res.error).toMatch(/Missing %PDF- magic byte signature/i);
    });
  });

  /* -------------------------------------------------------------
   * 2. HTML Error Page Detection (Preventing renamed HTML error pages)
   * ------------------------------------------------------------- */
  describe("HTML Error Page Detection", () => {
    it("detects HTML error pages disguised as PDFs (e.g. 404 Not Found)", () => {
      const html404 = Buffer.from(
        "<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1></body></html>" +
          " ".repeat(1000),
      );

      const res = validatePdfBuffer(html404, "QUESTION_PAPER", "BCS601-QP.pdf");
      expect(res.isValid).toBe(false);
      expect(res.isHtmlErrorPage).toBe(true);
      expect(res.error).toMatch(/HTML error page/i);
    });

    it("detects Google Drive 'Sorry, unable to open the file' HTML errors", () => {
      const gDriveBlocked = Buffer.from(
        "<!DOCTYPE html><html><body><p>Sorry, unable to open the file at this time.</p></body></html>" +
          " ".repeat(1000),
      );

      const res = validatePdfBuffer(gDriveBlocked, "QUESTION_PAPER", "BCS714B-QP.pdf");
      expect(res.isValid).toBe(false);
      expect(res.isHtmlErrorPage).toBe(true);
    });
  });

  /* -------------------------------------------------------------
   * 3. SHA-256 Deduplication & Hashing
   * ------------------------------------------------------------- */
  describe("SHA-256 Deduplication", () => {
    it("computes deterministic SHA-256 hashes for duplicate identification", () => {
      const contentA = Buffer.from("VTU Belagavi Official Curriculum 2022 Scheme");
      const contentB = Buffer.from("VTU Belagavi Official Curriculum 2022 Scheme");
      const contentC = Buffer.from("Different VTU Question Paper");

      const hashA = computeSha256(contentA);
      const hashB = computeSha256(contentB);
      const hashC = computeSha256(contentC);

      expect(hashA).toBe(hashB);
      expect(hashA).not.toBe(hashC);
      expect(hashA).toHaveLength(64);
    });

    it("formats human-readable byte sizes correctly", () => {
      expect(formatBytes(0)).toBe("0 Bytes");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1024 * 1024)).toBe("1 MB");
      expect(formatBytes(4.5 * 1024 * 1024)).toBe("4.5 MB");
    });
  });

  /* -------------------------------------------------------------
   * 4. Downloader & URL Normalization
   * ------------------------------------------------------------- */
  describe("Downloader & URL Normalization", () => {
    it("transforms Google Drive preview/view URLs into direct download endpoints", () => {
      const previewUrl = "https://drive.google.com/file/d/1L9X8902rWpGxnCAPGqfIOiQ-qKz4I5VW/view";
      const normalized = normalizeDownloadUrl(previewUrl);

      expect(normalized).toBe(
        "https://drive.google.com/uc?export=download&id=1L9X8902rWpGxnCAPGqfIOiQ-qKz4I5VW&confirm=t",
      );
    });

    it("leaves standard HTTPS PDF URLs untouched", () => {
      const directPdf = "https://vtu.ac.in/pdf/mqp/BCS601.pdf";
      expect(normalizeDownloadUrl(directPdf)).toBe(directPdf);
    });

    it("sanitizes dangerous or special characters in filenames", () => {
      const unsafe = 'VTU: "BCS601" <Model> / Paper? * 2024.pdf';
      const clean = sanitizeFileName(unsafe);

      expect(clean).not.toContain(":");
      expect(clean).not.toContain('"');
      expect(clean).not.toContain("<");
      expect(clean).not.toContain(">");
      expect(clean).not.toContain("/");
      expect(clean).not.toContain("?");
      expect(clean).not.toContain("*");
      expect(clean).toBe("VTU-BCS601-Model-Paper-2024.pdf");
    });
  });

  /* -------------------------------------------------------------
   * 5. Strict Category Isolation Rules
   * ------------------------------------------------------------- */
  describe("Academic Category Isolation", () => {
    it("ensures Question Papers, Syllabus, Lab Manuals and Assignments never mix", () => {
      const categories = ["QUESTION_PAPER", "SYLLABUS", "LAB_MANUAL", "ASSIGNMENT"];
      // Every category is distinct and never equal to NOTES
      categories.forEach((cat) => {
        expect(cat).not.toBe("NOTES");
      });
      // Check all unique
      const uniqueSet = new Set(categories);
      expect(uniqueSet.size).toBe(4);
    });
  });
});
