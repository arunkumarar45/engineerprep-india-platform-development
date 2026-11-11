# EngineerPrep India — Security Audit & Remediation Log

## 1. Threat Model & Security Posture
* **Authentication:** Stateless Access JWT (15-minute TTL) + Rotated Refresh Token stored as SHA-256 hash in PostgreSQL.
* **Authorization:** Role-Based Access Control (`STUDENT` vs `ADMIN`) enforced via server-side session checks.
* **Storage Security:** MIME-type validation, random UUID file renaming, and path traversal protection.

## 2. Identified Vulnerabilities & Remediation Actions

### Vulnerability S-01: In-Memory Rate Limiting Bypass & Memory Leak (High)
* **Location:** `src/app/api/v1/auth/[[...slug]]/route.ts`
* **Impact:** In multi-instance deployments, attackers can bypass brute-force limits. Stale keys cause unbounded memory growth.
* **Remediation:** Integrate Redis-backed rate limiting with fallback to in-memory window only when Redis is unavailable.

### Vulnerability S-02: Missing Content Security Policy (Medium)
* **Location:** `next.config.ts`
* **Impact:** XSS vulnerability if untrusted content is injected into DOM.
* **Remediation:** Configure `Content-Security-Policy` header restricting script, style, and frame sources.

### Vulnerability S-03: Insecure Direct Object Reference (IDOR) on User Notifications & Bookmarks (High)
* **Location:** `src/app/api/v1/notifications/[[...slug]]/route.ts`, `src/app/api/v1/resources/[[...slug]]/route.ts`
* **Impact:** A malicious student could read, mark, or delete other students' notifications or bookmarks by guessing IDs.
* **Remediation:** Scope all mutations with `eq(table.userId, sessionUser.id)`.

### Vulnerability S-04: File Signature Validation on Uploads (Medium)
* **Location:** `src/app/api/v1/uploads/route.ts`
* **Impact:** Renaming an executable to `.pdf` could bypass simple MIME header checks.
* **Remediation:** Validate file magic bytes (`%PDF-` for PDFs, PNG/JPEG headers for images).

