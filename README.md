# EngineerPrep India

**A comprehensive engineering student learning and placement platform built for VTU students.**

[![CI](https://github.com/your-org/engineerprep-india/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/engineerprep-india/actions)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6)
![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black)
![Tests](https://img.shields.io/badge/tests-57%20passed-brightgreen)

---

## Features

| Module | Status |
|--------|--------|
| 🔐 Authentication (register, login, JWT, MFA-ready) | ✅ |
| 📚 VTU Resources (notes, QP, syllabus, assignments) | ✅ |
| 🧮 DSA Practice (sheets, patterns, problems, progress) | ✅ |
| 🗺️ Developer Roadmaps (stages, topics, progress) | ✅ |
| 📝 Mock Tests (timed, scored, negative marking) | ✅ |
| 💼 Jobs & Internships (search, apply, track) | ✅ |
| 📊 Student Dashboard (real-time stats) | ✅ |
| 🔔 Notifications (in-app + email) | ✅ |
| 👑 Admin Panel (full CRUD + automation) | ✅ |
| 📥 Bulk Import (CSV/JSON → real DB insertion) | ✅ |
| ⚙️ Automation Engine (rule-based, audit-logged) | ✅ |

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+ (optional — for automation queues)

### Setup

```bash
# Install dependencies
npm install --legacy-peer-deps

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT secrets

# Push database schema
npx drizzle-kit push

# Seed development data
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Docker (Full Stack)

```bash
# Start all services (PostgreSQL + Redis + App)
docker compose up -d

# View health
curl http://localhost:3000/api/health
```

---

## Development Commands

```bash
npm run dev              # Start Next.js dev server
npm run build            # Production build
npm run typecheck        # TypeScript type check
npm run lint             # ESLint
npm test                 # Run test suite (57 tests)
npm run test:coverage    # Run with coverage
npm run db:push          # Push schema changes to DB
npm run db:generate      # Generate migration files
npm run db:studio        # Open Drizzle Studio (DB GUI)
npm run db:seed          # Seed development data
```

---

## Security

This project implements multiple layers of security:

- **Argon2id** password hashing (with transparent bcrypt upgrade path)
- **JWT refresh token rotation** with reuse detection
- **Rate limiting** on login and password reset endpoints
- **Data isolation** — every student query enforces `userId` ownership
- **Reset tokens** sent exclusively via email (never in response body)
- **HTTP security headers** via Next.js config
- **Audit logging** for all sensitive admin operations

See [`docs/SECURITY.md`](docs/SECURITY.md) for the complete security guide.

---

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/PROJECT_AUDIT.md`](docs/PROJECT_AUDIT.md) | Full codebase audit with implementation status |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture, diagrams, API reference |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Security model, fixes, and guidance |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Docker, VPS, Nginx, SSL setup |
| [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md) | Test results and coverage |

---

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Protected pages (dashboard, jobs, vtu, etc.)
│   ├── api/v1/             # REST API routes
│   ├── login/              # Auth pages
│   └── register/
├── components/             # React UI components
├── db/
│   ├── index.ts            # Drizzle + PostgreSQL connection
│   └── schema.ts           # 38 tables, 14 enums
└── lib/
    ├── auth.ts             # JWT, Argon2id, cookies, session
    ├── email.ts            # Nodemailer email delivery
    ├── env.ts              # Environment validation
    ├── queries.ts          # Data access layer
    └── automation.ts       # Automation engine
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/engineerprep_db
JWT_ACCESS_SECRET=<64-byte-hex-secret>
JWT_REFRESH_SECRET=<different-64-byte-hex-secret>
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.gmail.com          # Optional in dev
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your-app-password
```

> **Production:** The app refuses to start if `JWT_ACCESS_SECRET` or `JWT_REFRESH_SECRET` use default values.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Run tests: `npm test`
4. Run type check: `npm run typecheck`
5. Submit a PR against `develop`

All PRs run the CI pipeline (lint → typecheck → test → build).

---

## License

MIT © EngineerPrep India
