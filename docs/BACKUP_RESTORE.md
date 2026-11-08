# Backup & Restore Guide — EngineerPrep India

> [!IMPORTANT]
> Always create a backup before running any database migrations, schema changes, or bulk imports in production.

---

## Table of Contents

1. [PostgreSQL Backup](#1-postgresql-backup)
2. [PostgreSQL Restore](#2-postgresql-restore)
3. [Automated Backup (Cron)](#3-automated-backup-cron)
4. [Redis Backup](#4-redis-backup)
5. [Docker Volume Backup](#5-docker-volume-backup)
6. [Uploaded Files Backup](#6-uploaded-files-backup)
7. [Disaster Recovery](#7-disaster-recovery)
8. [Pre-Migration Checklist](#8-pre-migration-checklist)
9. [Drizzle Migration Rollback](#9-drizzle-migration-rollback)

---

## 1. PostgreSQL Backup

### Full Database Backup (Recommended)

```bash
# Custom format — most flexible, supports parallel restore
pg_dump \
  --host=localhost \
  --port=5432 \
  --username=postgres \
  --dbname=engineerprep_db \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="backup-$(date +%Y%m%d-%H%M%S).dump"

# Plain SQL format — human-readable, good for auditing
pg_dump \
  --host=localhost \
  --port=5432 \
  --username=postgres \
  --dbname=engineerprep_db \
  --format=plain \
  --file="backup-$(date +%Y%m%d-%H%M%S).sql"
```

### Schema-Only Backup (No Data)

```bash
pg_dump \
  --host=localhost \
  --port=5432 \
  --username=postgres \
  --dbname=engineerprep_db \
  --schema-only \
  --format=plain \
  --file="schema-$(date +%Y%m%d).sql"
```

### Data-Only Backup (No Schema)

```bash
pg_dump \
  --host=localhost \
  --port=5432 \
  --username=postgres \
  --dbname=engineerprep_db \
  --data-only \
  --format=custom \
  --file="data-$(date +%Y%m%d-%H%M%S).dump"
```

### Docker Environment

```bash
# Backup from running Docker container
docker compose exec postgres pg_dump \
  -U postgres \
  -d engineerprep_db \
  --format=custom \
  --compress=9 \
  > "backup-$(date +%Y%m%d-%H%M%S).dump"

# Or using pg_dumpall for globals (roles, tablespaces)
docker compose exec postgres pg_dumpall \
  -U postgres \
  > "globals-$(date +%Y%m%d).sql"
```

### Environment Variable Authentication

Avoid password prompts with:

```bash
export PGPASSWORD="your_postgres_password"
# or add to ~/.pgpass:
# hostname:port:database:username:password
# localhost:5432:engineerprep_db:postgres:your_password
```

---

## 2. PostgreSQL Restore

> [!CAUTION]
> Restoring to an existing database will OVERWRITE all data. Create a backup first!

### Restore Custom Format (.dump)

```bash
# Option A: Drop and recreate database first (cleanest)
psql -U postgres -c "DROP DATABASE IF EXISTS engineerprep_db;"
psql -U postgres -c "CREATE DATABASE engineerprep_db;"

pg_restore \
  --host=localhost \
  --port=5432 \
  --username=postgres \
  --dbname=engineerprep_db \
  --verbose \
  --clean \
  --if-exists \
  backup-20261106-120000.dump

# Option B: Restore in parallel (faster for large DBs)
pg_restore \
  --host=localhost \
  --port=5432 \
  --username=postgres \
  --dbname=engineerprep_db \
  --jobs=4 \
  --verbose \
  backup-20261106-120000.dump
```

### Restore Plain SQL (.sql)

```bash
psql \
  --host=localhost \
  --port=5432 \
  --username=postgres \
  --dbname=engineerprep_db \
  --file=backup-20261106.sql
```

### Docker Environment

```bash
# Copy backup file into container then restore
docker cp backup-20261106-120000.dump engineerprep-postgres:/tmp/

docker compose exec postgres pg_restore \
  -U postgres \
  -d engineerprep_db \
  --clean \
  --if-exists \
  /tmp/backup-20261106-120000.dump
```

### Restore to Staging/Test Environment

```bash
# Create a staging database from production backup
createdb -U postgres engineerprep_staging

pg_restore \
  --host=localhost \
  --port=5432 \
  --username=postgres \
  --dbname=engineerprep_staging \
  --verbose \
  backup-production-20261106.dump
```

---

## 3. Automated Backup (Cron)

### Linux/Mac Cron Setup

```bash
# Edit crontab
crontab -e
```

Add these entries:

```cron
# Daily full backup at 2:00 AM — retain 30 days
0 2 * * * /usr/local/bin/engineerprep-backup.sh >> /var/log/engineerprep-backup.log 2>&1

# Weekly schema backup on Sundays at 1:00 AM
0 1 * * 0 pg_dump -U postgres -d engineerprep_db --schema-only > /backups/schema-$(date +\%Y\%m\%d).sql
```

### Backup Script (`/usr/local/bin/engineerprep-backup.sh`)

```bash
#!/bin/bash
set -euo pipefail

# Configuration
BACKUP_DIR="/backups/engineerprep"
DB_NAME="engineerprep_db"
DB_USER="postgres"
RETAIN_DAYS=30
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# Full database backup
PGPASSWORD="$PGPASSWORD" pg_dump \
  --host=localhost \
  --port=5432 \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --format=custom \
  --compress=9 \
  --file="$BACKUP_DIR/backup-$DATE.dump"

echo "[$(date)] Backup completed: backup-$DATE.dump"

# Delete backups older than RETAIN_DAYS
find "$BACKUP_DIR" -name "backup-*.dump" -mtime "+$RETAIN_DAYS" -delete
echo "[$(date)] Cleaned up backups older than $RETAIN_DAYS days"

# Optional: upload to S3
# aws s3 cp "$BACKUP_DIR/backup-$DATE.dump" "s3://your-backup-bucket/db/$DATE.dump"

echo "[$(date)] Done."
```

```bash
chmod +x /usr/local/bin/engineerprep-backup.sh
```

### Docker Compose Cron Service

Add to `docker-compose.yml`:

```yaml
  backup:
    image: postgres:16-alpine
    environment:
      PGPASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - ./backups:/backups
    networks:
      - app-network
    depends_on:
      postgres:
        condition: service_healthy
    command: >
      sh -c "while true; do
        pg_dump -h postgres -U postgres -d engineerprep_db
          --format=custom --compress=9
          > /backups/backup-$$(date +%Y%m%d-%H%M%S).dump
        && echo 'Backup completed'
        && find /backups -name 'backup-*.dump' -mtime +30 -delete;
        sleep 86400;
      done"
```

---

## 4. Redis Backup

Redis persistence is configured via `appendonly yes` in `docker-compose.yml`.

### Manual Redis Backup

```bash
# Trigger an immediate RDB snapshot
redis-cli BGSAVE

# Wait for completion
redis-cli LASTSAVE  # Returns Unix timestamp of last save

# Copy the RDB file
cp /var/lib/redis/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb
```

### Docker Environment

```bash
# Copy RDB file from Docker volume
docker compose exec redis redis-cli BGSAVE
docker compose exec redis redis-cli LASTSAVE

# Copy the dump file out of the container
docker cp engineerprep-redis:/data/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb
```

### Redis Restore

```bash
# Stop Redis
docker compose stop redis

# Replace dump.rdb
docker cp redis-backup-20261106.rdb engineerprep-redis:/data/dump.rdb

# Start Redis
docker compose start redis

# Verify
redis-cli PING  # Should return PONG
redis-cli DBSIZE  # Check key count
```

> [!NOTE]
> BullMQ queues are stored in Redis. After restoring an older Redis backup, any jobs that were added after the backup timestamp will be lost. This is typically acceptable since jobs are either short-lived or can be re-triggered via the admin panel.

---

## 5. Docker Volume Backup

### List Volumes

```bash
docker volume ls | grep engineerprep
# engineerprep-india-platform-development_postgres-data
# engineerprep-india-platform-development_redis-data
# engineerprep-india-platform-development_uploads-data
```

### Backup a Volume

```bash
# PostgreSQL data volume
docker run --rm \
  -v engineerprep-india-platform-development_postgres-data:/data \
  -v $(pwd)/backups:/backups \
  alpine \
  tar czf /backups/postgres-volume-$(date +%Y%m%d).tar.gz -C /data .

# Redis data volume
docker run --rm \
  -v engineerprep-india-platform-development_redis-data:/data \
  -v $(pwd)/backups:/backups \
  alpine \
  tar czf /backups/redis-volume-$(date +%Y%m%d).tar.gz -C /data .

# Uploads volume
docker run --rm \
  -v engineerprep-india-platform-development_uploads-data:/data \
  -v $(pwd)/backups:/backups \
  alpine \
  tar czf /backups/uploads-volume-$(date +%Y%m%d).tar.gz -C /data .
```

### Restore a Volume

```bash
# Stop the application first
docker compose down

# Restore PostgreSQL volume
docker run --rm \
  -v engineerprep-india-platform-development_postgres-data:/data \
  -v $(pwd)/backups:/backups \
  alpine \
  tar xzf /backups/postgres-volume-20261106.tar.gz -C /data

# Start the application
docker compose up -d
```

---

## 6. Uploaded Files Backup

If using **local storage**, uploaded files are in `./uploads/` (or `UPLOAD_DIR`):

```bash
# Compress and backup
tar czf uploads-backup-$(date +%Y%m%d).tar.gz ./uploads/

# Restore
tar xzf uploads-backup-20261106.tar.gz
```

If using **S3-compatible storage**, files are stored remotely. Use the AWS CLI or Rclone:

```bash
# Sync S3 bucket locally
aws s3 sync s3://engineerprep-uploads ./uploads-s3-backup/

# Rclone (supports R2, MinIO, etc.)
rclone sync r2:engineerprep-uploads ./uploads-backup/
```

---

## 7. Disaster Recovery

### Scenario: Database Corruption

```bash
# 1. Stop application
docker compose stop frontend worker

# 2. Assess damage
docker compose exec postgres psql -U postgres -d engineerprep_db -c "\dt"

# 3. Create a backup of the corrupted state (for analysis)
docker compose exec postgres pg_dump -U postgres -d engineerprep_db \
  --format=plain > corrupted-$(date +%Y%m%d).sql

# 4. Drop and recreate
docker compose exec postgres psql -U postgres -c "DROP DATABASE engineerprep_db;"
docker compose exec postgres psql -U postgres -c "CREATE DATABASE engineerprep_db;"

# 5. Restore from latest good backup
docker cp latest-backup.dump engineerprep-postgres:/tmp/
docker compose exec postgres pg_restore \
  -U postgres -d engineerprep_db --verbose /tmp/latest-backup.dump

# 6. Verify data integrity
docker compose exec postgres psql -U postgres -d engineerprep_db \
  -c "SELECT COUNT(*) FROM users;"

# 7. Restart application
docker compose start frontend worker
```

### Scenario: Accidental Data Deletion

```bash
# 1. Identify the last good backup before the deletion
ls -lt ./backups/*.dump | head -5

# 2. Restore to a temporary database
createdb -U postgres engineerprep_recovery

pg_restore -U postgres -d engineerprep_recovery \
  --verbose backups/backup-20261106-020000.dump

# 3. Extract specific records from recovery database
psql -U postgres -d engineerprep_recovery \
  -c "COPY (SELECT * FROM users WHERE id IN (...)) TO '/tmp/recovered-users.csv' CSV HEADER;"

# 4. Import recovered records into production
psql -U postgres -d engineerprep_db \
  -c "\COPY users FROM '/tmp/recovered-users.csv' CSV HEADER ON CONFLICT DO NOTHING;"

# 5. Drop recovery database
dropdb -U postgres engineerprep_recovery
```

### Scenario: Full Server Loss (New Server Deployment)

```bash
# 1. Provision new server with Docker + Docker Compose

# 2. Clone repository
git clone <repo-url> engineerprep-india-platform-development
cd engineerprep-india-platform-development

# 3. Restore .env file (from secure backup/secrets manager)
# Configure: DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, etc.

# 4. Start infrastructure only (no app yet)
docker compose up -d postgres redis

# 5. Wait for healthy
docker compose ps

# 6. Restore database
docker cp backup-latest.dump engineerprep-postgres:/tmp/
docker compose exec postgres pg_restore \
  -U postgres -d engineerprep_db --clean --if-exists --verbose \
  /tmp/backup-latest.dump

# 7. Restore uploaded files
# Local: docker cp uploads.tar.gz engineerprep-frontend:/app/ && tar xzf...
# S3: Configure USE_S3=true and files are already in S3

# 8. Start full application
docker compose up -d

# 9. Verify health
curl http://localhost:3000/api/health
```

---

## 8. Pre-Migration Checklist

Before running any `drizzle-kit push`, `drizzle-kit migrate`, or destructive SQL:

- [ ] **Create a full database backup:**
  ```bash
  pg_dump -U postgres -d engineerprep_db --format=custom \
    > pre-migration-$(date +%Y%m%d-%H%M%S).dump
  ```
- [ ] **Verify backup is readable:**
  ```bash
  pg_restore --list pre-migration-backup.dump | head -20
  ```
- [ ] **Record current table counts:**
  ```sql
  SELECT schemaname, tablename, n_live_tup
  FROM pg_stat_user_tables
  ORDER BY tablename;
  ```
- [ ] **Check for active connections:**
  ```sql
  SELECT count(*) FROM pg_stat_activity WHERE datname = 'engineerprep_db';
  ```
- [ ] **Plan rollback procedure** (see section 9)
- [ ] **Schedule maintenance window** (notify users if needed)
- [ ] **Test migration on staging first** using a restored copy of production data

---

## 9. Drizzle Migration Rollback

### Understanding Drizzle Migrations

Drizzle stores migration history in `drizzle/__drizzle_migrations` table. Each migration is a `.sql` file in `drizzle/migrations/`.

> [!WARNING]
> Drizzle does NOT support automatic rollback. You must write `DOWN` migration SQL manually or restore from backup.

### Option A: Restore from Backup (Safest)

```bash
# If migration caused data loss or corruption, restore from pre-migration backup
pg_restore -U postgres -d engineerprep_db \
  --clean --if-exists --verbose \
  pre-migration-20261106-120000.dump
```

### Option B: Manual Reverse Migration

For additive-only migrations (new columns, new tables — no data loss risk):

```sql
-- Example: Reverse "added column bio to users"
ALTER TABLE users DROP COLUMN IF EXISTS bio;

-- Remove the migration record
DELETE FROM drizzle.__drizzle_migrations
WHERE hash = 'migration-hash-here';
```

### Option C: Create a Rollback Migration File

```bash
# Create a rollback migration
cat > drizzle/migrations/0002_rollback_bio.sql << 'EOF'
-- Rollback: Remove bio column added in migration 0001
ALTER TABLE users DROP COLUMN IF EXISTS bio;
EOF

# Apply it
npm run db:migrate
```

### Safe Migration Workflow

```bash
# 1. Generate migration from schema changes
npm run db:generate
# Creates: drizzle/migrations/0001_description.sql

# 2. Review the generated SQL
cat drizzle/migrations/0001_description.sql

# 3. Create pre-migration backup
pg_dump -U postgres -d engineerprep_db --format=custom \
  > pre-migration-0001.dump

# 4. Apply migration
npm run db:migrate

# 5. Verify application works
npm run dev
# Test all affected features

# 6. If migration fails, restore
pg_restore -U postgres -d engineerprep_db \
  --clean --if-exists pre-migration-0001.dump
```

---

## Backup Retention Policy (Recommended)

| Backup Type | Retention |
|------------|-----------|
| Daily full backup | 30 days |
| Weekly backup | 6 months |
| Monthly backup | 2 years |
| Pre-migration backup | Forever (or until next stable version) |
| Schema-only backup | 1 year |

---

## Monitoring Backup Health

```bash
# Check latest backup age
ls -lt /backups/backup-*.dump | head -1

# Verify backup size is reasonable (too small = problem)
ls -lh /backups/backup-*.dump | tail -5

# Alert if no backup in last 25 hours (add to monitoring)
find /backups -name "backup-*.dump" -mtime -1 | wc -l
# Should return >= 1
```

Add backup health check to your monitoring dashboard (Grafana, Datadog, etc.):

```bash
# Simple Prometheus metric via textfile collector
echo "backup_age_hours $(( ($(date +%s) - $(stat -c %Y /backups/$(ls -t /backups/*.dump | head -1))) / 3600 ))" \
  > /var/lib/node_exporter/textfile_collector/backup.prom
```

