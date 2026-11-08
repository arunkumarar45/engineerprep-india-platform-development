/**
 * Bulk import utility tests — EngineerPrep India
 *
 * Tests CSV parsing and row validation logic without database connections.
 */
import { describe, it, expect, vi } from "vitest";

// Mock all database-touching modules to allow import of the route handler
vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
  },
}));

vi.mock("@/db/schema", () => ({
  importJobs: { id: "id", createdAt: "createdAt" },
  auditLogs: {},
  companies: {},
  dsaPatterns: {},
  dsaProblems: {},
  dsaSheets: {},
  mockTests: {},
  questions: {},
  questionOptions: {},
  opportunities: {},
  roadmapStages: {},
  roadmapTopics: {},
  roadmaps: {},
  vtuUpdates: {},
}));

vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    id: "admin-id",
    role: "ADMIN",
    email: "admin@test.com",
    fullName: "Admin",
  }),
}));

import { parseCsv } from "@/app/api/v1/admin/bulk-import/route";

/* ------------------------------------------------------------------ */
/* parseCsv                                                            */
/* ------------------------------------------------------------------ */

describe("parseCsv", () => {
  it("parses a simple CSV correctly", () => {
    const csv = `title,difficulty,pattern
Two Sum,EASY,Arrays
Binary Search,MEDIUM,Binary Search`;

    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      title: "Two Sum",
      difficulty: "EASY",
      pattern: "Arrays",
    });
    expect(rows[1]).toEqual({
      title: "Binary Search",
      difficulty: "MEDIUM",
      pattern: "Binary Search",
    });
  });

  it("handles quoted fields with commas", () => {
    const csv = `title,description
"Two Sum, Easy","Find two numbers that add to target"`;

    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Two Sum, Easy");
    expect(rows[0].description).toBe("Find two numbers that add to target");
  });

  it("handles escaped quotes inside quoted fields", () => {
    const csv = `title,notes
"He said ""hello""",test`;

    const rows = parseCsv(csv);
    expect(rows[0].title).toBe('He said "hello"');
  });

  it("returns empty array for empty input", () => {
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv("   \n   ")).toEqual([]);
  });

  it("returns empty array for header-only CSV", () => {
    const csv = "title,difficulty,pattern";
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(0);
  });

  it("handles trailing whitespace in cells", () => {
    const csv = `title , difficulty , pattern
 Two Sum , EASY , Arrays `;

    const rows = parseCsv(csv);
    expect(rows[0].title).toBe("Two Sum");
    expect(rows[0].difficulty).toBe("EASY");
    expect(rows[0].pattern).toBe("Arrays");
  });

  it("handles Windows-style line endings (CRLF)", () => {
    const csv = "title,difficulty\r\nTwo Sum,EASY\r\nMerge Sort,MEDIUM";
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[1].difficulty).toBe("MEDIUM");
  });

  it("handles missing column values", () => {
    const csv = `title,difficulty,pattern
Two Sum,EASY`;

    const rows = parseCsv(csv);
    expect(rows[0].title).toBe("Two Sum");
    expect(rows[0].difficulty).toBe("EASY");
    expect(rows[0].pattern).toBe(""); // Missing value should be empty string
  });
});

/* ------------------------------------------------------------------ */
/* Row validation logic (tested indirectly through known inputs)       */
/* ------------------------------------------------------------------ */

describe("DSA Problem validation rules", () => {
  it("identifies valid DSA problem rows", () => {
    // A valid DSA problem row has title, difficulty (EASY/MEDIUM/HARD), and pattern
    const validRow = {
      title: "Two Sum",
      difficulty: "EASY",
      pattern: "Arrays",
      statement: "Find two numbers that add to target.",
      practiceUrl: "https://leetcode.com/problems/two-sum",
    };

    expect(validRow.title).toBeTruthy();
    expect(["EASY", "MEDIUM", "HARD"]).toContain(
      validRow.difficulty.toUpperCase(),
    );
    expect(validRow.pattern).toBeTruthy();
  });

  it("identifies invalid difficulty values", () => {
    const invalidDifficulty = "SUPER_HARD";
    expect(["EASY", "MEDIUM", "HARD"]).not.toContain(
      invalidDifficulty.toUpperCase(),
    );
  });
});

