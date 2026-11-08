# Automation Guide — EngineerPrep India

## Overview

The automation system sends notifications, processes background jobs, and maintains platform health using a **Redis + BullMQ** architecture with an independent worker process.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│          Next.js Frontend / API              │
│  ┌────────────────────────────────────────┐  │
│  │  src/lib/automation.ts                 │  │
│  │  - enqueueJob()   → Redis queue        │  │
│  │  - runRule()      → immediate exec     │  │
│  │  - sweepExpired() → cleanup            │  │
│  └────────────────────────────────────────┘  │
└──────────────┬──────────────────────────────┘
               │  BullMQ jobs
               ▼
┌─────────────────────────────────────────────┐
│          Redis (port 6379)                   │
│  Queues: job-alert-queue,                   │
│          vtu-update-queue,                   │
│          deadline-reminder-queue, ...        │
└──────────────┬──────────────────────────────┘
               │  BullMQ workers
               ▼
┌─────────────────────────────────────────────┐
│   src/workers/worker.ts (independent proc)  │
│  Processes each queue with real handlers:   │
│  - Sends in-app notifications               │
│  - Updates streak records                   │
│  - Flushes notification outbox              │
│  - Cleans up expired records                │
└──────────────┬──────────────────────────────┘
               │  Drizzle ORM
               ▼
┌─────────────────────────────────────────────┐
│          PostgreSQL                          │
│  - automation_executions (logs)             │
│  - automation_rules (config)                │
│  - notification_outbox (pending delivery)   │
│  - notifications (delivered)                │
└─────────────────────────────────────────────┘
```

---

## Available Queues

| Queue Name | Purpose | Triggered By |
|-----------|---------|-------------|
| `job-alert-queue` | Notify eligible students of new job/internship postings | Admin creates opportunity |
| `vtu-update-queue` | Notify all students of new VTU announcements | Admin posts VTU update |
| `deadline-reminder-queue` | Remind students 48h before application deadlines | Scheduled daily |
| `learning-reminder-queue` | Daily/weekly learning nudges (requires SMTP) | Scheduled |
| `streak-queue` | Update student activity streak counters | Scheduled daily |
| `weekly-report-queue` | Weekly summary emails (requires SMTP) | Scheduled weekly |
| `notification-queue` | Flush `notification_outbox` → `notifications` table | On demand |
| `email-queue` | SMTP email delivery | From other handlers |
| `cleanup-queue` | Delete old read notifications, expired tokens | Scheduled |
| `bulk-import-queue` | Process confirmed bulk import jobs | After admin confirms import |
| `content-publishing-queue` | Auto-publish scheduled content | Scheduled |

---

## Worker Process

### Starting the Worker

**Development:**
```bash
npm run worker
# or
npx tsx src/workers/worker.ts
```

**Production (Docker Compose):**
The `worker` service is defined in `docker-compose.yml` and starts automatically.

**Production (PM2):**
```bash
pm2 start "npm run worker" --name engineerprep-worker
pm2 save
pm2 startup  # Enable auto-restart on reboot
```

### Worker Configuration

The worker connects to Redis at `REDIS_URL` (default: `redis://localhost:6379`).

Each queue worker runs with:
- **Concurrency:** 5 jobs processed simultaneously
- **Completed jobs retained:** 100 most recent
- **Failed jobs retained:** 50 most recent
- **Graceful shutdown:** Waits for in-flight jobs on SIGTERM/SIGINT

---

## Automation Rules (Database)

Automation rules are stored in the `automation_rules` table and can be managed via the admin API.

### Rule Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | varchar | Human-readable name |
| `key` | varchar | Slug identifier (auto-generated) |
| `description` | text | What this rule does |
| `category` | varchar | Grouping (e.g. `notifications`, `cleanup`) |
| `cron_expression` | varchar | When to run (cron syntax) |
| `queue_name` | varchar | Which BullMQ queue to use |
| `payload` | jsonb | Extra data passed to the job |
| `status` | enum | `ACTIVE` or `DISABLED` |

---

## Admin API for Automation

### List All Rules and Recent Executions

```http
GET /api/v1/admin/automations
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rules": [
      {
        "id": "uuid",
        "name": "Job Alert Sender",
        "key": "job-alert-sender",
        "category": "notifications",
        "queueName": "job-alert-queue",
        "status": "ACTIVE",
        "cronExpression": "0 9 * * *"
      }
    ],
    "executions": [
      {
        "id": "uuid",
        "status": "SUCCESS",
        "triggerSource": "MANUAL",
        "message": "{\"notified\":42}",
        "finishedAt": "2026-11-06T10:00:01Z"
      }
    ]
  }
}
```

---

### Create a New Automation Rule

```http
POST /api/v1/admin/automations
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Daily Deadline Reminder",
  "description": "Remind students of deadlines closing in 48 hours",
  "category": "notifications",
  "cronExpression": "0 8 * * *",
  "queueName": "deadline-reminder-queue",
  "status": "ACTIVE"
}
```

---

### Manually Run an Automation Rule

```http
POST /api/v1/admin/automations/run/{ruleId}
Authorization: Bearer <admin-token>
```

This immediately calls the in-process handler and logs the result to `automation_executions`.

---

### Toggle Rule Status

```http
PUT /api/v1/admin/automations/{ruleId}/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "DISABLED"
}
```

---

### View Execution History

```http
GET /api/v1/admin/executions?limit=60
Authorization: Bearer <admin-token>
```

---

## Enqueueing Jobs Programmatically

From any server-side code:

```typescript
import { enqueueJob } from "@/lib/automation";

// Enqueue a job alert when a new opportunity is created
await enqueueJob("job-alert-queue", {
  opportunityId: newOpportunity.id,
  title: newOpportunity.title,
});

// Enqueue a VTU update notification
await enqueueJob("vtu-update-queue", {
  updateId: vtuUpdate.id,
  title: vtuUpdate.title,
  category: vtuUpdate.category,
});
```

---

## Execution Logs

All job executions are recorded in `automation_executions`:

```sql
SELECT
  ae.id,
  ae.status,
  ae.trigger_source,
  ae.message,
  ae.started_at,
  ae.finished_at,
  ar.name as rule_name
FROM automation_executions ae
LEFT JOIN automation_rules ar ON ae.rule_id = ar.id
ORDER BY ae.created_at DESC
LIMIT 50;
```

**Status values:**
- `QUEUED` — Job added to Redis, not yet processed
- `RUNNING` — Worker is currently processing
- `SUCCESS` — Completed without error
- `FAILED` — Threw an exception
- `SKIPPED` — Rule was disabled or preconditions not met

---

## Idempotency

The notification system prevents duplicate deliveries using `idempotency_key` on the `notification_outbox` table. Each notification is keyed by `{type}-{entityId}-{userId}-{date}`.

If the same notification is enqueued twice, the second insert will fail on the unique constraint and be silently skipped.

---

## Scheduled Automation (Production)

For production cron-based scheduling, use a scheduler like `node-cron` inside the worker, or use a Redis-based BullMQ repeatable job:

```typescript
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL!);
const deadlineQueue = new Queue("deadline-reminder-queue", { connection });

// Run every day at 8:00 AM IST
await deadlineQueue.add(
  "daily-deadline-check",
  {},
  {
    repeat: {
      pattern: "0 8 * * *",
      tz: "Asia/Kolkata",
    },
  },
);
```

Add this to `src/workers/scheduler.ts` and run it once at startup.

---

## Monitoring

**Check queue depths in Redis:**
```bash
redis-cli
> LLEN bull:job-alert-queue:wait
> LLEN bull:deadline-reminder-queue:wait
```

**Check recent failures:**
```sql
SELECT * FROM automation_executions
WHERE status = 'FAILED'
ORDER BY created_at DESC
LIMIT 20;
```

**Check undelivered notifications:**
```sql
SELECT status, COUNT(*) FROM notification_outbox
GROUP BY status;
```

