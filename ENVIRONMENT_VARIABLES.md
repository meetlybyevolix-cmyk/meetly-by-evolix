# Meetly — Environment Variables Specification

**Product:** Meetly  
**Maintainer:** Evolix Studio

This document details all environment variables recognized by Meetly, their purpose, default values, and operational guidelines.

---

## 1. Core Server Configuration

### `PORT`

- **Description:** Port on which the Express HTTP and WebSocket server listens.
- **Type:** Integer (1–65535)
- **Default:** `3000`
- **Example:** `PORT=8080`

### `NODE_ENV`

- **Description:** Application execution environment. When set to `production`, Vite development middleware is omitted, static pre-built assets from `dist/public` are served, and Strict-Transport-Security (HSTS) headers are enabled.
- **Type:** String (`development` | `production` | `test`)
- **Default:** `development`
- **Example:** `NODE_ENV=production`

---

## 2. Security & Session Management

### `SESSION_SECRET`

- **Description:** Secret key used to sign anonymous session tokens via HMAC-SHA256 (`id.signature`).
- **Type:** String (recommended 32+ characters, or 64-character hex string)
- **Default:** Cryptographically secure 32-byte pseudo-random key generated in-memory on server startup.
- **Production Recommendation:** Explicitly provide a fixed 32-byte random key so client sessions remain valid across process restarts and rolling deployments.
- **Generation:** `openssl rand -hex 32`
- **Example:** `SESSION_SECRET=b71c4c8d76e4c76b92a2a0a2df37b42d7653b6fa3b5b157476e319cb5e478546`

### `CORS_ORIGIN`

- **Description:** Configures allowed origins for cross-origin HTTP requests and WebSocket upgrade validation.
- **Type:** Comma-separated list of origins or wildcard `*`
- **Default:** `*`
- **Example:** `CORS_ORIGIN=https://meetly.evolix.studio,https://staging.meetly.evolix.studio`

---

## 3. Database Persistence

### `DATABASE_URL`

- **Description:** MySQL connection string used by Drizzle ORM to record safety reports (`safety_reports` table).
- **Type:** Connection URL string
- **Default:** `""` (Empty; if omitted, the application operates in ephemeral memory-only mode and safety report submission reports storage unavailable)
- **Format:** `mysql://<username>:<password>@<host>:<port>/<database>`
- **Example:** `DATABASE_URL=mysql://meetly_admin:Str0ngP@ssw0rd!@10.0.0.5:3306/meetly_db`

---

## 4. WebRTC & NAT Traversal Configuration

### `STUN_SERVERS`

- **Description:** Comma-separated list of STUN server URIs used by browsers to discover their public IP and port during WebRTC peer connection setup.
- **Type:** Comma-separated string of `stun:` URIs
- **Default:** `stun:stun.l.google.com:19302`
- **Example:** `STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302`

### `TURN_SERVER_URL`

- **Description:** Comma-separated list of TURN (Traversal Using Relays around NAT) server URIs used when direct peer-to-peer connections cannot be negotiated (e.g. strict firewalls, symmetric NATs).
- **Type:** Comma-separated string of `turn:` or `turns:` URIs
- **Default:** Not configured (direct STUN fallback)
- **Example:** `TURN_SERVER_URL=turn:turn.evolix.studio:3478,turns:turn.evolix.studio:5349`

### `TURN_USERNAME`

- **Description:** Authentication username for the TURN server.
- **Type:** String
- **Default:** `""`
- **Example:** `TURN_USERNAME=meetly_prod_turn`

### `TURN_CREDENTIAL`

- **Description:** Authentication credential/password for the TURN server.
- **Type:** String
- **Default:** `""`
- **Example:** `TURN_CREDENTIAL=SecureTurnPassword123`

---

## 5. Deprecated / Removed Variables

The following legacy variables from Manus AI starter configurations have been completely removed and are **no longer recognized or required**:

- `MANUS_PROJECT_ID`
- `MANUS_JWT_SECRET`
- `MANUS_OAUTH_API_URL`
- `MANUS_OAUTH_PORTAL_URL`
- `MANUS_API_URL`
- `MANUS_API_KEY`
- `MANUS_API_BROWSER_KEY`
- `MANUS_ANALYTICS_ENDPOINT`
- `MANUS_ANALYTICS_WEBSITE_ID`
