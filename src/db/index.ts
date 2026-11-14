/**
 * Database connection — dual-mode:
 *
 *   CF_PAGES=1  → Neon serverless HTTP driver (edge-compatible, works on Cloudflare Workers)
 *   default     → node-postgres Pool (Node.js runtime, Docker, local dev)
 *
 * Both use the same DATABASE_URL env var; only the driver/transport differs.
 */
import * as schema from "./schema";

// Fallback to build dummy during static build time page evaluation if DATABASE_URL is not injected into build workers
const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/build_dummy";

function createDb() {
  if (process.env.CF_PAGES === "1" || process.env.NEXT_RUNTIME === "edge") {
    // ── Cloudflare Pages / Edge runtime ──
    // Uses Neon's HTTP-based serverless driver — no TCP sockets needed.
    const { neon } = require("@neondatabase/serverless");
    const { drizzle } = require("drizzle-orm/neon-http");
    const sql = neon(databaseUrl!);
    return drizzle(sql, { schema });
  }

  // ── Node.js runtime (local dev, Docker, Railway, VPS) ──
  const { Pool } = require("pg");
  const { drizzle } = require("drizzle-orm/node-postgres");

  const globalForDb = globalThis as typeof globalThis & {
    __epiPostgresPool?: InstanceType<typeof Pool>;
  };

  const pool =
    globalForDb.__epiPostgresPool ??
    new Pool({ connectionString: databaseUrl });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__epiPostgresPool = pool;
  }

  return drizzle(pool, { schema });
}

export const db = createDb();

// Keep pool export for drizzle-kit and scripts that need raw pg access
export async function getPool() {
  if (process.env.CF_PAGES === "1") {
    throw new Error("pg Pool is not available in Cloudflare edge runtime — use db directly");
  }
  const { Pool } = await import("pg");
  const globalForDb = globalThis as typeof globalThis & {
    __epiPostgresPool?: InstanceType<typeof Pool>;
  };
  return (
    globalForDb.__epiPostgresPool ??
    new Pool({ connectionString: databaseUrl })
  );
}
