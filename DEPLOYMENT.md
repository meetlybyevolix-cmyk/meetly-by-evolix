# Meetly — Production Deployment Guide

**Product:** Meetly  
**Maintainer:** Evolix Studio

This guide provides step-by-step instructions to deploy Meetly on any standard Linux VPS, cloud compute instance, or container orchestration platform (Docker, Kubernetes, Nomad).

---

## 1. System Requirements

- **Operating System:** Ubuntu 22.04 LTS / Debian 12 / Alpine Linux (or any modern Linux distribution)
- **Node.js:** Node.js v20.x or v22.x LTS (if running bare metal)
- **Package Manager:** `pnpm` v10.x
- **Database:** MySQL 8.0+ or MariaDB 10.5+
- **Reverse Proxy:** Nginx, Caddy, Traefik, or AWS ALB (with WebSocket upgrade support and SSL/TLS termination)
- **Memory:** Minimum 512 MB RAM (1 GB recommended)
- **CPU:** 1 vCPU minimum

---

## 2. Option A: Deployment with Docker (Recommended)

### 2.1 Build the Docker Image

```bash
docker build -t meetly:latest .
```

### 2.2 Run with Docker Compose

Create a `docker-compose.yml`:

```yaml
version: "3.8"

services:
  meetly:
    image: meetly:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=mysql://meetly_user:strongpassword@db:3306/meetly
      - SESSION_SECRET=replace_with_openssl_rand_hex_32
      - CORS_ORIGIN=https://meetly.yourdomain.com
      - STUN_SERVERS=stun:stun.l.google.com:19302
      # - TURN_SERVER_URL=turn:turn.yourdomain.com:3478
      # - TURN_USERNAME=turn_user
      # - TURN_CREDENTIAL=turn_password
    depends_on:
      db:
        condition: service_healthy

  db:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root_secure_password
      MYSQL_DATABASE: meetly
      MYSQL_USER: meetly_user
      MYSQL_PASSWORD: strongpassword
    volumes:
      - db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  db_data:
```

### 2.3 Start Services

```bash
docker compose up -d
```

---

## 3. Option B: Bare-Metal / VPS Deployment

### 3.1 Clone & Install Dependencies

```bash
git clone https://github.com/evolix-studio/meetly.git /var/www/meetly
cd /var/www/meetly

# Enable pnpm
corepack enable
corepack prepare pnpm@10.18.0 --activate

# Install dependencies
pnpm install --frozen-lockfile
```

### 3.2 Configure Environment

```bash
cp .env.example .env
nano .env
```

### 3.3 Apply Database Migrations

```bash
pnpm db:migrate
```

### 3.4 Build Production Bundle

```bash
pnpm build
```

### 3.5 Run with Process Manager (PM2)

```bash
npm install -g pm2
pm2 start dist/index.js --name "meetly" -i 1 --time
pm2 save
pm2 startup
```

> **Note on Process Clustering:** Meetly's live matchmaking queue and room lifecycle are currently single-process in-memory. Run **1 instance** (`-i 1`) per server or cluster with sticky sessions if routing multiple nodes.

---

## 4. Reverse Proxy Configuration (Nginx)

WebSocket upgrades (`Connection: upgrade`, `Upgrade: $http_upgrade`) and HTTPS must be configured on your reverse proxy.

### Nginx Virtual Host Configuration (`/etc/nginx/sites-available/meetly.conf`)

```nginx
server {
    listen 80;
    server_name meetly.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name meetly.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/meetly.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/meetly.yourdomain.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Client Static Assets and Dynamic APIs
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Health Check bypass / fast response
    location = /api/health {
        proxy_pass http://127.0.0.1:3000/api/health;
        access_log off;
    }
}
```

---

## 5. Health Checks & Monitoring

- **Health Check Endpoint:** `GET /api/health` or `GET /healthz`
  - Responds with `200 OK` and `{ status: "ok", service: "Meetly", timestamp: ..., uptime: ... }`
- **ICE Servers Endpoint:** `GET /api/ice-servers`
  - Responds with active STUN/TURN configurations.
- **Graceful Shutdown:** Meetly listens for `SIGTERM` and `SIGINT` signals, closes active WebSockets with status code `1001` (Going Away), stops accepting HTTP requests, and shuts down within 10 seconds.
