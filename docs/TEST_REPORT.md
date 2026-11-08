# EngineerPrep India — Test Report

**Date:** 2026-11-04  
**Vitest Version:** 5.1.0  
**Test Environment:** Node.js v24.14.0  

---

## Summary

| Metric | Value |
|--------|-------|
| **Test Files** | 5 |
| **Total Tests** | 57 |
| **Passed** | ✅ 57 |
| **Failed** | ❌ 0 |
| **Skipped** | ⏭ 0 |
| **Duration** | ~2.7 seconds |

---

## Test Results by File

### `auth.test.ts` — 24 tests ✅

Tests the core authentication utilities in `src/lib/auth.ts`.

| Test | Status | Duration |
|------|--------|----------|
| hashPassword — hashes and verifies correctly | ✅ | ~1300ms |
| hashPassword — rejects wrong password | ✅ | ~84ms |
| hashPassword — produces different hashes (salt) | ✅ | ~78ms |
| isLegacyBcryptHash — identifies bcrypt hashes | ✅ | <1ms |
| isLegacyBcryptHash — does not flag argon2id | ✅ | <1ms |
| isLegacyBcryptHash — does not flag plain strings | ✅ | <1ms |
| hashToken — produces a hex string | ✅ | <1ms |
| hashToken — is deterministic | ✅ | <1ms |
| hashToken — produces different hashes for different inputs | ✅ | <1ms |
| createOpaqueToken — creates hex string of default length | ✅ | <1ms |
| createOpaqueToken — respects custom byte length | ✅ | <1ms |
| createOpaqueToken — generates unique tokens | ✅ | <1ms |
| signAccessToken — signs and verifies a valid token | ✅ | ~4ms |
| verifyAccessToken — returns null for invalid token | ✅ | <1ms |
| verifyAccessToken — returns null for tampered token | ✅ | <1ms |
| verifyAccessToken — returns null for empty string | ✅ | <1ms |
| signRefreshToken — signs and verifies valid token | ✅ | <1ms |
| verifyRefreshToken — rejects invalid token | ✅ | <1ms |
| verifyRefreshToken — rejects access token as refresh | ✅ | <1ms |
| passwordStrength — rates strong password correctly | ✅ | <1ms |
| passwordStrength — rates medium password correctly | ✅ | <1ms |
| passwordStrength — rates weak password correctly | ✅ | <1ms |
| passwordStrength — caps score at 100 | ✅ | <1ms |
| AuthError — creates error with correct status | ✅ | <1ms |
| AuthError — defaults to status 401 | ✅ | <1ms |
| AuthError — is an instance of Error | ✅ | <1ms |

**Note:** The `hashPassword` tests are slower due to Argon2id's intentional computational cost (memory-hard, designed to be slow for security).

---

### `bulk-import.test.ts` — 11 tests ✅

Tests the CSV parser and import validation logic.

| Test | Status |
|------|--------|
| parseCsv — parses simple CSV correctly | ✅ |
| parseCsv — handles quoted fields with commas | ✅ |
| parseCsv — handles escaped quotes inside quoted fields | ✅ |
| parseCsv — returns empty array for empty input | ✅ |
| parseCsv — returns empty array for header-only CSV | ✅ |
| parseCsv — handles trailing whitespace in cells | ✅ |
| parseCsv — handles Windows-style line endings (CRLF) | ✅ |
| parseCsv — handles missing column values | ✅ |
| DSA Problem validation — identifies valid rows | ✅ |
| DSA Problem validation — identifies invalid difficulty values | ✅ |

---

### `data-isolation.test.ts` — 5 tests ✅

**Critical regression tests** for the cross-user data isolation security fix.

| Test | Status | Severity |
|------|--------|---------|
| DSA Progress — requires both problemId AND userId | ✅ | 🔴 CRITICAL |
| DSA Progress — user A cannot update user B's progress | ✅ | 🔴 CRITICAL |
| DSA Progress — getUserDsaProgress scoped to user | ✅ | 🔴 CRITICAL |
| Job Application — unique constraint prevents duplicates | ✅ | 🟡 HIGH |
| Bookmarks — unique constraint scopes to userId+kind+refId | ✅ | 🟡 HIGH |

---

### `mock-test.test.ts` — 8 tests ✅

Tests the server-side test scoring engine.

| Test | Status |
|------|--------|
| Scoring — all correct answers | ✅ |
| Scoring — negative marking for wrong answers | ✅ |
| Scoring — score never goes below 0 | ✅ |
| Scoring — tracks topic performance correctly | ✅ |
| Scoring — handles all unattempted questions | ✅ |
| Timer — detects expired test attempt | ✅ |
| Timer — calculates expiry correctly from duration | ✅ |
| Percentage — calculates correctly | ✅ |

---

### `env.test.ts` — 8 tests ✅

Tests the environment configuration module.

| Test | Status |
|------|--------|
| nodeEnv is test in test environment | ✅ |
| isTest is true in test environment | ✅ |
| isProduction is false in test environment | ✅ |
| frontendUrl has a default value | ✅ |
| smtp.configured is false without SMTP vars | ✅ |
| storage.type defaults to local | ✅ |
| logLevel has a default value | ✅ |
| corsOrigins is an array | ✅ |

---

## TypeScript Check

```
$ npx tsc --noEmit
✅ No errors
```

---

## Known Test Limitations

1. **No integration tests** — Tests do not connect to a real PostgreSQL database. All database interactions are mocked.

2. **No E2E tests** — No browser-based end-to-end tests (Playwright/Cypress). Visual regression testing not implemented.

3. **No API route tests with Supertest** — Next.js API routes require a running server for Supertest integration tests. These would need a test database and are suitable for a separate CI environment.

4. **No load testing** — Performance under concurrent users has not been tested.

## Recommended Future Tests

```typescript
// High-priority integration tests to add with a test database:
describe('POST /api/v1/auth/register', () => {
  it('creates a new student account')
  it('prevents duplicate email registration')
  it('never returns password hash in response')
})

describe('POST /api/v1/auth/login', () => {
  it('returns tokens on valid credentials')
  it('rejects invalid password')
  it('rate limits after 5 attempts')
})

describe('POST /api/v1/dsa/progress', () => {
  it('marks problem complete for authenticated user')
  it('refuses to mark another user\'s problem')
  it('handles duplicate progress gracefully')
})
```

---

## Build Status

```
$ npm run typecheck   ✅ PASSED
$ npm test            ✅ 57/57 PASSED
$ npm run build       (requires DATABASE_URL to be set — build validation)
```

