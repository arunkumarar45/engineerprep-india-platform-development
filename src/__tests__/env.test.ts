/**
 * Environment configuration tests — EngineerPrep India
 */
import { describe, it, expect } from "vitest";
import { env } from "@/lib/env";

describe("Environment Configuration", () => {
  it("nodeEnv is test in test environment", () => {
    // vitest.config.ts sets NODE_ENV=test
    expect(["test", "development"]).toContain(env.nodeEnv);
  });

  it("isTest is true in test environment", () => {
    expect(env.isTest).toBe(true);
  });

  it("isProduction is false in test environment", () => {
    expect(env.isProduction).toBe(false);
  });

  it("frontendUrl has a default value", () => {
    expect(env.frontendUrl).toBeTruthy();
    expect(typeof env.frontendUrl).toBe("string");
  });

  it("smtp.configured is false without SMTP environment variables", () => {
    // In test mode, SMTP is not configured
    expect(env.smtp.configured).toBe(false);
  });

  it("storage.type defaults to local", () => {
    expect(env.storage.type).toBe("local");
  });

  it("logLevel has a default value", () => {
    expect(env.logLevel).toBeTruthy();
  });

  it("corsOrigins is an array", () => {
    expect(Array.isArray(env.corsOrigins)).toBe(true);
    expect(env.corsOrigins.length).toBeGreaterThan(0);
  });
});

