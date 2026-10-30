# Meetly Phase 4: Production Security Checklist & Deployment Guide

**Maintained by:** Evolix Studio  
**Target Environment:** Staging & Production  
**Document Revision:** 1.0  
**Effective Date:** October 29, 2026

---

## 1. Pre-Deployment Configuration Checklist

Before launching Meetly in a staging or production environment, the DevOps and Security teams must complete and sign off on each item in this checklist:

### A. Environment Variable Validation
- [ ] **Generate Unique Production `SESSION_SECRET`:**
  ```bash
  openssl rand -hex 32
  # Set SESSION_SECRET=<generated_value> in .env
  ```
  *Requirement: Must be at least 32 characters and distinct from all repository examples.*

- [ ] **Generate Unique Operator `MODERATOR_KEY`:**
  ```bash
  openssl rand -hex 24
  # Set MODERATOR_KEY=<generated_value> in .env
  ```
  *Requirement: Must be at least 24 characters and guarded securely.*

- [ ] **Configure Dedicated Production Database Credentials:**
  ```bash
  openssl rand -base64 24
  # Set DB_PASSWORD and update DATABASE_URL in .env
  ```
  *Requirement: Do NOT use default passwords or placeholder values.*

- [ ] **Restrict CORS to Authoritative Domain(s):**
  ```bash
  CORS_ORIGIN=https://meetly.evolix.studio
  ```
  *Requirement: Wildcard (`*`) is prohibited in production.*

---

### B. Network & Infrastructure Hardening
- [ ] **TLS / HTTPS Termination:**
  * Enforce TLS 1.3 / 1.2 on reverse proxy (Nginx, Traefik, or Cloudflare).
  * Automatically redirect all plain HTTP requests to HTTPS.
  * Enforce HSTS (`Strict-Transport-Security: max-age=31536000; includeSubDomains`).

- [ ] **WebSocket Proxy Configuration:**
  * Ensure reverse proxy supports WebSocket upgrades with proper timeout handling:
    ```nginx
    location /api/chat/live {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
    ```

- [ ] **Database Network Isolation:**
  * Ensure MySQL (port 3306) is NOT exposed to the public Internet.
  * In `docker-compose.yml`, MySQL is exposed only to the internal bridge network `meetly_net`.

- [ ] **TURN Relay Infrastructure (Coturn):**
  * Configure Coturn on a dedicated VPS with a public IPv4/IPv6 address.
  * Open firewall ports: UDP/TCP 3478, TCP 5349, and relay range 49152-49200/udp.
  * Supply matching `TURN_SHARED_SECRET` in both `.env` and `turnserver.conf`.

---

### C. Operator Access & Triage Setup
- [ ] **Verify Moderation CLI Access:**
  ```bash
  MODERATOR_KEY="<your-key>" node scripts/moderation-cli.js stats
  MODERATOR_KEY="<your-key>" node scripts/moderation-cli.js list --priority=high
  ```
- [ ] **Restrict Moderation API Ingress:**
  * In Nginx or Cloudflare, restrict `/api/moderation/*` to trusted VPN IP ranges or internal management subnets.

---

## 2. Release Gate Verification Commands

Execute the following commands on the release candidate build before promoting to production:

```bash
# 1. Verify zero production dependencies with known vulnerabilities
pnpm audit --prod

# 2. Verify static type soundness
pnpm check

# 3. Verify all 64 automated unit, integration, and security regression tests
pnpm test

# 4. Verify clean production compilation
pnpm build

# 5. Verify live 15-step user journey smoke test
pnpm test:smoke
```

All 5 verification gates must return exit code `0`.

---

## 3. Incident Response & Abuse Escalation Protocol

In the event of user-reported safety violations, abusive media, or security incidents:

1. **Immediate Session Termination:**
   * When an abuse report is submitted, Meetly immediately severs the active room connection, unsets video tracks, and records mutual blocks between the participants for 24 hours.
2. **Operator Triage:**
   * Run `node scripts/moderation-cli.js list --priority=high` to inspect unresolved reports.
   * High-priority categories (`underage`, `threats`, `hate`) are surfaced first.
3. **Database Maintenance & Pruning:**
   * Safety reports older than 90 days should be archived or purged in compliance with applicable data retention regulations.
   * Session identifiers stored in the database are one-way SHA-256 digests; raw user IP addresses and chat transcripts are never permanently stored.

