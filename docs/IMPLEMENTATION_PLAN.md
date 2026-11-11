# EngineerPrep India — Comprehensive Implementation Plan

## Overview
This document tracks the prioritized production-readiness roadmap for transforming **EngineerPrep India** into an enterprise-grade academic and placement super-platform.

---

## Roadmap Phases & Task Checklist

### Phase 1: Security Hardening & Data Isolation (P0 - Critical)
- [x] **SEC-01**: Implement Redis-backed sliding window rate limiter for auth routes (`/api/v1/auth/login`, `/api/v1/auth/forgot-password`).
- [x] **SEC-02**: Enforce strict server-side record ownership checks on bookmarks, notifications, downloads, and job applications to eliminate IDOR.
- [x] **SEC-03**: Add strict Content Security Policy (CSP) and HSTS security headers in `next.config.ts`.
- [x] **SEC-04**: Add file signature (magic number) verification for uploaded PDFs and enforce size quotas.
- [x] **SEC-05**: Ensure production cookie security (`SameSite=lax`, `Secure`, `HttpOnly`).

### Phase 2: Database Query Optimization & Relational Integrity (P0 - Critical)
- [x] **DB-01**: Replace in-memory array filtering in `src/lib/queries.ts` (`getResources`, `getOpportunities`) with native SQL `WHERE` clauses.
- [x] **DB-02**: Implement true database-level `LIMIT` / `OFFSET` pagination helpers in `src/lib/api.ts` and `src/lib/queries.ts`.
- [x] **DB-03**: Add composite unique indexes on `dsa_progress(user_id, problem_id)` and `bookmarks(user_id, kind, ref_id)`.
- [x] **DB-04**: Standardize job statuses: `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `OPEN`, `CLOSED`, `EXPIRED`.
- [x] **DB-05**: Standardize resource statuses: `UPLOADED`, `PENDING_REVIEW`, `APPROVED`, `PUBLISHED`, `REJECTED`.

### Phase 3: VTU Academic Resource System Completion (P1 - High)
- [x] **VTU-01**: Seed full academic catalog from VTU Circle (805 resources across 243 subjects): Modules 1–5 lecture notes, official Model Question Papers (MQPs), Previous Year Exam Papers (PYQs), important question banks, official syllabus documents, and lab manuals.
- [x] **VTU-02**: Unified upload page (`/vtu/upload`) with drag-and-drop, client validation, category-based uploads, and progress indicators.
- [x] **VTU-03**: PDF in-browser preview modal with permanent Google Drive embeds and download tracking.
- [x] **VTU-04**: Scheme-based filtering directly in SQL queries (2018, 2021, 2022 Scheme).

### Phase 4: Job Portal & Application Tracking (P1 - High)
- [x] **JOB-01**: Comprehensive job search and multi-facet filtering (salary range, location, batch, work mode).
- [x] **JOB-02**: Student application lifecycle tracking (`APPLIED` -> `UNDER_REVIEW` -> `SHORTLISTED` -> `REJECTED` -> `OFFERED`).
- [x] **JOB-03**: Company detail profiles with active openings list.
- [x] **JOB-04**: Community job submission dialog with instant moderation status.

### Phase 5: Placement & Exam Simulation Engine (P1 - High)
- [x] **EXAM-01**: Server-authoritative timing and idempotent test submission in `mock-tests` using `db.transaction`.
- [x] **EXAM-02**: 24 Essential DSA Patterns mapped to 2,631 real LeetCode problems with interactive tracking.
- [x] **EXAM-03**: Comprehensive company preparation hub (TCS, Infosys, Cognizant, Wipro, Amazon, Microsoft) with compensation packages, selection rounds, and interview questions.
- [x] **EXAM-04**: Top 110 SQL interview queries sheet with category filtering, full pagination, 1-click copy, and hydration fix.
- [x] **EXAM-05**: Curated video playlists with interactive embedded YouTube player modal (`youtube-nocookie.com`) and direct links to YouTube for Striver, NeetCode, Love Babbar, Kunal Kushwaha, Fraz, and Rohit Negi.

### Phase 6: DevOps, Background Worker & Docker Production (P1 - High)
- [x] **OPS-01**: Fix worker container build: compile TypeScript worker so `node dist/worker.js` runs in minimal Alpine runner.
- [x] **OPS-02**: Connect real queue handlers in `src/workers/worker.ts` for deadline reminders, streaks, and job alerts.
- [x] **OPS-03**: Graceful Redis failure degradation.

### Phase 7: Advanced Value-Add Features (P2 - Medium)
- [x] **FEAT-01**: Interactive Placement Resume Builder (`/resume`) with ATS scoring and PDF export.
- [x] **FEAT-02**: Developer Roadmaps resource link population across all 101 learning topics.

