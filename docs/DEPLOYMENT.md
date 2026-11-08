# EngineerPrep India — Deployment Guide

## Quick Start (Local Development)

```bash
# 1. Clone and install
git clone https://github.com/your-org/engineerprep-india.git
cd engineerprep-india
npm install --legacy-peer-deps

# 2. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT secrets, etc.

# 3. Start PostgreSQL & Redis via Docker
docker compose up postgres redis -d

# 4. Run database migrations
npx drizzle-kit push

# 5. Seed development data
npm run db:seed

# 6. Start development server
npm run dev
# → http://localhost:3000
```

---

## Docker Compose (Full Stack)

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f frontend

# Stop services
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v
```

---

## Production Deployment on a VPS

### Prerequisites

- Ubuntu 22.04+ VPS
- Docker Engine + Docker Compose Plugin installed
- Domain name pointing to your VPS IP
- Ports 80 and 443 open in firewall

### Step 1 — Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### Step 2 — Configure Environment

```bash
mkdir -p /opt/engineerprep
cd /opt/engineerprep
nano .env
```

Minimum required production values:
```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@postgres:5432/engineerprep_db
POSTGRES_PASSWORD=STRONG_PASSWORD
REDIS_URL=redis://redis:6379
JWT_ACCESS_SECRET=<64-byte-hex-generated-with-openssl-rand-hex-32>
JWT_REFRESH_SECRET=<different-64-byte-hex>
FRONTEND_URL=https://your-domain.com
SMTP_HOST=smtp.gmail.com
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your-app-password
```

Generate secrets:
```bash
openssl rand -hex 32  # Run twice — one for each JWT secret
```

### Step 3 — Deploy Application

```bash
# Copy docker-compose files
scp docker-compose.yml docker-compose.prod.yml user@your-vps:/opt/engineerprep/

# On the VPS
cd /opt/engineerprep

# Pull and start
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run migrations
docker compose exec frontend npx drizzle-kit push

# Create initial admin (see below)
```

### Step 4 — Create Initial Admin Account

```bash
docker compose exec frontend node -e "
const { db } = require('./src/db');
const { hashPassword } = require('./src/lib/auth');
const { users } = require('./src/db/schema');

async function createAdmin() {
  const hash = await hashPassword(process.env.INITIAL_ADMIN_PASSWORD);
  const [admin] = await db.insert(users).values({
    fullName: 'Platform Admin',
    email: process.env.INITIAL_ADMIN_EMAIL,
    passwordHash: hash,
    role: 'ADMIN',
    emailVerified: true,
  }).returning();
  console.log('Admin created:', admin.email);
}
createAdmin();
"
```

### Step 5 — Nginx Reverse Proxy

Install Nginx:
```bash
sudo apt install nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/engineerprep`:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;

    location /api/v1/auth/ {
        limit_req zone=auth burst=5 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50m;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and obtain SSL:
```bash
sudo ln -s /etc/nginx/sites-available/engineerprep /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## Zero-Downtime Deployment

```bash
# 1. Pull new image / updated code
cd /opt/engineerprep
git pull

# 2. Build new image
docker compose -f docker-compose.yml -f docker-compose.prod.yml build frontend

# 3. Apply database migrations (non-destructive only)
docker compose exec frontend npx drizzle-kit push

# 4. Rolling restart (keeps service up during restart)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps frontend

# 5. Verify health
curl https://your-domain.com/api/health
```

---

## Database Backup & Restore

### Automated Backup (Cron)

```bash
# Add to crontab: crontab -e
0 2 * * * docker exec engineerprep-postgres pg_dump \
  -U postgres engineerprep_db \
  | gzip > /backups/db_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
```

### Manual Backup

```bash
docker exec engineerprep-postgres pg_dump -U postgres engineerprep_db > backup.sql
```

### Restore from Backup

```bash
# CAUTION: This replaces all data
docker exec -i engineerprep-postgres psql -U postgres -d engineerprep_db < backup.sql
```

---

## Rollback Procedure

```bash
# 1. Identify the last working image tag
docker images engineerprep-india

# 2. Update docker-compose.yml to use the previous tag
# image: engineerprep-india:previous-sha

# 3. Restart with previous image
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps frontend

# 4. If database schema changes need reverting, restore from backup
# (never run destructive migrations in production without a backup)
```

---

## Health Check

```bash
curl https://your-domain.com/api/health
# Expected: {"success":true,"data":{"status":"ok","database":"connected",...}}
```

---

## Environment Variable Checklist for Production

| Variable | Required | Description |
|---------|---------|-------------|
| `NODE_ENV` | ✅ | Must be `production` |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | ✅ | 64+ char random hex |
| `JWT_REFRESH_SECRET` | ✅ | 64+ char random hex (different) |
| `REDIS_URL` | ✅ | Redis connection string |
| `FRONTEND_URL` | ✅ | Your public domain |
| `SMTP_HOST` | ✅ | Required for email (password reset) |
| `SMTP_USER` | ✅ | SMTP username |
| `SMTP_PASSWORD` | ✅ | SMTP password / app password |
| `POSTGRES_PASSWORD` | ✅ | PostgreSQL root password |

