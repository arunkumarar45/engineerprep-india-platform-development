# EngineerPrep India — Bug & Issue Tracker

| Issue ID | File Path | Current Behaviour | Expected Behaviour | Root Cause | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **BUG-001** | `src/app/api/v1/auth/[[...slug]]/route.ts` | In-memory `Map` stores login attempts. | Redis-backed sliding window rate limiter with memory fallback. | Volatile memory state resets across processes and leaks RAM. | P0 | RESOLVED |
| **BUG-002** | `src/lib/queries.ts` | `getResources()` & `getOpportunities()` loaded all rows and filtered in JavaScript memory. | Direct SQL filtering via `where(and(...))` pushed down to PostgreSQL. | Post-query JavaScript filtering defeated database indexes. | P0 | RESOLVED |
| **BUG-003** | `src/lib/api.ts` | Database query filtering was unindexed. | Indexed relational queries with SQL push-down. | Missing multi-column indices and where clauses. | P0 | RESOLVED |
| **BUG-004** | `next.config.ts` | Missing Content Security Policy and HSTS headers. | Complete security headers configured (HSTS, CSP allowing YouTube embeds, frame-ancestors none). | Default Next.js config lacked strict CSP. | P1 | RESOLVED |
| **BUG-005** | `src/workers/worker.ts` | Worker script required runtime TS compilation. | Production runner executes pre-compiled bundle `dist/worker.js`. | Missing worker build script in packaging. | P1 | RESOLVED |
| **BUG-006** | `docker-compose.yml` & `Dockerfile` | Worker command ran `node -e require('tsx/cjs')` in Alpine runner. | Alpine runner executes `node dist/worker.js` built via esbuild. | `tsx` is a dev dependency not included in standalone runner. | P1 | RESOLVED |
| **BUG-007** | `src/app/api/v1/notifications/[[...slug]]/route.ts` | Updating/marking read didn't verify `userId == sessionUser.id`. | IDOR protection: only owner can mark or delete notification. | Missing ownership `where` clause on notification update/delete. | P0 | RESOLVED |
| **BUG-008** | `src/app/api/v1/jobs/[[...slug]]/route.ts` | Students could apply to expired/closed job vacancies. | Block applications if `status !== 'OPEN'` or deadline passed. | Missing status and deadline checks in application handler. | P1 | RESOLVED |
| **BUG-009** | `src/components/placements/sections.tsx` | React hydration mismatch when browser extensions inspect DOM. | Safe hydration mounting, localStorage persistence, and `suppressHydrationWarning`. | Extension DOM mutation and missing client mount check. | P1 | RESOLVED |
| **BUG-010** | `src/app/api/v1/tests/[[...slug]]/route.ts` | Mock test submission executed across multiple non-atomic queries. | Wrapped in PostgreSQL database transaction (`db.transaction`). | Race condition risk during concurrent test submissions. | P0 | RESOLVED |
