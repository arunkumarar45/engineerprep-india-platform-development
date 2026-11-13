import { describe, expect, it, vi } from "vitest";

process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/test_db";
process.env.JWT_ACCESS_SECRET = "test-secret-at-least-32-chars-long-here";
process.env.JWT_REFRESH_SECRET = "test-secret-at-least-32-chars-long-here-refresh";

// Mock DB
const insertedAuditLogs: any[] = [];
vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockImplementation((val) => {
        insertedAuditLogs.push(val);
        return Promise.resolve([val]);
      }),
    }),
  },
}));

import { POST as contactHandler } from "@/app/api/v1/contact/route";
import { GET as dsaHandler } from "@/app/api/v1/dsa/[[...slug]]/route";

describe("Contact API Route (/api/v1/contact)", () => {
  it("successfully accepts a valid contact message and records audit log", async () => {
    const payload = {
      name: "Arun Student",
      email: "arun.student@vtu.ac.in",
      subject: "Request for 2022 Scheme VTU Question Papers",
      message: "Please upload BCS701 and BCS702 previous year solved question papers.",
    };

    const req = new Request("http://localhost:3000/api/v1/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await contactHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.received).toBe(true);
    expect(json.data.email).toBe(payload.email);

    // Verify audit log entry
    expect(insertedAuditLogs.length).toBeGreaterThan(0);
    const lastLog = insertedAuditLogs[insertedAuditLogs.length - 1];
    expect(lastLog.action).toBe("CONTACT_INQUIRY");
    expect(lastLog.entity).toBe("contact");
    expect(lastLog.metadata.name).toBe(payload.name);
  });

  it("rejects submission when email format is invalid", async () => {
    const payload = {
      name: "Arun Student",
      email: "not-an-email",
      subject: "Test Subject",
      message: "Test message that is at least 10 chars long.",
    };

    const req = new Request("http://localhost:3000/api/v1/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await contactHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.message).toContain("valid email");
  });

  it("rejects submission when message is shorter than 10 characters", async () => {
    const payload = {
      name: "Arun Student",
      email: "student@vtu.ac.in",
      subject: "Test Subject",
      message: "short",
    };

    const req = new Request("http://localhost:3000/api/v1/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await contactHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.message).toContain("10 characters");
  });
});

describe("DSA Playlists API Route (/api/v1/dsa/playlists)", () => {
  it("fetches playlist details with sections by slug", async () => {
    const req = new Request("http://localhost:3000/api/v1/dsa/playlists/fraz-dsa-playlist");
    const res = await dsaHandler(req, {
      params: Promise.resolve({ slug: ["playlists", "fraz-dsa-playlist"] }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.playlist).toBeDefined();
    expect(json.data.playlist.slug).toBe("fraz-dsa-playlist");
    expect(json.data.playlist.sections).toBeDefined();
    expect(Array.isArray(json.data.playlist.sections)).toBe(true);
  });

  it("returns 404 for unknown playlist slug", async () => {
    const req = new Request("http://localhost:3000/api/v1/dsa/playlists/non-existent-playlist-xyz");
    const res = await dsaHandler(req, {
      params: Promise.resolve({ slug: ["playlists", "non-existent-playlist-xyz"] }),
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.success).toBe(false);
  });
});

describe("Placement Challenge & Interview Data Integrity", () => {
  it("verifies 30-day challenge curriculum has all 30 days complete", async () => {
    const challengeData = (await import("@/data/placement-challenge.json")).default;
    expect(challengeData.length).toBe(30);

    for (let day = 1; day <= 30; day++) {
      const entry = challengeData.find((d: any) => d.day === day);
      expect(entry).toBeDefined();
      expect(entry?.title).toBeTruthy();
      expect(entry?.tasks.length).toBeGreaterThan(0);
      expect(entry?.resourceLink).toBeTruthy();
      expect(entry?.week).toBeGreaterThanOrEqual(1);
      expect(entry?.week).toBeLessThanOrEqual(4);
    }
  });

  it("verifies interview question bank has valid answers and categories", async () => {
    const questions = (await import("@/data/interview-questions.json")).default;
    expect(questions.length).toBeGreaterThanOrEqual(10);

    for (const q of questions) {
      expect(q.id).toBeTruthy();
      expect(q.question).toBeTruthy();
      expect(q.category).toBeTruthy();
      expect(Array.isArray(q.answer)).toBe(true);
      expect(q.answer.length).toBeGreaterThanOrEqual(3);
      expect(q.summary).toBeTruthy();
      expect(q.followUp).toBeTruthy();
    }
  });
});
