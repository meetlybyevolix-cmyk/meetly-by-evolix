# Meetly — Anonymous Real-Time Chat & Video Platform

**Product:** Meetly  
**Developer & Maintainer:** [Evolix Studio](https://evolix.studio)  
**License:** MIT

Meetly is a lightweight, responsive, and privacy-conscious real-time communication platform designed to connect people spontaneously for one-to-one anonymous text conversations and opt-in video calls—without account friction, user profiles, or tracking.

---

## Features

- **No Accounts or Profiles:** Temporary HMAC-signed anonymous sessions without passwords, email, or telephone numbers.
- **Adults-Only Consent Gate:** Clear age-attestation and plain-language Privacy & Terms consent before entering matchmaking.
- **Matchmaking Engine:** Fast, interest-based and language-aware random matchmaking with automatic fallback timeouts.
- **Real-Time Ephemeral Text Chat:** Low-latency WebSocket messaging with anti-spam filters, duplicate detection, and automated PII/link suppression.
- **Opt-In WebRTC Video Calling:** Direct peer-to-peer video conversations requiring mutual opt-in consent from both participants, with local device camera/mic toggles.
- **Configurable STUN/TURN Support:** Native support for custom STUN and TURN relays configured via environment variables to bypass restrictive NATs and firewalls.
- **Safety & Moderation Controls:** Immediate Skip ("Next"), Leave, reciprocal 24-hour block list, and safety reporting with optional bounded message excerpt submission.
- **Responsive & Accessible Design:** Crafted with an editorial aesthetic ("Warm Editorial Minimalism"), full dark/light theme support, and keyboard-operable accessibility.

---

## Technology Stack

### Frontend

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS v4 + Custom Design Tokens
- **Routing:** Wouter
- **Data Fetching:** TanStack React Query v5 & tRPC v11 Client
- **Icons:** Lucide React

### Backend

- **Runtime:** Node.js (v20+ / v22+ LTS)
- **Server Framework:** Express 4
- **API Architecture:** tRPC v11 (Server Adapter)
- **Real-Time Layer:** WebSocket (`ws`) for room events and WebRTC signaling
- **Database ORM:** Drizzle ORM with MySQL2 driver
- **Security:** HMAC-SHA256 session signatures, timing-safe validation, security headers, origin checking

---

## Getting Started

### Prerequisites

- Node.js 20.x or 22.x
- `pnpm` 10.x (or enable via `corepack enable`)
- (Optional) MySQL 8.0+ for safety report storage

### Local Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/evolix-studio/meetly.git
   cd meetly
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   _Edit `.env` to configure your `PORT`, `SESSION_SECRET`, and optional `DATABASE_URL`._

4. **Run database migrations (Optional if using MySQL):**

   ```bash
   pnpm db:migrate
   ```

5. **Start development server:**
   ```bash
   pnpm dev
   ```
   The application will be accessible at `http://localhost:3000`.

---

## Development & Build Commands

| Command           | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `pnpm dev`        | Starts server with Vite development middleware and HMR               |
| `pnpm build`      | Compiles client via Vite and bundles server via esbuild into `dist/` |
| `pnpm start`      | Launches compiled production server (`node dist/index.js`)           |
| `pnpm check`      | Runs TypeScript compiler type checking (`tsc --noEmit`)              |
| `pnpm test`       | Runs the automated test suite with Vitest                            |
| `pnpm format`     | Formats codebase using Prettier                                      |
| `pnpm db:migrate` | Applies checked-in Drizzle database migrations                       |
| `pnpm db:push`    | Generates and pushes database schema changes directly                |

---

## Deployment Instructions

Meetly is packaged with a multi-stage `Dockerfile` and is fully independent of any third-party AI builder or proprietary host.

### Docker Deployment

```bash
# Build production Docker image
docker build -t meetly:latest .

# Run container
docker run -d \
  --name meetly \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e SESSION_SECRET="$(openssl rand -hex 32)" \
  meetly:latest
```

For detailed VPS, systemd, and Nginx reverse-proxy setup, refer to [DEPLOYMENT.md](file:///d:/meetly/DEPLOYMENT.md).

For complete environment variable documentation, see [ENVIRONMENT_VARIABLES.md](file:///d:/meetly/ENVIRONMENT_VARIABLES.md).

---

## Known Architecture Limitations & Safety Notes

1. **Process-Local State:** Matchmaking queues and active room messaging state reside in server process memory. Running multiple container instances currently requires sticky sessions or an external coordination layer (e.g., Redis).
2. **WebRTC Direct IP Exposure:** Direct peer-to-peer WebRTC connections (using STUN) inherently reveal public network IP addresses to matched participants. To prevent direct IP exposure in production, configure a TURN relay server in `.env`.
3. **Self-Attested Age Verification:** Meetly uses an explicit self-attested checkbox for age 18+. Deployers operating in jurisdictions with strict age-assurance mandates (e.g. UK, certain US states) should integrate third-party age verification before broad public marketing.

---

## Legal & Attribution

Meetly was originally scaffolded using Manus AI's open starter templates and has been independently audited, refactored, hardened, and maintained by **Evolix Studio**. MIT License.
