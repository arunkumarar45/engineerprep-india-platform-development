# Environment Setup Guide — EngineerPrep India

## Prerequisites

| Tool | Minimum Version | Download |
|------|----------------|---------|
| Node.js | 20 LTS | https://nodejs.org |
| npm | 10+ | Included with Node.js |
| PostgreSQL | 16 | https://www.postgresql.org/download/ |
| Redis | 7 | https://redis.io/download (Linux/Mac) / https://github.com/microsoftarchive/redis/releases (Windows) |
| Git | 2.40+ | https://git-scm.com |

---

## Quick Start (Docker — Recommended)

The fastest way to get a full environment running:

```bash
# 1. Clone the repository
git clone <repo-url>
cd engineerprep-india-platform-development

# 2. Create environment file
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET at minimum

# 3. Start all services
docker compose up -d

# 4. Apply database schema
docker compose exec frontend npx drizzle-kit push

# 5. Seed development data
docker compose exec frontend npm run db:seed
```

Access the application at http://localhost:3000

---

## Windows — Manual Setup

### 1. Install Prerequisites

**Node.js:**
```powershell
# Download from https://nodejs.org and run installer
# Verify installation:
node --version   # Should show v20.x.x or v22.x.x
npm --version    # Should show 10+
```

**PostgreSQL:**
```powershell
# Download installer from https://www.postgresql.org/download/windows/
# Default port: 5432
# Remember your postgres password during installation

# Verify:
psql --version
```

**Redis (Windows — via WSL2 or Memurai):**
```powershell
# Option A: Use WSL2 (recommended)
wsl --install
# Inside WSL2:
sudo apt install redis-server
sudo service redis-server start

# Option B: Use Memurai (Windows Redis port)
# Download from https://www.memurai.com

# Verify (from WSL2 or PowerShell with Memurai):
redis-cli ping  # Should return PONG
```

### 2. Create Database

```powershell
# Open PowerShell and connect to PostgreSQL
psql -U postgres
```

```sql
-- Inside psql:
CREATE DATABASE engineerprep_db;
CREATE USER engineerprep WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE engineerprep_db TO engineerprep;
\q
```

### 3. Clone & Install

```powershell
git clone <repo-url>
cd "engineerprep-india-platform-development"

# Install dependencies (use --legacy-peer-deps for compatibility)
npm install --legacy-peer-deps
```

### 4. Configure Environment

```powershell
Copy-Item .env.example .env
notepad .env
```

Edit the `.env` file — see the **Environment Variables Reference** section below.

### 5. Apply Schema & Seed

```powershell
# Push schema to database (dev mode — no migration files needed)
npm run db:push

# Or generate and run migrations:
npm run db:generate
npm run db:migrate

# Seed development data
npm run db:seed
```

### 6. Create First Admin Account

```powershell
# Set in .env or PowerShell session:
$env:INITIAL_ADMIN_EMAIL = "admin@yourplatform.com"
$env:INITIAL_ADMIN_PASSWORD = "SecurePassword123!"
$env:INITIAL_ADMIN_NAME = "Platform Admin"

npm run admin:create
```

### 7. Start Development Server

```powershell
npm run dev
```

Application runs at http://localhost:3000

---

## Linux / macOS — Manual Setup

### 1. Install Prerequisites

```bash
# Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql-16 postgresql-client-16

# PostgreSQL (macOS via Homebrew)
brew install postgresql@16

# Redis (Ubuntu/Debian)
sudo apt install redis-server

# Redis (macOS)
brew install redis
```

### 2. Create Database

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE engineerprep_db;
CREATE USER engineerprep WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE engineerprep_db TO engineerprep;
\q
```

### 3. Clone & Install

```bash
git clone <repo-url>
cd engineerprep-india-platform-development
npm install --legacy-peer-deps
```

### 4. Configure Environment

```bash
cp .env.example .env
nano .env  # or vim .env
```

### 5. Apply Schema & Seed

```bash
npm run db:push
npm run db:seed
```

### 6. Create First Admin

```bash
INITIAL_ADMIN_EMAIL=admin@example.com \
INITIAL_ADMIN_PASSWORD=SecurePass123! \
INITIAL_ADMIN_NAME="Admin User" \
npm run admin:create
```

### 7. Start Development

```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: BullMQ worker (optional — requires Redis)
npm run worker
```

---

## Environment Variables Reference

Copy `.env.example` to `.env` and fill in all values.

### Database

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | `postgresql://engineerprep:pass@localhost:5432/engineerprep_db` | PostgreSQL connection string |

### Authentication

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `JWT_ACCESS_SECRET` | ✅ | `64-char-hex-string` | Secret for signing access tokens. Generate: `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | ✅ | `64-char-hex-string` | Secret for signing refresh tokens. Must differ from access secret |
| `JWT_ACCESS_EXPIRES_IN` | ❌ | `15m` | Access token lifetime (default: 15 minutes) |
| `JWT_REFRESH_EXPIRES_IN` | ❌ | `7d` | Refresh token lifetime (default: 7 days) |

> [!CAUTION]
> Never use weak or guessable JWT secrets in production. Generate cryptographically secure values:
> ```bash
> openssl rand -hex 32
> ```

### Email (Nodemailer)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | ❌ | `smtp.gmail.com` | SMTP server hostname |
| `SMTP_PORT` | ❌ | `587` | SMTP port (587 for TLS, 465 for SSL) |
| `SMTP_SECURE` | ❌ | `false` | Use SSL (`true` for port 465) |
| `SMTP_USER` | ❌ | `noreply@example.com` | SMTP username |
| `SMTP_PASSWORD` | ❌ | `app-password` | SMTP password or app password |
| `EMAIL_FROM` | ❌ | `EngineerPrep <noreply@ep.in>` | From address for outgoing emails |
| `EMAIL_PREVIEW_URL` | ❌ | (auto) | Ethereal.email preview URL (dev only) |

> [!NOTE]
> When SMTP is not configured, the app uses Ethereal.email (a fake SMTP service) in development. All emails are captured and viewable at the URL printed in the console.

### Redis

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | ❌ | `redis://localhost:6379` | Redis connection URL |

### File Storage

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `UPLOAD_DIR` | ❌ | `/app/uploads` | Local upload directory (default: `./uploads`) |
| `USE_S3` | ❌ | `true` | Set `true` to use S3-compatible storage |
| `S3_BUCKET` | Prod | `engineerprep-uploads` | S3 bucket name |
| `S3_REGION` | Prod | `ap-south-1` | AWS region |
| `S3_ENDPOINT` | ❌ | `https://s3.r2.cloudflarestorage.com` | Custom endpoint (MinIO / R2) |
| `S3_ACCESS_KEY_ID` | Prod | `AKIAIOSFODNN7EXAMPLE` | AWS Access Key ID |
| `S3_SECRET_ACCESS_KEY` | Prod | `wJalrXUtnFEMI/K7MDENG` | AWS Secret Access Key |
| `S3_PUBLIC_BASE_URL` | Prod | `https://cdn.example.com` | Public base URL for uploaded files |

### Admin Bootstrap

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `INITIAL_ADMIN_EMAIL` | ❌ | `admin@example.com` | For `npm run admin:create` |
| `INITIAL_ADMIN_PASSWORD` | ❌ | `Secure123!` | Min 12 chars, uppercase+lowercase+digit |
| `INITIAL_ADMIN_NAME` | ❌ | `Platform Admin` | Full name for admin account |

### Application

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ❌ | `development` | `development`, `test`, or `production` |
| `FRONTEND_URL` | ❌ | `https://engineerprep.in` | Used for email links |
| `CORS_ORIGINS` | ❌ | `https://engineerprep.in` | Comma-separated CORS origins |
| `LOG_LEVEL` | ❌ | `info` | `debug`, `info`, `warn`, `error` |
| `NEXT_PUBLIC_API_BASE_URL` | ❌ | `https://api.engineerprep.in` | Frontend API base URL |

---

## Common Commands

```bash
# Development
npm run dev              # Start Next.js dev server (port 3000)
npm run worker           # Start BullMQ background worker

# Testing
npm test                 # Run test suite
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Database
npm run db:push          # Push schema to DB (dev, destructive)
npm run db:generate      # Generate migration files from schema
npm run db:migrate       # Run pending migrations
npm run db:studio        # Open Drizzle Studio (GUI)
npm run db:seed          # Seed development data

# Admin
npm run admin:create     # Create first admin account

# Type checking
npm run typecheck        # Run tsc --noEmit

# Build & Lint
npm run build            # Production build
npm run lint             # ESLint

# Docker
docker compose up -d                    # Start all services
docker compose down                     # Stop all services
docker compose down -v                  # Stop and delete volumes
docker compose logs -f frontend         # Follow frontend logs
docker compose exec frontend sh         # Shell into frontend container
```

---

## Verifying Your Setup

```bash
# 1. Check database connection
npx drizzle-kit check

# 2. Run the test suite
npm test
# Expected: 57 tests pass, 0 failures

# 3. TypeScript check
npm run typecheck
# Expected: 0 errors

# 4. Health check (after starting dev server)
curl http://localhost:3000/api/health
# Expected: {"success":true,"data":{"status":"ok"}}
```

---

## Troubleshooting

### "Cannot connect to PostgreSQL"
- Verify PostgreSQL is running: `pg_ctl status` or `sudo service postgresql status`
- Check `DATABASE_URL` in `.env` has correct host, port, user, password, and database name
- Ensure the database exists: `psql -U postgres -c "\l"`

### "Redis connection refused"
- Start Redis: `sudo service redis-server start` (Linux) or `redis-server` (Mac)
- Worker requires Redis; frontend works without it (uses in-process simulation)

### "Cannot find module 'vite'"
```bash
npm install --save-dev vite --legacy-peer-deps
```

### "Argon2 bindings not found"
```bash
npm install @node-rs/argon2 --legacy-peer-deps
# If prebuild fails, it will fall back to bcryptjs automatically
```

### "JWT secret not set" (production startup fails)
- This is intentional security behavior
- Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `.env`
- These must be at least 32 characters each

### Windows: `&&` not recognized in scripts
- PowerShell uses `;` instead of `&&`
- Use PowerShell natively or install Git Bash for Unix-style commands

