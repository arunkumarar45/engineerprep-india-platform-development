# EngineerPrep India — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                            │
└─────────────────────────┬───────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Nginx / Caddy Reverse Proxy                         │
│           (TLS termination, rate limiting)                       │
└─────────────┬───────────────────────────────────────────────────┘
              │ HTTP
              ▼
┌─────────────────────────────────────────────────────────────────┐
│          Next.js Application (Port 3000)                         │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │   App Router Pages   │  │       API Routes (/api/v1)       │ │
│  │  (React Server       │  │                                  │ │
│  │   Components +       │  │  /auth        /dsa               │ │
│  │   Client Components) │  │  /vtu         /roadmaps          │ │
│  │                      │  │  /resources   /tests             │ │
│  │  /dashboard          │  │  /jobs        /users             │ │
│  │  /vtu                │  │  /dashboard   /notifications     │ │
│  │  /jobs               │  │  /admin       /uploads           │ │
│  │  /placements         │  │  /search                         │ │
│  │  /admin              │  └──────────────┬───────────────────┘ │
│  │  /profile            │                 │                      │
│  └──────────────────────┘                 │                      │
└──────────────────────────────────────────┼──────────────────────┘
                                           │
              ┌────────────────────────────┼──────────────────┐
              │                            │                   │
              ▼                            ▼                   ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐
│   PostgreSQL 16      │  │     Redis 7          │  │  Local Storage   │
│                      │  │                      │  │  (dev) / S3      │
│  38 tables           │  │  - Session cache     │  │  (prod)          │
│  14 enums            │  │  - Future: BullMQ    │  │                  │
│  Drizzle ORM         │  │    job queues        │  │  - Uploads       │
│                      │  │  - Rate limit store  │  │  - Resumes       │
└─────────────────────┘  └─────────────────────┘  └──────────────────┘
```

## Technology Stack

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| **Frontend** | Next.js App Router | 16.2.6 | React Server + Client Components |
| **UI** | React | 19.2.6 | — |
| **Styling** | Tailwind CSS | 4.1.17 | — |
| **Language** | TypeScript | 5.9.3 | Strict mode |
| **Database** | PostgreSQL | 16 | — |
| **ORM** | Drizzle ORM | 0.45.2 | Type-safe SQL |
| **Auth Tokens** | jose (JWT) | ^6.2.15 | HS256, issuer + audience validation |
| **Password Hashing** | @node-rs/argon2 | — | Argon2id; bcrypt as fallback |
| **Validation** | Zod | ^4.6.7 | Schema-first validation |
| **Email** | Nodemailer | — | SMTP; Ethereal.email in dev |
| **Testing** | Vitest + Supertest | 5.1.0 | Node environment |
| **Containerization** | Docker + Compose | — | Multi-stage builds |
| **CI/CD** | GitHub Actions | — | On push to main |

## Security Architecture

### Authentication Flow

```
Client                     Next.js                    PostgreSQL
  │                           │                             │
  │── POST /api/v1/auth/login ──►                           │
  │                           │── SELECT user by email ──►  │
  │                           │◄── user record ─────────────│
  │                           │                             │
  │                           │  Argon2id.verify(password)  │
  │                           │  (or bcrypt if legacy hash)  │
  │                           │                             │
  │                           │── INSERT refresh_tokens ──► │
  │                           │                             │
  │◄── Set-Cookie (epi_access, epi_refresh) ────────────────│
  │    httpOnly, Secure, SameSite=lax                       │
```

### Refresh Token Rotation

```
Client                     Next.js                    PostgreSQL
  │                           │                             │
  │── POST /api/v1/auth/refresh ►                           │
  │   Cookie: epi_refresh=<token>                           │
  │                           │── SELECT refresh_token ──►  │
  │                           │   WHERE hash = sha256(token) │
  │                           │   AND expires_at > NOW()    │
  │                           │◄── stored token ────────────│
  │                           │                             │
  │                           │  IF revokedAt IS NOT NULL:  │
  │                           │    REVOKE ALL user sessions  │
  │                           │    (token reuse detected)   │
  │                           │                             │
  │                           │── UPDATE old token: revoked ►│
  │                           │── INSERT new refresh token ►│
  │                           │                             │
  │◄── Set-Cookie (new tokens) ─────────────────────────────│
```

## Database Architecture

### Entity Relationships

```
users (1) ──── (N) refresh_tokens
users (1) ──── (N) password_reset_tokens
users (1) ──── (N) email_verification_tokens
users (1) ──── (N) dsa_progress ──── (1) dsa_problems
users (1) ──── (N) roadmap_progress ──── (1) roadmap_topics
users (1) ──── (N) bookmarks
users (1) ──── (N) test_attempts ──── (N) test_responses
users (1) ──── (N) job_applications ──── (1) opportunities
users (1) ──── (N) saved_opportunities ──── (1) opportunities
users (1) ──── (1) notification_preferences
users (1) ──── (1) student_streaks
users (1) ──── (N) notifications
users (1) ──── (N) learning_activities
users (1) ──── (N) downloads ──── (1) resources

branches (1) ──── (N) subjects
schemes (1) ──── (N) subjects
semesters (1) ──── (N) subjects
subjects (1) ──── (N) resources

dsa_sheets (1) ──── (N) dsa_problems
dsa_patterns (1) ──── (N) dsa_problems
dsa_problems (1) ──── (N) dsa_solutions
dsa_problems (1) ──── (N) dsa_progress

roadmaps (1) ──── (N) roadmap_stages
roadmap_stages (1) ──── (N) roadmap_topics
roadmap_topics (1) ──── (N) roadmap_progress

mock_tests (1) ──── (N) questions
questions (1) ──── (N) question_options
test_attempts (1) ──── (N) test_responses

companies (1) ──── (N) opportunities
opportunities (1) ──── (N) job_applications
opportunities (1) ──── (N) saved_opportunities

automation_rules (1) ──── (N) automation_executions
notifications (1) ──── (N) notification_deliveries
```

## Module Architecture

### API Route Structure

All API routes follow the pattern `/api/v1/{module}/{...slug}`:

```
/api/v1/auth/register          POST — Create account
/api/v1/auth/login             POST — Login
/api/v1/auth/logout            POST — Logout
/api/v1/auth/refresh           POST — Refresh tokens
/api/v1/auth/forgot-password   POST — Request reset link
/api/v1/auth/reset-password    POST — Apply new password
/api/v1/auth/verify-email      POST — Confirm email token
/api/v1/auth                   GET  — Get current user

/api/v1/vtu/branches           GET  — List branches
/api/v1/vtu/semesters          GET  — List semesters
/api/v1/vtu/schemes            GET  — List schemes
/api/v1/vtu/resources          GET  — List resources (with filters)
/api/v1/vtu/updates            GET  — List VTU updates
/api/v1/vtu/download/{id}      POST — Download resource

/api/v1/dsa/sheets             GET  — List DSA sheets
/api/v1/dsa/sheets/{slug}      GET  — Get sheet with problems
/api/v1/dsa/patterns           GET  — List patterns
/api/v1/dsa/patterns/{slug}    GET  — Get pattern with problems
/api/v1/dsa/problems           GET  — List problems
/api/v1/dsa/problems/{slug}    GET  — Get problem detail
/api/v1/dsa/progress           POST — Mark problem solved/unsolved

/api/v1/roadmaps               GET  — List roadmaps
/api/v1/roadmaps/{slug}        GET  — Get roadmap detail
/api/v1/roadmaps/progress      POST — Mark topic complete

/api/v1/tests                  GET  — List published tests
/api/v1/tests/detail/{id}      GET  — Get test questions (safe)
/api/v1/tests/attempt/{id}     GET  — Resume attempt
/api/v1/tests/history          GET  — User's test history
/api/v1/tests/attempt          POST — Start new attempt
/api/v1/tests/submit/{id}      POST — Submit and score
/api/v1/tests/answer/{id}      PATCH — Save single answer

/api/v1/jobs                   GET  — List opportunities
/api/v1/jobs/{id}              GET  — Get job detail
/api/v1/jobs/saved             GET  — User's saved jobs
/api/v1/jobs/applications      GET  — User's applications
/api/v1/jobs/save              POST — Toggle save job
/api/v1/jobs/apply/{id}        POST — Submit application

/api/v1/dashboard              GET  — Student dashboard data
/api/v1/notifications          GET  — List notifications
/api/v1/notifications/mark-read POST — Mark read
/api/v1/users/profile          GET/PUT — User profile
/api/v1/users/preferences      GET/PUT — Notification prefs
/api/v1/search?q=...           GET  — Global search

/api/v1/admin/stats            GET  — Platform statistics
/api/v1/admin/students         GET  — All students
/api/v1/admin/students/{id}    PUT  — Update student
/api/v1/admin/content          GET  — All content overview
/api/v1/admin/resources        POST — Create resource
/api/v1/admin/resources/{id}   PUT/DELETE — Manage resource
/api/v1/admin/opportunities    POST — Create opportunity
/api/v1/admin/automations      GET/POST — Automation rules
/api/v1/admin/automations/run/{id} POST — Manual trigger
/api/v1/admin/import           GET/POST — Bulk import
/api/v1/admin/export?kind=...  GET  — Export real DB data
/api/v1/admin/audit-logs       GET  — Audit trail

/api/v1/uploads                POST — File upload
/api/health                    GET  — Health check
```

## Security Controls

| Control | Implementation | Status |
|---------|---------------|--------|
| Password hashing | Argon2id (new) + bcrypt compat (legacy) | ✅ |
| JWT signing | HS256 with env-managed secrets | ✅ |
| Cookie security | httpOnly, Secure (prod), SameSite=lax | ✅ |
| Refresh token rotation | Reuse detection → revoke family | ✅ |
| Rate limiting | In-memory per-IP (login + reset) | ✅ |
| Input validation | Zod schemas on all inputs | ✅ |
| SQL injection | Parameterized queries via Drizzle ORM | ✅ |
| Data isolation | userId required in all ownership queries | ✅ |
| Reset token security | Sent via email only, never in response | ✅ |
| Security headers | X-Frame-Options, X-Content-Type-Options, etc. | ✅ |
| Audit logging | Admin operations logged to audit_logs | ✅ |
| CSRF | SameSite=lax cookie provides CSRF protection | ✅ |
| Account enumeration | Uniform responses on forgot-password | ✅ |

## Data Flow — Bulk Import

```
Admin uploads CSV
       │
       ▼
  Parse file
  (CSV/JSON/XLSX)
       │
       ▼
  Validate rows
  (required columns,
   format checks)
       │
       ├── Errors found ──► Return error report + importJobId
       │
       ▼
  Store ALL valid rows in
  importJobs.preview (JSONB)
  status = VALIDATED
       │
       ▼
  Admin confirms import
  (POST action=confirm)
       │
       ▼
  status = PROCESSING
       │
       ▼
  Insert rows into
  target table(s)
  (upsert + dedup)
       │
       ▼
  status = COMPLETED
  importedRows = N
       │
       ▼
  Audit log written
```

