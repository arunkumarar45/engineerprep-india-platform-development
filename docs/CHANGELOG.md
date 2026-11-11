# EngineerPrep India — Changelog

All notable changes to the codebase will be documented in this file.

## [Unreleased] - 2026-11-08

### Added
- **VTU Circle Full Academic Repository Integration (`VTU-01`)**: Scraped, cataloged, and seeded 805 verified VTU study resources across 243 subjects from VTU Circle (`vtucircle.com`), spanning 2022 Scheme and 2021 Scheme for CSE, ISE, AIML, DS, ECE, EEE, ME, and CIV branches:
  - 312 Module 1–5 Lecture Notes with permanent Google Drive embed/preview links.
  - 242 Official VTU Model Question Papers (MQPs) and Previous Year Exam Question Papers (PYQs, 2023–24).
  - 121 Comprehensive Important Question Banks (covering all 5 modules).
  - 121 Official VTU Syllabus and curriculum copies.
  - 9 Authentic VTU Laboratory Manuals (Data Structures Lab BCSL305, ADA Lab BCSL404, Web Tech Lab BCSL504, ML Lab BCSL606, DSP Lab 22ECL54, VLSI Lab 22ECL64, Power Electronics 22EEL54, Heat Transfer 22MEL54, Highway Lab 22CVL54).
- **Embedded YouTube Player & Top Playlists Upgrade**:
  - Added interactive embedded YouTube player modal (`youtube-nocookie.com`) directly in `/placements/dsa-playlists` allowing students to watch lectures without leaving the platform.
  - Enriched catalog with top industry playlists: Striver's A2Z DSA Course (take U forward), NeetCode 150 & Roadmap, Kunal Kushwaha Complete Java + DSA Bootcamp, and Mohammad Fraz SDE Sheet Playlist.
  - Direct 1-click links to official YouTube playlists and per-lecture YouTube videos.
- **Top 110 SQL Interview Queries Suite**:
  - Added Category filtering (Basic SELECT, Filtering, Aggregations, Joins, Window Functions, Subqueries & CTEs).
  - Added Page Size toggle (20 / 50 / All 110 queries).
  - Added 1-click "Copy SQL" button with visual confirmation.
  - Hydration-safe mounting check eliminating SSR/client hydration warnings.
- **Developer Roadmaps Resource Link Population**:
  - Populated authentic official documentation URLs across all 101 topics in 8 developer roadmaps (MDN, react.dev, spring.io, kubernetes.io, docs.python.org, pytorch.org, etc.).
- **24 Essential DSA Patterns Mapping**:
  - Expanded and validated all 24 coding patterns (Two Pointers, Fast & Slow Pointers, Sliding Window, Two Heaps, Graphs, Dynamic Programming, Monotonic Stack, etc.) mapped to 2,631 real LeetCode problems.
- **Interactive Resume Builder Module** (`/resume`, `ResumeBuilder.tsx`): Real-time ATS scorer (0-100) with category-by-category rubric analysis, action-verb and quantitative metrics scanner, standard engineering templates, auto-save to `localStorage`, and print/PDF export styling.
- **Enhanced Company Preparation Center** (`CompanyPreparationSection`): Detailed selection process, salary packages (Ninja, Digital, Prime, DSE, SP, SDE-1), round-by-round breakdown, and top asked technical questions for TCS, Infosys, Cognizant, Amazon, Microsoft, and Google.
- **Worker Pre-compilation Pipeline**: Added `npm run build:worker` via esbuild producing a single production bundle `dist/worker.js` (54KB) that runs in Alpine Node.js runner without runtime `tsx`.
- **Unit Test Suite Expansion**: Added `src/__tests__/security-and-features.test.ts` testing distributed rate limiter sliding window & memory fallback, and raw buffer magic bytes validation (PDF, PNG, JPEG, ZIP).

### Security & Architecture
- **Distributed Rate Limiting (`SEC-01`)**: Atomic Redis `INCR` + `EXPIRE` with automatic sliding-window in-memory fallback and minute-interval eviction sweep.
- **IDOR Elimination (`SEC-02`)**: Scoped notification updates, bookmark deletions, and saved job deletions strictly to `userId == user.id`.
- **Strict Headers (`SEC-03`)**: Configured HSTS (`max-age=63072000; includeSubDomains; preload`) and CSP with trusted YouTube embeds (`https://www.youtube.com`, `https://www.youtube-nocookie.com`).
- **File Upload Magic Bytes (`SEC-04`)**: Added `verifyMagicBytes()` inspecting raw header signatures for PDF (`%PDF-`), PNG, JPEG, and Office OpenXML archives to prevent executable masquerading.
- **SQL Query Push-Down (`DB-01`)**: Migrated `getResources()` and `getOpportunities()` from in-memory JavaScript array filtering to PostgreSQL `where(and(...conds))` relational queries.
- **Mock Test Submission Atomicity (`EXAM-01`)**: Wrapped mock test evaluation, response scoring, and attempt completion inside a database transaction (`db.transaction`).
