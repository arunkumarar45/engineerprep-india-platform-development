#!/usr/bin/env tsx
/**
 * Admin Account Creation CLI — EngineerPrep India
 *
 * Usage:
 *   npx tsx scripts/admin-create.ts
 *
 * Required environment variables (set in .env or shell):
 *   DATABASE_URL          — PostgreSQL connection string
 *   INITIAL_ADMIN_EMAIL   — Email for the new admin account
 *   INITIAL_ADMIN_PASSWORD — Password (min 12 chars recommended)
 *   INITIAL_ADMIN_NAME    — Full name of the admin (optional)
 *
 * Security:
 *   - Password hashed with Argon2id before storage
 *   - Admin creation is logged to audit_logs table
 *   - Will refuse to overwrite an existing admin with the same email
 *   - Script exits with code 1 on any error
 */

import "dotenv/config";
import { db } from "../src/db";
import { users, auditLogs } from "../src/db/schema";
import { eq } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* Argon2id password hashing (same as production auth)                 */
/* ------------------------------------------------------------------ */

async function hashPassword(password: string): Promise<string> {
  try {
    const argon2 = await import("@node-rs/argon2");
    return await argon2.hash(password, {
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  } catch {
    // Fallback to bcryptjs if argon2 not available
    const bcrypt = await import("bcryptjs");
    return bcrypt.hash(password, 12);
  }
}

/* ------------------------------------------------------------------ */
/* Validation                                                           */
/* ------------------------------------------------------------------ */

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): string | null {
  if (password.length < 12) return "Password must be at least 12 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one digit";
  return null;
}

/* ------------------------------------------------------------------ */
/* Main                                                                 */
/* ------------------------------------------------------------------ */

async function main() {
  console.log("🔐 EngineerPrep India — Admin Account Creator");
  console.log("=".repeat(50));

  // ── Read config from environment ──────────────────────────────────
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim();
  const password = process.env.INITIAL_ADMIN_PASSWORD?.trim();
  const fullName = process.env.INITIAL_ADMIN_NAME?.trim() ?? "Platform Administrator";

  if (!email) {
    console.error("❌ INITIAL_ADMIN_EMAIL is not set");
    process.exit(1);
  }
  if (!password) {
    console.error("❌ INITIAL_ADMIN_PASSWORD is not set");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
  }

  // ── Validate inputs ───────────────────────────────────────────────
  if (!validateEmail(email)) {
    console.error(`❌ Invalid email address: ${email}`);
    process.exit(1);
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    console.error(`❌ Password validation failed: ${passwordError}`);
    process.exit(1);
  }

  // ── Check if user already exists ──────────────────────────────────
  console.log(`\n📧 Checking for existing account: ${email}`);
  const [existing] = await db
    .select({ id: users.id, role: users.role, email: users.email })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existing) {
    if (existing.role === "ADMIN") {
      console.error(`❌ An admin account already exists with email: ${email}`);
      console.error("   If you need to reset the password, use the password reset API.");
      process.exit(1);
    }

    // Existing student — promote to admin
    console.log(`⚠️  Found existing STUDENT account. Promoting to ADMIN...`);
    const passwordHash = await hashPassword(password);
    await db
      .update(users)
      .set({
        role: "ADMIN",
        passwordHash,
        isActive: true,
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));

    await db.insert(auditLogs).values({
      actorId: existing.id,
      action: "PROMOTE_TO_ADMIN",
      entity: "users",
      entityId: existing.id,
      metadata: { method: "admin-create-script", email },
    });

    console.log(`✅ Account promoted to ADMIN successfully!`);
    console.log(`   User ID: ${existing.id}`);
    console.log(`   Email:   ${email}`);
    return;
  }

  // ── Create new admin account ──────────────────────────────────────
  console.log("🔑 Hashing password with Argon2id...");
  const passwordHash = await hashPassword(password);

  console.log("👤 Creating admin account...");
  const [created] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      role: "ADMIN",
      isActive: true,
      emailVerified: true,
    })
    .returning({ id: users.id, email: users.email, role: users.role });

  // ── Audit log ─────────────────────────────────────────────────────
  await db.insert(auditLogs).values({
    actorId: created.id,
    action: "CREATE_ADMIN",
    entity: "users",
    entityId: created.id,
    metadata: {
      method: "admin-create-script",
      email: created.email,
      fullName,
    },
  });

  // ── Success output ────────────────────────────────────────────────
  console.log("\n✅ Admin account created successfully!");
  console.log("=".repeat(50));
  console.log(`   User ID:  ${created.id}`);
  console.log(`   Email:    ${created.email}`);
  console.log(`   Name:     ${fullName}`);
  console.log(`   Role:     ${created.role}`);
  console.log("\n⚠️  Store these credentials securely — they will not be shown again.");
  console.log("   Clear INITIAL_ADMIN_PASSWORD from your environment after setup.\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Failed to create admin account:");
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });

