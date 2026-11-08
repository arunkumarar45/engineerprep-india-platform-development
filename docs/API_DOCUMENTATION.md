# API Documentation — EngineerPrep India

> **Base URL:** `/api/v1`  
> **Framework:** Next.js 16 App Router (edge-compatible)  
> **Auth:** JWT access token stored in an `HttpOnly` cookie (`ep_access`)  
> **Response envelope:** `{ ok: boolean, message: string, data: object }`

---

## Table of Contents

1. [Authentication Overview](#1-authentication-overview)
2. [Auth API — `/api/v1/auth`](#2-auth-api)
3. [VTU API — `/api/v1/vtu`](#3-vtu-api)
4. [DSA API — `/api/v1/dsa`](#4-dsa-api)
5. [Roadmaps API — `/api/v1/roadmaps`](#5-roadmaps-api)
6. [Mock Tests API — `/api/v1/tests`](#6-mock-tests-api)
7. [Jobs API — `/api/v1/jobs`](#7-jobs-api)
8. [Dashboard API — `/api/v1/dashboard`](#8-dashboard-api)
9. [Notifications API — `/api/v1/notifications`](#9-notifications-api)
10. [Admin API — `/api/v1/admin`](#10-admin-api)
11. [Bulk Import API — `/api/v1/admin/bulk-import`](#11-bulk-import-api)
12. [Uploads API — `/api/v1/uploads`](#12-uploads-api)
13. [Standard Error Codes](#13-standard-error-codes)

---

## 1. Authentication Overview

### Token Strategy

| Token | Lifetime | Transport |
|---|---|---|
| Access JWT | 15 min (configurable) | `HttpOnly` cookie `ep_access` |
| Refresh JWT | 7 days (configurable) | `HttpOnly` cookie `ep_refresh` |

### Auth Levels

| Level | Description |
|---|---|
| `public` | No auth required |
| `student` | Valid access token required (any role) |
| `admin` | Valid access token + `role === ADMIN` |

### Security Features

- **Argon2id** password hashing; legacy bcrypt hashes auto-upgraded on login
- **Refresh token rotation** — old token invalidated on each refresh
- **Reuse detection** — presenting a revoked token revokes all tokens for that user
- **Account enumeration prevention** — `forgot-password` always returns the same response
- **Rate limiting** — 5 login attempts per IP per 15-minute window

---

## 2. Auth API

**Route file:** `src/app/api/v1/auth/[[...slug]]/route.ts`

---

### `POST /api/v1/auth/register`

**Auth:** `public`

Register a new student account. Sends a verification email (if SMTP configured) and immediately creates a session.

**Request body:**

```json
{
  "fullName": "Arjun Sharma",
  "email": "arjun@example.com",
  "phone": "9876543210",
  "password": "SecurePass123",
  "collegeName": "RVCE Bangalore",
  "graduationYear": 2026,
  "acceptTerms": true
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `fullName` | string | ✅ | min 2 chars |
| `email` | string | ✅ | valid email |
| `phone` | string | ❌ | min 8 chars |
| `password` | string | ✅ | min 8 chars, must contain letter + number |
| `collegeName` | string | ✅ | min 2 chars |
| `graduationYear` | number | ❌ | integer 2020–2035 |
| `acceptTerms` | boolean | ✅ | must be `true` |

**Response `201`:**

```json
{
  "ok": true,
  "message": "Account created successfully. Please check your email to verify your account.",
  "data": {
    "user": { "id": "uuid", "email": "arjun@example.com", "role": "STUDENT" },
    "strength": 3,
    "emailDelivery": "sent"
  }
}
```

**Errors:** `409` email already exists, `400` validation error

---

### `POST /api/v1/auth/login`

**Auth:** `public` · Rate limited: 5/15min per IP

**Request body:**

```json
{
  "email": "arjun@example.com",
  "password": "SecurePass123",
  "remember": false
}
```

| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |
| `password` | string | ✅ |
| `remember` | boolean | ❌ |

**Response `200`:**

```json
{
  "ok": true,
  "message": "Logged in successfully",
  "data": {
    "user": { "id": "uuid", "email": "...", "fullName": "...", "role": "STUDENT" }
  }
}
```

Sets `ep_access` and `ep_refresh` HttpOnly cookies.

**Errors:** `401` invalid credentials, `403` account deactivated, `429` rate limited

---

### `POST /api/v1/auth/logout`

**Auth:** `student`

Revokes the current refresh token and clears auth cookies.

**Response `200`:**

```json
{ "ok": true, "message": "Logged out successfully", "data": { "loggedOut": true } }
```

---

### `POST /api/v1/auth/refresh`

**Auth:** `public` (refresh token in cookie)

Rotates the refresh token and issues a new access token.

**Response `200`:**

```json
{
  "ok": true,
  "message": "Session refreshed",
  "data": { "user": { ... } }
}
```

**Errors:** `401` missing or invalid refresh token

---

### `POST /api/v1/auth/forgot-password`

**Auth:** `public` · Rate limited

Sends a password reset email. Always returns the same response to prevent user enumeration.

**Request body:**

```json
{ "email": "arjun@example.com" }
```

**Response `200`:**

```json
{
  "ok": true,
  "message": "Password reset instructions sent",
  "data": {
    "message": "If an account exists for this email, password reset instructions have been sent."
  }
}
```

---

### `POST /api/v1/auth/reset-password`

**Auth:** `public`

Resets the user's password using a token from the reset email. Revokes all existing sessions.

**Request body:**

```json
{
  "token": "opaque-token-from-email",
  "password": "NewSecurePass456"
}
```

**Response `200`:**

```json
{ "ok": true, "message": "Password reset successfully...", "data": { "email": "arjun@example.com" } }
```

**Errors:** `400` invalid/expired token, `404` account not found

---

### `POST /api/v1/auth/verify-email`

**Auth:** `public`

Marks the user's email as verified. Sends a system notification.

**Request body:**

```json
{ "token": "opaque-token-from-email" }
```

**Response `200`:**

```json
{ "ok": true, "message": "Email verified successfully", "data": { "verified": true } }
```

---

### `GET /api/v1/auth`

**Auth:** `student`

Returns the currently authenticated user.

**Response `200`:**

```json
{
  "ok": true,
  "message": "Current user fetched",
  "data": { "user": { "id": "uuid", "email": "...", "role": "STUDENT", ... } }
}
```

---

## 3. VTU API

**Route file:** `src/app/api/v1/vtu/[[...slug]]/route.ts`

---

### `GET /api/v1/vtu`

**Auth:** `public`

Returns the latest VTU updates/announcements.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "updates": [
      {
        "id": "uuid",
        "title": "VTU Dec 2026 Exam Schedule",
        "category": "Exam",
        "summary": "...",
        "publishedAt": "2026-11-01T00:00:00Z",
        "fileUrl": "https://..."
      }
    ]
  }
}
```

---

### `GET /api/v1/vtu/meta`

**Auth:** `public`

Returns reference metadata: branches, semesters, schemes, subjects.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "branches": [ { "id": "uuid", "code": "CS", "name": "Computer Science" } ],
    "semesters": [ { "id": "uuid", "number": 4, "label": "4th Semester" } ],
    "schemes": [ { "id": "uuid", "name": "2021" } ],
    "subjects": [ { "id": "uuid", "name": "Data Structures", "code": "21CS41" } ]
  }
}
```

---

### `POST /api/v1/vtu/updates`

**Auth:** `admin`

Publishes a new VTU update and queues in-app notifications for all students.

**Request body:**

```json
{
  "title": "VTU Dec 2026 Timetable",
  "category": "Exam",
  "summary": "Winter semester examination timetable released.",
  "fileUrl": "https://vtu.ac.in/timetable.pdf",
  "fileSize": "240 KB"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `title` | string | ✅ | min 4 chars |
| `category` | string | ✅ | min 2 chars |
| `summary` | string | ❌ | — |
| `fileUrl` | string | ❌ | — |
| `fileSize` | string | ❌ | — |

**Response `201`:**

```json
{ "ok": true, "data": { "update": { "id": "uuid", ... } } }
```

---

### `DELETE /api/v1/vtu/updates/:id`

**Auth:** `admin`

Deletes a VTU update by ID.

**Response `200`:**

```json
{ "ok": true, "data": { "id": "uuid" } }
```

---

## 4. DSA API

**Route file:** `src/app/api/v1/dsa/[[...slug]]/route.ts`

---

### `GET /api/v1/dsa/sheets`

**Auth:** `public`

Lists all DSA sheets.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "sheets": [
      { "id": "uuid", "title": "Striver's A2Z", "totalProblems": 455, "difficulty": "BEGINNER" }
    ]
  }
}
```

---

### `GET /api/v1/dsa/sheets/:id`

**Auth:** `public`

Returns a sheet with its problems. Accepts optional `?difficulty=EASY|MEDIUM|HARD|ALL`.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "sheet": { "id": "uuid", "title": "..." },
    "problems": [ { "id": "uuid", "title": "Two Sum", "difficulty": "EASY", "slug": "two-sum" } ]
  }
}
```

---

### `GET /api/v1/dsa/patterns`

**Auth:** `public`

Lists all DSA patterns.

---

### `GET /api/v1/dsa/patterns/:id`

**Auth:** `public`

Returns a single pattern with templates and usage guide.

---

### `GET /api/v1/dsa/problems`

**Auth:** `public`

Lists problems. Accepts `?difficulty=ALL|EASY|MEDIUM|HARD`.

---

### `GET /api/v1/dsa/problems/:slug`

**Auth:** `public`

Returns a single problem by slug (includes examples, hints, editorial, solutions).

---

### `POST /api/v1/dsa/progress`

**Auth:** `student`

Marks or unmarks a problem as solved.

**Request body:**

```json
{
  "problemId": "uuid",
  "sheetId": "uuid",
  "completed": true
}
```

| Field | Type | Required |
|---|---|---|
| `problemId` | UUID | ✅ |
| `sheetId` | UUID | ❌ |
| `completed` | boolean | ❌ (default `true`) |

**Response `200/201`:**

```json
{ "ok": true, "data": { "completed": true } }
```

---

## 5. Roadmaps API

**Route file:** `src/app/api/v1/roadmaps/[[...slug]]/route.ts`

---

### `GET /api/v1/roadmaps`

**Auth:** `public`

Lists roadmaps. Optional `?category=Web Dev|DevOps|All`.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "roadmaps": [
      { "id": "uuid", "title": "Full Stack Web Dev", "category": "Web Dev", "difficulty": "BEGINNER" }
    ]
  }
}
```

---

### `GET /api/v1/roadmaps/detail/:id`

**Auth:** `public`

Returns a full roadmap with all stages and topics.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "title": "...",
    "stages": [
      {
        "id": "uuid",
        "title": "Foundation",
        "topics": [ { "id": "uuid", "title": "HTML Basics", "estimatedMinutes": 60 } ]
      }
    ]
  }
}
```

---

### `POST /api/v1/roadmaps/progress`

**Auth:** `student`

Marks or unmarks a roadmap topic as completed.

**Request body:**

```json
{
  "roadmapId": "uuid",
  "topicId": "uuid",
  "completed": true
}
```

**Response `200/201`:**

```json
{ "ok": true, "data": { "completed": true } }
```

---

## 6. Mock Tests API

**Route file:** `src/app/api/v1/tests/[[...slug]]/route.ts`

---

### `GET /api/v1/tests`

**Auth:** `public`

Lists all published mock tests.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "tests": [
      { "id": "uuid", "title": "Data Structures Mock 1", "subject": "DSA", "durationMinutes": 60 }
    ]
  }
}
```

---

### `GET /api/v1/tests/detail/:id`

**Auth:** `public`

Returns test metadata and questions (without revealing correct answers).

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "test": { "id": "uuid", "title": "...", "durationMinutes": 60 },
    "questions": [
      {
        "id": "uuid",
        "text": "What is the time complexity of binary search?",
        "marks": 2,
        "options": [
          { "id": "uuid", "label": "A", "text": "O(n)" },
          { "id": "uuid", "label": "B", "text": "O(log n)" }
        ]
      }
    ]
  }
}
```

---

### `GET /api/v1/tests/history`

**Auth:** `student`

Returns the authenticated user's test attempt history.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "attempts": [
      { "id": "uuid", "testId": "uuid", "score": 80, "percentage": "80.00", "status": "SUBMITTED" }
    ]
  }
}
```

---

### `GET /api/v1/tests/attempt/:id`

**Auth:** `student`

Returns full attempt details. If `status !== IN_PROGRESS`, correct answers are revealed.

---

### `POST /api/v1/tests/attempt`

**Auth:** `student`

Starts a new test attempt, or resumes an existing `IN_PROGRESS` one.

**Request body:**

```json
{ "testId": "uuid" }
```

**Response `201`:**

```json
{
  "ok": true,
  "data": {
    "attempt": { "id": "uuid", "status": "IN_PROGRESS", "expiresAt": "2026-11-06T21:00:00Z" },
    "test": { "id": "uuid", "title": "...", "durationMinutes": 60 },
    "questions": [ ... ],
    "responses": []
  }
}
```

---

### `POST /api/v1/tests/submit/:attemptId`

**Auth:** `student`

Submits the attempt, scores it (with negative marking), and stores topic performance.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "attempt": { "id": "uuid", "score": 76, "correctCount": 40, "incorrectCount": 2, "percentage": "76.00" },
    "topicPerformance": { "Arrays": { "total": 10, "correct": 8, "incorrect": 1 } }
  }
}
```

---

### `PATCH /api/v1/tests/attempt/:attemptId`

**Auth:** `student`

Saves a single question response during the test.

**Request body:**

```json
{
  "questionId": "uuid",
  "optionId": "uuid",
  "markedForReview": false
}
```

**Response `200`:**

```json
{ "ok": true, "data": { "saved": true } }
```

**Errors:** `409` attempt already submitted or time expired

---

## 7. Jobs API

**Route file:** `src/app/api/v1/jobs/[[...slug]]/route.ts`

---

### `GET /api/v1/jobs`

**Auth:** `public`

Lists opportunities with filtering and pagination.

**Query parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `q` | string | — | Search term |
| `type` | string | — | `JOB`, `INTERNSHIP`, `OFF_CAMPUS` |
| `branch` | string | — | Branch code |
| `batch` | string | — | Graduation year |
| `location` | string | — | City |
| `mode` | string | — | `ONSITE`, `REMOTE`, `HYBRID` |
| `page` | number | `1` | Page number |
| `pageSize` | number | `6` | Max `60` |

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "opportunities": [
      {
        "id": "uuid",
        "title": "SDE Intern",
        "opportunityType": "INTERNSHIP",
        "location": "Bangalore",
        "stipend": 25000,
        "applicationDeadline": "2026-12-01T00:00:00Z"
      }
    ],
    "meta": { "page": 1, "pageSize": 6, "total": 42, "totalPages": 7 }
  }
}
```

---

### `GET /api/v1/jobs/saved`

**Auth:** `student`

Returns the student's saved/bookmarked opportunities.

---

### `POST /api/v1/jobs/save/:id`

**Auth:** `student`

Toggles the saved state for an opportunity. If already saved, removes it.

**Response `200`:**

```json
{ "ok": true, "data": { "saved": true } }
```

---

### `POST /api/v1/jobs/apply/:id`

**Auth:** `student`

Submits an application for an opportunity. One application per student per opportunity.

**Request body:**

```json
{
  "fullName": "Arjun Sharma",
  "email": "arjun@example.com",
  "phone": "9876543210",
  "college": "RVCE Bangalore",
  "branch": "CSE",
  "graduationYear": 2026,
  "resumeUrl": "https://...",
  "portfolioUrl": "https://github.com/arjun",
  "notes": "Excited about this opportunity!"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `fullName` | string | ✅ | min 2 chars |
| `email` | string | ✅ | valid email |
| `phone` | string | ✅ | min 8 chars |
| `college` | string | ✅ | min 2 chars |
| `branch` | string | ✅ | min 1 char |
| `graduationYear` | number | ✅ | 2020–2035 |
| `resumeUrl` | string | ❌ | — |
| `portfolioUrl` | string | ❌ | — |
| `notes` | string | ❌ | — |

**Response `201`:**

```json
{
  "ok": true,
  "message": "Application submitted (demo mode — no employer integration)",
  "data": { "application": { "id": "uuid", "status": "APPLIED" }, "demoMode": true }
}
```

**Errors:** `409` already applied, `404` opportunity not found

---

### `PUT /api/v1/jobs/:action/:id`

**Auth:** `admin`

Updates an opportunity's fields.

**Request body:** Partial `opportunitySchema` fields.

---

### `DELETE /api/v1/jobs/:action/:id`

**Auth:** `admin`

Deletes an opportunity.

---

## 8. Dashboard API

**Route file:** `src/app/api/v1/dashboard/route.ts`

---

### `GET /api/v1/dashboard`

**Auth:** `student`

Returns aggregated dashboard summary for the authenticated user.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "user": { "id": "uuid", "fullName": "Arjun Sharma", "role": "STUDENT" },
    "dsaCount": 42,
    "dsaTotal": 455,
    "roadmapProgress": 12,
    "testsTaken": 5,
    "avgScore": 74.6,
    "streak": { "currentStreak": 7, "longestStreak": 21 },
    "recentActivity": [ ... ],
    "openOpportunities": 18,
    "unreadNotifications": 3
  }
}
```

---

## 9. Notifications API

**Route file:** `src/app/api/v1/notifications/[[...slug]]/route.ts`

---

### `GET /api/v1/notifications`

**Auth:** `student`

Returns the student's notifications with unread count.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "notifications": [
      { "id": "uuid", "type": "JOB_ALERT", "title": "New job posted", "isRead": false }
    ],
    "unread": 3
  }
}
```

---

### `GET /api/v1/notifications/preferences`

**Auth:** `student`

Returns the user's notification preference settings.

---

### `POST /api/v1/notifications/preferences`

**Auth:** `student`

Upserts notification preferences for the authenticated user.

**Request body** (all fields optional):

```json
{
  "vtuUpdates": true,
  "jobAlerts": false,
  "dsaReminders": true,
  "emailNotifications": false,
  "timezone": "Asia/Kolkata",
  "reminderTime": "19:00",
  "digestFrequency": "WEEKLY"
}
```

| Field | Type | Options |
|---|---|---|
| `vtuUpdates` | boolean | — |
| `jobAlerts` | boolean | — |
| `internshipAlerts` | boolean | — |
| `applicationUpdates` | boolean | — |
| `deadlineReminders` | boolean | — |
| `dsaReminders` | boolean | — |
| `roadmapReminders` | boolean | — |
| `mockTestReminders` | boolean | — |
| `weeklyReports` | boolean | — |
| `emailNotifications` | boolean | — |
| `inAppNotifications` | boolean | — |
| `timezone` | string | IANA timezone |
| `reminderTime` | string | `HH:MM` format |
| `quietHoursStart` | string | `HH:MM` |
| `quietHoursEnd` | string | `HH:MM` |
| `digestFrequency` | string | `DAILY`, `WEEKLY`, `MONTHLY`, `OFF` |

---

### `POST /api/v1/notifications`

**Auth:** `student`

Marks notifications as read.

**Request body — mark single:**

```json
{ "id": "uuid" }
```

**Request body — mark all:**

```json
{ "action": "read-all" }
```

**Response `200`:**

```json
{ "ok": true, "data": { "unread": 0 } }
```

---

## 10. Admin API

**Route file:** `src/app/api/v1/admin/[[...slug]]/route.ts`

> All admin endpoints require `role === ADMIN`. Sensitive mutations are written to `audit_logs`.

---

### `GET /api/v1/admin/stats`

Returns platform-wide statistics.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "totalStudents": 1240,
    "totalResources": 380,
    "totalOpportunities": 56,
    "totalDsaProblems": 455,
    "totalRoadmaps": 12,
    "totalTests": 24
  }
}
```

---

### `GET /api/v1/admin/students`

Returns all student accounts.

---

### `GET /api/v1/admin/content`

Returns resources, tests, opportunities, and roadmaps for admin overview.

---

### `GET /api/v1/admin/automations`

Returns all automation rules and the last 30 executions.

---

### `GET /api/v1/admin/executions?limit=60`

Returns automation execution logs (max 200).

---

### `GET /api/v1/admin/imports`

Returns the last 100 import job records.

---

### `GET /api/v1/admin/audit-logs`

Returns the last 100 audit log entries.

---

### `GET /api/v1/admin/export?kind=resources|opportunities|students|dsa-problems`

Downloads a CSV export. Returns `Content-Type: text/csv`.

| `kind` | Columns |
|---|---|
| `resources` | title, type, status, downloadCount, fileSize, subjectName, subjectCode, createdAt |
| `opportunities` | title, type, status, location, workMode, graduationBatch, applicationDeadline, companyName, postedAt |
| `students` | fullName, email, collegeName, graduationYear, isActive, emailVerified, createdAt |
| `dsa-problems` | title, slug, difficulty, practiceUrl, sheetTitle, orderIndex |

---

### `POST /api/v1/admin/automations`

Creates a new automation rule.

**Request body:**

```json
{
  "name": "Daily Job Alert",
  "description": "Sends job alerts to all eligible students every morning",
  "category": "Notifications",
  "cronExpression": "0 9 * * *",
  "queueName": "job-alert-queue",
  "status": "ACTIVE"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | ✅ | min 3 chars |
| `category` | string | ✅ | min 2 chars |
| `queueName` | string | ✅ | min 2 chars |
| `cronExpression` | string | ❌ | standard cron |
| `status` | string | ❌ | `ACTIVE` \| `DISABLED` |

**Response `201`:**

```json
{ "ok": true, "data": { "rule": { "id": "uuid", "key": "daily-job-alert", ... } } }
```

---

### `POST /api/v1/admin/automations/run/:ruleId`

Manually triggers an automation rule immediately.

**Response `200`:**

```json
{
  "ok": true,
  "data": {
    "executionId": "uuid",
    "queue": "job-alert-queue",
    "status": "SUCCESS",
    "result": { "matched": 240, "channel": "IN_APP" }
  }
}
```

---

### `POST /api/v1/admin/sweep`

Sweeps expired opportunities (deadline passed) and marks them `EXPIRED`.

---

### `POST /api/v1/admin/resources`

Creates a new VTU resource.

**Request body:**

```json
{
  "title": "21CS41 Module 3 Notes",
  "resourceType": "NOTES",
  "subjectId": "uuid",
  "moduleNumber": 3,
  "fileName": "module3-notes.pdf",
  "fileUrl": "https://...",
  "fileSize": "1.2 MB",
  "status": "PUBLISHED"
}
```

---

### `POST /api/v1/admin/opportunities`

Creates a new job/internship opportunity.

**Request body:**

```json
{
  "title": "Software Engineer Intern",
  "opportunityType": "INTERNSHIP",
  "companyId": "uuid",
  "location": "Bangalore",
  "workMode": "HYBRID",
  "stipend": 30000,
  "duration": "6 months",
  "applicationDeadline": "2026-12-15T23:59:59Z",
  "graduationBatch": 2027
}
```

---

### `POST /api/v1/admin/mock-tests`

Creates a new mock test.

**Request body:**

```json
{
  "title": "DSA Mock Test 3",
  "subject": "Data Structures & Algorithms",
  "difficulty": "MEDIUM",
  "durationMinutes": 90,
  "totalMarks": 100,
  "isPublished": false
}
```

---

### `PUT /api/v1/admin/automations/:id/status`

Toggles an automation rule on or off.

**Request body:**

```json
{ "status": "DISABLED" }
```

---

### `PUT /api/v1/admin/students/:id`

Updates a student's account (activate/deactivate or promote to admin).

**Request body:**

```json
{ "isActive": false, "role": "STUDENT" }
```

---

### `PUT /api/v1/admin/resources/:id`

Partially updates a resource.

---

### `PUT /api/v1/admin/opportunities/:id`

Partially updates an opportunity.

---

### `DELETE /api/v1/admin/resources/:id`

Deletes a resource.

---

### `DELETE /api/v1/admin/opportunities/:id`

Deletes an opportunity.

---

### `DELETE /api/v1/admin/vtu-updates/:id`

Deletes a VTU update.

---

### `DELETE /api/v1/admin/mock-tests/:id`

Deletes a mock test and all its questions.

---

## 11. Bulk Import API

**Route file:** `src/app/api/v1/admin/bulk-import/route.ts`

**Auth:** `admin` for all endpoints.

### Workflow

```
1. POST (action=validate) → parse file, validate rows, return importId
2. POST (action=confirm, importId=...) → insert valid rows into DB
```

### Supported Categories

| Category | Required Columns | Optional Columns |
|---|---|---|
| `DSA Problems` | `title`, `difficulty`, `pattern` | `statement`, `practiceUrl`, `sheet`, `slug` |
| `Roadmaps` | `title`, `category`, `stage`, `topic` | `description`, `estimatedDuration`, `difficulty`, `resourceUrl`, `estimatedMinutes` |
| `Jobs/Internships` | `title`, `company`, `type`, `location` | `stipend`, `salaryMin`, `salaryMax`, `batch`, `skills`, `deadline`, `mode`, `description`, `applicationUrl` |
| `Aptitude` | `question`, `optionA`, `correct` | `optionB`, `optionC`, `optionD`, `topic`, `explanation`, `testTitle`, `marks` |
| `Technical` | `question`, `answer`, `topic` | `optionA`, `optionB`, `optionC`, `optionD`, `explanation`, `testTitle`, `marks` |
| `VTU Updates` | `title`, `category` | `summary`, `fileUrl` |

### Supported File Formats

- **CSV** — standard comma-separated, with header row
- **JSON** — array of objects, or `{ "rows": [...] }`
- **XLSX** — requires `xlsx` package installed separately

**Max file size:** 50 MB

---

### `GET /api/v1/admin/bulk-import`

Returns import history and column definitions.

---

### `POST /api/v1/admin/bulk-import` — Validate

**Content-Type:** `multipart/form-data`

| Form field | Type | Required | Description |
|---|---|---|---|
| `file` | File | ✅ | CSV/JSON/XLSX file |
| `category` | string | ✅ | Import category |
| `action` | string | ❌ | `validate` (default) |

**Response `200`:**

```json
{
  "ok": true,
  "message": "File validated successfully. Confirm to import.",
  "data": {
    "importId": "uuid",
    "fileName": "dsa-problems.csv",
    "totalRows": 100,
    "validRows": 97,
    "invalidRows": 3,
    "preview": [ { "title": "Two Sum", "difficulty": "EASY", "pattern": "Arrays" } ],
    "errors": [ { "row": 45, "field": "difficulty", "message": "Difficulty must be EASY, MEDIUM or HARD" } ]
  }
}
```

---

### `POST /api/v1/admin/bulk-import` — Confirm

| Form field | Type | Required |
|---|---|---|
| `action` | string | ✅ (`confirm`) |
| `importId` | string | ✅ |

**Response `200`:**

```json
{
  "ok": true,
  "message": "Import completed. 97 records inserted.",
  "data": { "importedRows": 97, "skippedRows": 3 }
}
```

**Errors:** `404` import not found, `409` already processed, `400` not validated

---

## 12. Uploads API

**Route file:** `src/app/api/v1/uploads/route.ts`

---

### `POST /api/v1/uploads`

**Auth:** `student`

Uploads a file. Saves locally or to S3 depending on `USE_S3` env variable.

**Content-Type:** `multipart/form-data`

| Form field | Type | Required | Description |
|---|---|---|---|
| `file` | File | ✅ | File to upload |
| `category` | string | ❌ | Storage category folder (default `misc`) |

**Allowed MIME types:**

- `application/pdf`
- `text/csv`
- `application/vnd.ms-excel` / `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `application/json`
- `image/png`, `image/jpeg`, `image/webp`
- `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**Max size:** 50 MB

**Response `201`:**

```json
{
  "ok": true,
  "message": "File uploaded successfully",
  "data": {
    "originalName": "resume.pdf",
    "storedPath": "/uploads/misc/uuid.pdf",
    "publicUrl": "/api/v1/files/misc/uuid.pdf",
    "size": 204800,
    "mimeType": "application/pdf",
    "category": "misc",
    "storage": "local",
    "uploadedBy": "uuid"
  }
}
```

**Errors:** `400` missing file / empty file, `413` file too large, `415` unsupported type

---

### `GET /api/v1/uploads?path=category/filename`

**Auth:** `student`

Serves a locally stored file with proper `Content-Type` and security headers.

**Security headers set:**
- `X-Content-Type-Options: nosniff`
- `Cache-Control: private, max-age=3600`
- `Content-Disposition: inline; filename="..."`

---

## 13. Standard Error Codes

| HTTP Status | Meaning |
|---|---|
| `400` | Bad request / validation error |
| `401` | Unauthenticated (missing or expired token) |
| `403` | Forbidden (authenticated but not authorized) |
| `404` | Resource not found |
| `409` | Conflict (duplicate record, already applied, etc.) |
| `413` | Payload too large (file size exceeded) |
| `415` | Unsupported media type |
| `429` | Too many requests (rate limited) |
| `500` | Internal server error |

**Standard error envelope:**

```json
{
  "ok": false,
  "message": "Human-readable error message",
  "error": "Optional technical detail"
}
```
