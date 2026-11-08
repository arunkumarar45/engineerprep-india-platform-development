# EngineerPrep India — Project Audit Report

**Audit Date:** 2026-11-04  
**Auditor:** Principal Software Architect  
**Codebase Root:** `engineerprep-india-platform-development/`

---

## 1. Executive Summary

This project is a **Next.js 16 monolith** that serves both the frontend and the API (via Next.js API routes). It has a well-designed PostgreSQL schema (38+ tables, 14 enums via Drizzle ORM), functional authentication, and partial implementations of most business modules. The primary issues are:

1. **Security vulnerabilities** — hardcoded fallback JWT secrets, bcrypt instead of Argon2id, missing rate limiting, missing CSRF protection, DSA progress cross-user query bug (missing userId filter).
2. **Incomplete automation** — in-process simulated workers with no real Redis/BullMQ, no retry logic, handlers return hardcoded numbers.
3. **Bulk import is a demo** — confirm action marks import COMPLETED without inserting any records.
4. **Admin export is hardcoded** — returns static sample rows instead of real database records.
5. **Missing backend** — no separate Express backend; all business logic lives in Next.js API routes.
6. **No test suite** — zero automated tests exist.
7. **No Docker/CI configuration** — no Dockerfiles, no docker-compose.yml, no GitHub Actions.
8. **Missing environment validation** — no startup check for required production variables.
9. **File uploads not persistent** — upload endpoint exists but files are not reliably stored; seed data references demo URLs.
10. **No email delivery** — SMTP not wired; forgot-password returns token in response body (a security issue in production).

---

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 16.2.6 |
| UI | React 19 + Tailwind CSS 4 | Latest |
| Language | TypeScript | 5.9.3 |
| ORM | Drizzle ORM | 0.45.2 |
| Database | PostgreSQL (via `pg`) | 8.20.0 |
| Auth tokens | `jose` (JWT) | ^6.2.15 |
| Password hashing | `bcryptjs` | ^3.0.3 |
| Validation | Zod | ^4.6.7 |
| UUID | `uuid` | ^14.0.3 |

**Missing (needs to be added):**
- Argon2id (`@node-rs/argon2` or `argon2`)
- Express.js + separate backend
- Redis + BullMQ
- Nodemailer
- Multer (file uploads)
- Helmet, cors, rate-limiter-flexible
- Vitest / Jest + Supertest
- Docker + docker-compose

---

## 3. Folder Structure

```
engineerprep-india-platform-development/
├── scripts/
│   └── seed.ts                    (~100 KB — large comprehensive seed)
├── src/
│   ├── app/
│   │   ├── (app)/                 # Protected app routes
│   │   │   ├── admin/[section]/   # Admin dashboard
│   │   │   ├── dashboard/
│   │   │   ├── jobs/
│   │   │   ├── my-bookmarks/
│   │   │   ├── my-downloads/
│   │   │   ├── my-progress/
│   │   │   ├── my-tests/
│   │   │   ├── notifications/
│   │   │   ├── placements/
│   │   │   ├── profile/
│   │   │   ├── settings/
│   │   │   └── vtu/
│   │   ├── api/
│   │   │   ├── health/route.ts
│   │   │   └── v1/
│   │   │       ├── admin/[[...slug]]/route.ts
│   │   │       ├── admin/bulk-import/route.ts
│   │   │       ├── auth/[[...slug]]/route.ts
│   │   │       ├── dashboard/route.ts
│   │   │       ├── dsa/[[...slug]]/route.ts
│   │   │       ├── jobs/[[...slug]]/route.ts
│   │   │       ├── notifications/[[...slug]]/route.ts
│   │   │       ├── resources/[[...slug]]/route.ts
│   │   │       ├── roadmaps/[[...slug]]/route.ts
│   │   │       ├── search/route.ts
│   │   │       ├── tests/[[...slug]]/route.ts
│   │   │       ├── uploads/route.ts
│   │   │       ├── users/[[...slug]]/route.ts
│   │   │       └── vtu/[[...slug]]/route.ts
│   │   ├── login/, register/, forgot-password/, reset-password/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── admin/
│   │   ├── cards/
│   │   ├── dashboard/
│   │   ├── jobs/
│   │   ├── layout/
│   │   ├── mocktest/
│   │   ├── placements/
│   │   ├── ui/
│   │   └── vtu/
│   ├── db/
│   │   ├── index.ts               # Drizzle + pg connection
│   │   └── schema.ts              # 38 tables, 14 enums
│   └── lib/
│       ├── api.ts                 # Response helpers
│       ├── auth.ts                # JWT, bcrypt, cookies, session
│       ├── auth-utils.ts          # Client-side auth helpers
│       ├── automation.ts          # In-process simulated workers
│       ├── nav.ts                 # Navigation config
│       ├── queries.ts             # Data access layer
│       └── utils.ts               # Utility functions
├── docs/                          # (being created now)
├── drizzle.config.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## 4. Database Schema Summary (38 Tables, 14 Enums)

### Enums (14)
`user_role`, `resource_type`, `resource_status`, `difficulty`, `opportunity_type`, `work_mode`, `application_status`, `notification_type`, `delivery_status`, `import_status`, `automation_status`, `execution_status`, `bookmark_kind`, `test_attempt_status`

### Tables by Domain

**A. Users & Auth (5 tables)**
- `users` — email unique index ✓, role index ✓
- `refresh_tokens` — tokenHash unique ✓, CASCADE on user delete ✓
- `password_reset_tokens` — tokenHash unique ✓
- `email_verification_tokens` — tokenHash unique ✓
- `audit_logs` — actor index ✓

**B. VTU Resources (6 tables)**
- `branches`, `schemes`, `semesters` — simple lookup tables
- `subjects` — FK to branches, semesters, schemes ✓
- `resources` — FK to subjects, users (uploader) ✓
- `vtu_updates` — FK to users (creator) ✓
- `downloads` — FK to users, resources ✓

**C. DSA (5 tables)**
- `dsa_sheets`, `dsa_patterns` — standalone lookup tables
- `dsa_problems` — FK to sheets, patterns ✓, slug unique ✓
- `dsa_solutions` — FK to problems ✓
- `dsa_progress` — **unique(userId, problemId)** ✓, FK to users & problems ✓
- `bookmarks` — **unique(userId, kind, refId)** ✓

**D. Roadmaps (4 tables)**
- `roadmaps` — standalone
- `roadmap_stages` — FK to roadmaps CASCADE ✓
- `roadmap_topics` — FK to stages CASCADE ✓
- `roadmap_progress` — **unique(userId, roadmapId, topicId)** ✓

**E. Mock Tests (5 tables)**
- `mock_tests`, `questions`, `question_options` — proper CASCADE hierarchy ✓
- `test_attempts` — FK to tests & users ✓, `expiresAt` tracked ✓
- `test_responses` — **unique(attemptId, questionId)** ✓

**F. Jobs & Applications (3 tables)**
- `companies`, `opportunities` — proper structure
- `job_applications` — **unique(userId, opportunityId)** ✓
- `saved_opportunities` — **unique(userId, opportunityId)** ✓

**G. Dashboard & Notifications (6 tables)**
- `notifications`, `notification_preferences` — per-user preferences ✓
- `learning_activities`, `student_streaks` — activity tracking ✓
- `notification_deliveries` — **unique(notificationId, channel)** ✓
- `notification_outbox` — **unique(idempotencyKey)** ✓

**H. Admin & Import (1 table)**
- `import_jobs` — tracks upload/validation/import lifecycle ✓

**I. Automation (5 tables)**
- `automation_rules` — **unique(key)** ✓, cron expression stored
- `automation_executions` — links to rules
- `scheduled_tasks` — **unique(name)** ✓
- `notification_templates` — **unique(key)** ✓
- `automation_settings` — key-value config store

---

## 5. Feature Implementation Status

### 5.1 Authentication & Authorization

| Feature | Status | Notes |
|---------|--------|-------|
| User registration | PARTIALLY IMPLEMENTED | Works but uses bcrypt, not Argon2id |
| Email uniqueness check | COMPLETE | DB unique index + app check |
| Login | PARTIALLY IMPLEMENTED | Works; missing rate limiting |
| JWT access tokens | PARTIALLY IMPLEMENTED | **HARDCODED FALLBACK SECRET** — `engineerprep-dev-access-secret-change-me` |
| JWT refresh tokens | PARTIALLY IMPLEMENTED | Rotation implemented; missing reuse detection revocation |
| Secure cookies | PARTIALLY IMPLEMENTED | httpOnly ✓, Secure (prod only) ✓, SameSite lax ✓; missing CSRF |
| Logout | COMPLETE | Revokes refresh token ✓ |
| Token refresh | COMPLETE | Rotation + user active check ✓ |
| Forgot password | NEEDS SECURITY FIX | **Returns raw reset token in response body** |
| Password reset | PARTIALLY IMPLEMENTED | Token validation ✓; missing rate limiting |
| Email verification | PARTIALLY IMPLEMENTED | Token logic ✓; no actual email sent |
| Rate limiting (login) | MISSING | No rate limiting anywhere |
| CSRF protection | MISSING | No CSRF tokens |
| Account enumeration prevention | PARTIALLY IMPLEMENTED | forgot-password returns same message; login does NOT |
| Admin registration prevention | COMPLETE | Role hardcoded to STUDENT on register ✓ |
| Argon2id hashing | MISSING | Still using bcrypt |
| `requireUser()` middleware | COMPLETE | Reads from DB on each request |
| `requireAdmin()` middleware | COMPLETE | Role check after auth ✓ |

### 5.2 VTU Resources

| Feature | Status | Notes |
|---------|--------|-------|
| List resources with filters | PARTIALLY IMPLEMENTED | Filters implemented; **post-query in-memory filtering for semesterId/branchId/schemeId** (inefficient) |
| Resource types (Notes, QP, etc.) | COMPLETE | Schema + API ✓ |
| Branches, Semesters, Schemes | COMPLETE | Lookup APIs working |
| Download tracking | PARTIALLY IMPLEMENTED | downloadCount not incremented on download |
| File access/download | PLACEHOLDER | Returns seeded demo URL — no real file |
| PDF upload | PLACEHOLDER | Upload route exists but doesn't persist files reliably |
| Bookmarks | PARTIALLY IMPLEMENTED | Schema ✓; API route needs ownership check |
| VTU Updates | COMPLETE | CRUD present |
| Admin resource CRUD | PARTIALLY IMPLEMENTED | Via `[[...slug]]` admin route — not all implemented |

### 5.3 DSA Module

| Feature | Status | Notes |
|---------|--------|-------|
| DSA sheets list | COMPLETE | ✓ |
| DSA patterns list | COMPLETE | ✓ |
| Problems list with filters | COMPLETE | ✓ |
| Problem detail | COMPLETE | ✓ |
| Mark problem complete | **BROKEN** | **`eq(dsaProgress.problemId, body.problemId)` — missing userId filter!** Cross-user data corruption possible |
| Progress per user | COMPLETE | `getDsaProgress(userId)` queries by userId ✓ |
| Bookmarks | MISSING | No bookmark API for DSA problems |
| Admin CRUD | MISSING | No admin endpoints for DSA CRUD |

### 5.4 Roadmaps

| Feature | Status | Notes |
|---------|--------|-------|
| Roadmap list | COMPLETE | ✓ |
| Roadmap detail with stages/topics | COMPLETE | ✓ |
| Mark topic complete | COMPLETE | Has unique constraint ✓ |
| Progress tracking | COMPLETE | `getRoadmapProgress(userId)` ✓ |
| Admin CRUD | MISSING | No admin endpoints |

### 5.5 Mock Tests

| Feature | Status | Notes |
|---------|--------|-------|
| List tests | COMPLETE | Published filter ✓ |
| Start attempt | COMPLETE | Deduplication — resumes existing ✓ |
| Save response | COMPLETE | Upsert + timer check ✓ |
| Submit + score | COMPLETE | Server-side scoring ✓, negative marks ✓ |
| Auto-submit (timer expired) | PARTIALLY IMPLEMENTED | Returns 409 error but doesn't auto-submit |
| Correct answers hidden during test | COMPLETE | `safeQuestions()` strips `isCorrect` ✓ |
| Test history | COMPLETE | ✓ |
| Admin CRUD (create tests/questions) | MISSING | No admin test management endpoints |
| Duplicate submission prevention | COMPLETE | Status check ✓ |
| Option/Question belonging to attempt validation | MISSING | No cross-reference check |

### 5.6 Jobs & Applications

| Feature | Status | Notes |
|---------|--------|-------|
| List opportunities with filters | COMPLETE | Filter by type, branch, batch, location, mode, search ✓ |
| Opportunity detail | COMPLETE | ✓ |
| Save/unsave job | COMPLETE | ✓ |
| Apply to job | COMPLETE | Deadline check ✓, duplicate prevention ✓ |
| Application history | COMPLETE | ✓ |
| Company management | PARTIALLY IMPLEMENTED | Read-only; no admin CRUD API |
| Branch eligibility validation | MISSING | Not validated against user's branch |
| Resume upload on apply | PLACEHOLDER | `resumeUrl` stored but no actual file |

### 5.7 Student Dashboard

| Feature | Status | Notes |
|---------|--------|-------|
| DSA completion stats | COMPLETE | Real DB query ✓ |
| Roadmap completion stats | COMPLETE | Real DB query ✓ |
| Mock test performance | COMPLETE | Real DB query ✓ |
| Learning streak | COMPLETE | Real DB query ✓ |
| Active applications | COMPLETE | Real DB query ✓ |
| Upcoming deadlines | COMPLETE | Real DB query ✓ |
| Learning activity feed | COMPLETE | Real DB query ✓ |
| Hardcoded data | NONE | Dashboard uses real DB ✓ |

### 5.8 Admin Dashboard

| Feature | Status | Notes |
|---------|--------|-------|
| Admin stats | COMPLETE | Real DB counts ✓ |
| Student management | PARTIALLY IMPLEMENTED | List + activate/deactivate/role change ✓; full CRUD missing |
| Automation management | COMPLETE | List rules, enable/disable, manual run ✓ |
| Export | **BROKEN** | Returns hardcoded sample rows, not real database records |
| Import history | COMPLETE | Lists from DB ✓ |
| Bulk import validation | PARTIALLY IMPLEMENTED | CSV/JSON parsing + validation ✓; actual insertion is NOT done |
| Bulk import confirmation | **BROKEN** | Marks COMPLETED without inserting records ("demoMode: true") |
| Content CRUD | PARTIALLY IMPLEMENTED | `getContentForAdmin()` exists; no create/update/delete |
| Audit logs | MISSING | `auditLogs` table exists but nothing writes to it |

### 5.9 Notifications

| Feature | Status | Notes |
|---------|--------|-------|
| List notifications | COMPLETE | ✓ |
| Mark read | COMPLETE | ✓ |
| Notification preferences | COMPLETE | CRUD ✓ |
| In-app via outbox | COMPLETE | Idempotent write ✓ |
| Email delivery | MISSING | `email-queue` handler returns `{sent: false}` |
| Real-time (WebSocket) | MISSING | — |

### 5.10 Automation Engine

| Feature | Status | Notes |
|---------|--------|-------|
| Automation rules DB | COMPLETE | CRUD ✓ |
| Queue definitions | PLACEHOLDER | 11 queues defined as strings; all handlers return fake data |
| VTU content notification | PLACEHOLDER | Handler: `{notified: true, branch}` — no actual student lookup |
| Job alert matching | PLACEHOLDER | Handler: `{matched: 0}` — no actual matching |
| Deadline reminders | PLACEHOLDER | `sweepExpiredOpportunities()` works; reminder sending does not |
| Learning reminders | PLACEHOLDER | Handler: `{reminded: 0}` |
| Streak updates | PLACEHOLDER | Handler: `{updated: 0}` |
| Weekly reports | PLACEHOLDER | Handler: `{generated: 0}` |
| Retry with backoff | MISSING | No retry logic |
| Redis + BullMQ | MISSING | In-process simulation only |
| Independent worker process | MISSING | — |
| Idempotency keys | COMPLETE | outbox table has unique idempotency_key ✓ |
| Outbox pattern | COMPLETE | Writes to outbox before notifications ✓ |
| Cron scheduling | PLACEHOLDER | `nextRunFromCron()` only handles 2 patterns |
| Recovery after restart | MISSING | In-memory only |

### 5.11 File Storage

| Feature | Status | Notes |
|---------|--------|-------|
| Upload endpoint | PLACEHOLDER | Route exists; content-type checked; file not persisted to disk |
| File metadata in DB | MISSING | No `files` table (resources table stores URLs) |
| Local development storage | MISSING | — |
| S3-compatible production storage | MISSING | — |
| Path traversal protection | MISSING | — |
| Private resume download | MISSING | — |
| Demo file URL handling | BROKEN | Seed data uses fake URLs; download tries to serve them |

---

## 6. Security Vulnerabilities

### CRITICAL

| # | Issue | Location | Fix Required |
|---|-------|----------|--------------|
| 1 | Hardcoded fallback JWT secrets | `src/lib/auth.ts:9-14` | Fail on startup if missing in production |
| 2 | Reset token returned in response body | `src/app/api/v1/auth/[[...slug]]/route.ts:184-200` | Send via email only; remove from response |
| 3 | DSA progress missing userId filter | `src/app/api/v1/dsa/[[...slug]]/route.ts:83` | Add `eq(dsaProgress.userId, user.id)` to WHERE clause |
| 4 | bcrypt instead of Argon2id | `src/lib/auth.ts:36-42` | Migrate to Argon2id with bcrypt compatibility path |
| 5 | No login rate limiting | Auth route | Add rate limiter (5 attempts / 15 min per IP) |
| 6 | No password reset rate limiting | Auth route | Add rate limiter |

### HIGH

| # | Issue | Location | Fix Required |
|---|-------|----------|--------------|
| 7 | Missing CSRF protection | All state-changing API routes | Add CSRF double-submit cookie pattern |
| 8 | No Helmet / security headers | App config | Add Helmet or Next.js security headers |
| 9 | No CORS allowlist | API routes | Add strict CORS policy |
| 10 | No request size limits | Middleware | Add body size limits (1MB JSON, 50MB upload) |
| 11 | Refresh token reuse not fully revoked | `rotateRefreshToken()` | Revoke entire family on reuse detection |
| 12 | Audit logs table never written to | Admin operations | Write audit log entries |
| 13 | No path traversal protection | File serving | Sanitize file paths |

### MEDIUM

| # | Issue | Location | Fix Required |
|---|-------|----------|--------------|
| 14 | No XSS prevention headers | — | Content-Security-Policy header |
| 15 | drizzle.config.json has hardcoded DB URL | `drizzle.config.json` | Move to env variable |
| 16 | Pagination done in application memory | `getResources()`, `getOpportunities()` | Move to SQL LIMIT/OFFSET |
| 17 | No dependency vulnerability scan | — | Add `npm audit` to CI |

---

## 7. Missing Infrastructure

- [ ] `.env.example` file
- [ ] Environment variable validation at startup
- [ ] Dockerfile (frontend)
- [ ] Dockerfile (backend/worker)  
- [ ] `docker-compose.yml`
- [ ] `docker-compose.prod.yml`
- [ ] `.dockerignore`
- [ ] GitHub Actions CI pipeline
- [ ] Nginx/Caddy reverse proxy config
- [ ] Vitest / Jest test suite
- [ ] Drizzle migration files (only config exists, no migration folder)
- [ ] Separate Express backend
- [ ] Redis + BullMQ worker
- [ ] Nodemailer email service
- [ ] Real file storage (Multer + local/S3)
- [ ] Swagger / OpenAPI documentation

---

## 8. Implementation Plan (Phased)

### Phase 1 — Security Fixes (IMMEDIATE)
1. Fix DSA progress cross-user bug (critical data integrity)
2. Remove reset token from response body (critical security)
3. Add startup environment validation
4. Add login/reset rate limiting
5. Upgrade from bcrypt to Argon2id (with migration support)
6. Remove hardcoded JWT fallback secrets in production

### Phase 2 — Backend Architecture
1. Create separate Express backend structure
2. Set up health endpoint
3. Configure Helmet, CORS, body limits
4. Set up proper logging (Winston/pino)

### Phase 3 — Database Migrations
1. Generate initial Drizzle migration baseline
2. Add missing indexes
3. Fix `drizzle.config.json` to use env variable

### Phase 4 — Complete Business APIs
1. Fix bulk import to actually insert records
2. Fix admin export to use real DB data
3. Complete admin CRUD for all entities
4. Add database-level pagination

### Phase 5 — File Storage
1. Implement Multer for uploads
2. Local storage for dev, S3 config for prod
3. Secure file download endpoint

### Phase 6 — Automation Engine
1. Install Redis + BullMQ
2. Create real queue workers
3. Implement actual job/VTU matching logic
4. Implement email queue with Nodemailer

### Phase 7 — Testing
1. Set up Vitest + Supertest
2. Write authentication tests
3. Write authorization/ownership tests
4. Write business logic tests

### Phase 8 — Docker + CI/CD
1. Create multi-stage Dockerfiles
2. Create docker-compose files
3. Create GitHub Actions pipeline

### Phase 9 — Documentation
1. Complete all doc files
2. Generate Swagger spec
3. Create Postman collection

---

## 9. Working Features (Can Be Preserved As-Is)

- Database schema (38 tables, 14 enums) — well designed
- Authentication flow (login/register/logout/refresh/reset/verify)
- JWT cookie management
- Student dashboard data queries
- Mock test engine (start, answer, submit, score)
- Job listing, search, save, apply
- VTU resource listing and filtering
- DSA sheet/pattern/problem listing
- Roadmap listing and progress tracking
- Notification listing and preferences
- Admin stats overview
- Automation rule management (CRUD, enable/disable, manual run)
- Notification outbox/idempotency system

---

*This audit was generated by reading the actual source code. All status values reflect the real implementation, not the README.*

