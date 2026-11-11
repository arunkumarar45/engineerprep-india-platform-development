import { describe, expect, it, vi } from "vitest";

process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/test_db";
process.env.JWT_ACCESS_SECRET = "test-secret-at-least-32-chars-long-here";
process.env.JWT_REFRESH_SECRET = "test-secret-at-least-32-chars-long-here-refresh";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  },
}));

import { rateLimit, resetRateLimit } from "@/lib/rate-limiter";
import { verifyMagicBytes } from "@/app/api/v1/uploads/route";

describe("Distributed Rate Limiter (Memory Fallback)", () => {
  it("allows requests under the threshold and tracks remaining", async () => {
    const key = `test-ip-${Date.now()}`;
    const r1 = await rateLimit(key, 3, 60);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = await rateLimit(key, 3, 60);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = await rateLimit(key, 3, 60);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    // 4th request must be blocked
    const r4 = await rateLimit(key, 3, 60);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it("resets rate limit on explicit reset", async () => {
    const key = `test-reset-${Date.now()}`;
    await rateLimit(key, 2, 60);
    await rateLimit(key, 2, 60);

    const blocked = await rateLimit(key, 2, 60);
    expect(blocked.allowed).toBe(false);

    await resetRateLimit(key);
    const afterReset = await rateLimit(key, 2, 60);
    expect(afterReset.allowed).toBe(true);
  });
});

describe("Upload Magic Bytes Validation (SEC-04)", () => {
  it("validates legitimate PDF buffer", () => {
    const validPdfBuffer = Buffer.from("%PDF-1.7\nSample content");
    expect(verifyMagicBytes(validPdfBuffer, "application/pdf")).toBe(true);
  });

  it("rejects malicious executable disguised as PDF", () => {
    // Windows PE / MZ executable signature (0x4D, 0x5A)
    const fakePdf = Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00");
    expect(verifyMagicBytes(fakePdf, "application/pdf")).toBe(false);
  });

  it("validates legitimate PNG and JPEG buffers", () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(verifyMagicBytes(pngHeader, "image/png")).toBe(true);

    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    expect(verifyMagicBytes(jpegHeader, "image/jpeg")).toBe(true);
  });

  it("rejects corrupted image header", () => {
    const corruptImg = Buffer.from("<html><script>alert(1)</script></html>");
    expect(verifyMagicBytes(corruptImg, "image/png")).toBe(false);
  });
});
