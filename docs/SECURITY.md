# EngineerPrep India — Security Guide

## Security Architecture

This document describes the security measures implemented in EngineerPrep India and guidance for maintaining them in production.

---

## 1. Authentication

### Password Hashing

All new passwords are hashed with **Argon2id** (via `@node-rs/argon2`):

```
Memory cost:   64 MB (65536 KiB)
Time cost:     3 iterations
Parallelism:   4 threads
Algorithm:     Argon2id
```

**Legacy bcrypt compatibility:** Existing password hashes starting with `$2b$` or `$2a$` are verified using bcrypt, then transparently upgraded to Argon2id on the next successful login. No password resets are forced.

### JWT Tokens

| Token | Algorithm | Expiry | Storage |
|-------|-----------|--------|---------|
| Access token | HS256 | 15 minutes | httpOnly cookie |
| Refresh token | HS256 | 7 days | httpOnly cookie (path=/api/v1/auth) |

**Cookie flags:**
- `HttpOnly` — prevents JavaScript access
- `Secure` — HTTPS only in production
- `SameSite=lax` — CSRF protection for top-level navigation

### Refresh Token Security

- Refresh tokens stored as **SHA-256 hashes** in the database
- **Rotation:** Every use issues a new token and revokes the old one
- **Reuse detection:** If a revoked token is presented, **all sessions** for that user are revoked (token family compromise assumed)

---

## 2. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/v1/auth/login` | 5 attempts | 15 minutes per IP |
| `/api/v1/auth/forgot-password` | 5 requests | 15 minutes per IP |

Configure via environment variables:
```env
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_WINDOW_SECONDS=900
```

> **Note:** The current implementation uses in-memory rate limiting. For multi-instance deployments, migrate to Redis-backed rate limiting (e.g., `rate-limiter-flexible` with Redis).

---

## 3. Data Isolation

### Critical Security Rule

**Every query on student-owned data MUST include the authenticated user's ID in the WHERE clause.**

#### DSA Progress (Fixed — CVE severity: HIGH)

```typescript
// ❌ INSECURE — only filters by problemId
await db.select().from(dsaProgress)
  .where(eq(dsaProgress.problemId, body.problemId))

// ✅ SECURE — filters by BOTH problemId AND userId
await db.select().from(dsaProgress)
  .where(and(
    eq(dsaProgress.problemId, body.problemId),
    eq(dsaProgress.userId, user.id)      // ← Critical
  ))
```

#### Database-Level Enforcement

The schema uses unique composite constraints to enforce ownership:

```sql
-- dsa_progress: one progress record per user+problem
UNIQUE (user_id, problem_id)

-- bookmarks: one bookmark per user+kind+refId
UNIQUE (user_id, kind, ref_id)

-- job_applications: one application per user+opportunity
UNIQUE (user_id, opportunity_id)

-- saved_opportunities: one save per user+opportunity
UNIQUE (user_id, opportunity_id)

-- roadmap_progress: one topic completion per user+roadmap+topic
UNIQUE (user_id, roadmap_id, topic_id)
```

---

## 4. Password Reset Security

**BEFORE this fix (BROKEN):**
```json
// ❌ Token was returned in the HTTP response body
{
  "data": {
    "resetToken": "a1b2c3...",  // ← SECURITY VULNERABILITY
    "emailDelivery": "disabled"
  }
}
```

**AFTER this fix (SECURE):**
```json
// ✅ Token sent ONLY via email; response reveals nothing
{
  "data": {
    "message": "If an account exists for this email, password reset instructions have been sent."
  }
}
```

**Additional protections:**
- Identical response whether email exists or not (prevents enumeration)
- Tokens expire after 1 hour
- Tokens are single-use (marked `usedAt` after redemption)
- All active sessions revoked after password reset

---

## 5. Environment Secrets

### Production Startup Validation

The application refuses to start in production if secrets are missing or use known defaults:

```typescript
// src/lib/env.ts
function requireSecret(name: string): string {
  const value = requireEnv(name);
  if (DEFAULT_SECRETS.has(value) && process.env.NODE_ENV === 'production') {
    throw new Error(`FATAL: "${name}" is set to an insecure default value`);
  }
  return value;
}
```

### Secret Generation

```bash
# Generate JWT secrets (run twice — use different values for each)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or with OpenSSL
openssl rand -hex 64
```

### Secrets Checklist

| Secret | Minimum Entropy | Notes |
|--------|----------------|-------|
| `JWT_ACCESS_SECRET` | 256 bits (64 hex chars) | Never reuse between environments |
| `JWT_REFRESH_SECRET` | 256 bits (64 hex chars) | Must differ from access secret |
| `POSTGRES_PASSWORD` | 128 bits | Use password manager |
| `SMTP_PASSWORD` | App password (not account password) | Use provider's app password feature |

---

## 6. HTTP Security Headers

Implemented in `next.config.ts`:

| Header | Value | Protection |
|--------|-------|-----------|
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | Reflected XSS (legacy) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Information leakage |
| `Permissions-Policy` | Restrict camera, mic, geo | Privacy |

Add in Nginx for additional protection:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

---

## 7. Authorization

### Role Hierarchy

```
PUBLIC (unauthenticated)
  └── STUDENT (authenticated)
        └── ADMIN
```

### Middleware Functions

```typescript
// Requires any authenticated user
await requireUser();      // throws AuthError(401) if not logged in

// Requires ADMIN role
await requireAdmin();     // throws AuthError(403) if not admin
```

**IMPORTANT:**
- Roles are NEVER trusted from frontend request bodies
- `role: "STUDENT"` is hardcoded on registration — cannot self-escalate
- Admin accounts must be created via secure CLI command

---

## 8. File Upload Security

| Check | Implementation |
|-------|---------------|
| File size limit | 50 MB maximum |
| Extension whitelist | .pdf, .doc, .docx, .png, .jpg, .csv, .xlsx, .json |
| Random filenames | UUID-based to prevent path traversal |
| Private resumes | Authorization required to download |
| No path traversal | File paths sanitized with `path.basename()` |

---

## 9. SQL Injection Prevention

All database queries use Drizzle ORM's parameterized query builder. No raw string interpolation in SQL queries.

```typescript
// ✅ Safe — parameterized via Drizzle ORM
await db.select().from(users).where(eq(users.email, userInput));

// ❌ Never do this
await db.execute(sql.raw(`SELECT * FROM users WHERE email = '${userInput}'`));
```

---

## 10. Audit Logging

Sensitive admin operations are written to the `audit_logs` table:

| Action | Trigger |
|--------|---------|
| `CREATE` | Resource, opportunity, test created |
| `UPDATE` | Content modified |
| `DELETE` | Content removed |
| `UPDATE_STUDENT` | Student account changes |
| `SET_STATUS_ACTIVE/DISABLED` | Automation rule toggled |
| `RUN_AUTOMATION` | Manual automation triggered |
| `BULK_IMPORT` | Import confirmed |
| `SWEEP_EXPIRED` | Opportunities expired |

View audit logs: `GET /api/v1/admin/audit-logs`

---

## 11. Known Limitations (Future Work)

| Item | Priority | Notes |
|------|---------|-------|
| Redis-backed rate limiting | HIGH | Required for multi-instance deployments |
| CSRF double-submit token | MEDIUM | SameSite=lax provides basic protection |
| HTTPS enforcement middleware | HIGH | Handled by Nginx in production |
| Content-Security-Policy | MEDIUM | Add when frontend CSP requirements are known |
| File signature validation | MEDIUM | Verify file magic bytes, not just extension |
| Dependency vulnerability scan | HIGH | Add `npm audit --audit-level=high` to CI |

