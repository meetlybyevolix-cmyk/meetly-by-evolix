# Meetly — Comprehensive Codebase Audit Report
**Product:** Meetly  
**Developer & Maintainer:** Evolix Studio  
**Audit Date:** October 2026  
**Auditor:** Senior Full-Stack Software Engineer & Software Architect  

---

## 1. Executive Summary

Meetly is an anonymous, real-time random text and opt-in video chat platform originally generated using Manus AI's `web-db-user` starter template. Evolix Studio is taking full independent ownership of the product.

This audit evaluates the codebase to identify all Manus-specific artifacts, vendor lock-in points, architecture flaws, security vulnerabilities, and deployment blockers. The primary goal is to completely decouple Meetly from Manus infrastructure while strictly preserving all existing features, UI design, and responsive user experience.

---

## 2. Current Architecture

### 2.1 Technology Stack
- **Frontend:**
  - React 19.2.1
  - TypeScript 5.9.3
  - Vite 7.3.7 with `@tailwindcss/vite` (Tailwind CSS v4)
  - Wouter 3.7.1 for routing
  - TanStack React Query v5 & tRPC v11 React Client
  - Lucide React icons
  - WebRTC (Browser standard `RTCPeerConnection` & `getUserMedia`)
- **Backend:**
  - Node.js (v20+ / v22+ target)
  - Express 4.21.2
  - tRPC 11.6.0 server adapter
  - WebSocket (`ws` 8.22.0) for real-time chat events & WebRTC signaling
  - Drizzle ORM 0.44.5 with MySQL2 3.15.0
  - Jose for JWT & Node.js `crypto` for HMAC-SHA256 signatures
- **Data Persistence & Volatile State:**
  - Database: MySQL database used for storing `safety_reports` (and inherited template `users` table).
  - Volatile In-Memory Engine: `server/chat/service.ts` coordinates real-time matchmaking queue, ephemeral room message history (up to 120 messages), session rate limits, 24-hour block pairs, and disconnect timers.

### 2.2 Application Routing & User Journey
- `/`: Landing page, consent & age gate (18+), preference selection (interests, language, mode), matchmaking search, active text/video chat, and reporting modal.
- `/privacy`, `/terms`, `/guidelines`, `/safety`: Plain-language policy and draft transparency documentation.
- `/404`: Client-side fallback with robots `noindex`.
- `/api/chat/live`: WebSocket endpoint for session authentication, chat notices, and WebRTC signaling.
- `/api/trpc`: tRPC procedures for anonymous session creation, search, message dispatch, skip/next, room exit, block, and safety report creation.

---

## 3. Existing Features Verified

1. **Anonymous User Sessions:** HMAC-SHA256 signed session tokens (`id.signature`), no account registration or persistent user profile required.
2. **Eligibility & Consent Gate:** Mandatory 18+ confirmation and Terms/Privacy acceptance before session creation.
3. **Preferences & Matchmaking:** 
   - Media mode (Text only vs. Opt-in Video)
   - 10 Interest chips (max 5 selected)
   - 8 Language options + "Any"
   - Matchmaking scoring algorithm prioritizing identical media mode, shared language, and interest overlap, with an 8-second fallback timeout.
4. **Real-time Ephemeral Messaging:**
   - One-to-one text messaging over WebSocket and tRPC.
   - Anti-spam throttles (max 8 messages per 10 seconds).
   - Duplicate message suppression (max 2 repeated in 30s).
   - Privacy filters blocking telephone numbers and email addresses.
   - Security filters blocking external HTTP/HTTPS hyperlinks.
5. **Session & Partner Lifecycle Controls:**
   - Cancel search while in queue.
   - "Next" / Skip partner (cleans up previous room and queues for next match).
   - "End conversation" / Leave room.
   - Disconnect handling with a 45-second reconnect grace period.
6. **Opt-in Peer-to-Peer Video Calling:**
   - Mutual opt-in requirement (both strangers must click "Join video" and grant browser permissions before media starts).
   - Camera and microphone toggle controls.
   - "End video" button returning to text chat without terminating text session.
   - P2P WebRTC connection with WebSocket signaling.
7. **User Blocking & Safety Reporting:**
   - Reciprocal 24-hour block list in memory.
   - Report dialog with 8 predefined categories, optional detail note, and optional bounded 6-message excerpt preview.
   - Reports securely hashed and persisted to `safety_reports` table in MySQL.

---

## 4. Manus Dependencies & Artifacts Identified

The following items are Manus-specific and must be cleaned up or decoupled:

| Category | File / Artifact | Description / Dependency |
|---|---|---|
| **Starter Metadata** | `.manus-starter-init.json` | Manus sandbox provisioning metadata file |
| **Starter Metadata** | `template.json` | References `manus-ai/manus-sandbox` repository |
| **Browser Telemetry** | `client/public/__manus__/debug-collector.js` | 899-line agent telemetry script capturing logs, network calls, and UI events |
| **Vite Plugin** | `vite.config.ts` (`vitePluginManusDebugCollector`) | Middleware sending browser logs to `.manus-logs/` |
| **Vite Whitelist** | `vite.config.ts` (`allowedHosts`) | Hardcoded `.manuspre.computer`, `.manus.computer`, etc. |
| **Vite Public Config** | `vite.config.ts` & `client/index.html` | `/api/platform/config.js` script tag injecting `window.__MANUS_CONFIG__` |
| **Platform Config** | `client/src/platform.d.ts` | Declares `window.__MANUS_CONFIG__` globals |
| **Platform Config** | `server/_core/publicConfig.ts` | Builds `window.__MANUS_CONFIG__` containing Manus project and OAuth URLs |
| **Manus OAuth** | `server/_core/oauth.ts` & `server/_core/sdk.ts` | Endpoints communicating with `webdev.v1.WebDevAuthPublicService` |
| **Manus Env Vars** | `server/_core/env.ts` | `MANUS_PROJECT_ID`, `MANUS_JWT_SECRET`, `MANUS_OAUTH_API_URL`, `MANUS_API_URL`, `MANUS_API_KEY` |
| **Client Auth Hijack** | `client/src/main.tsx` | `redirectToLoginIfUnauthorized` triggers `startLogin()` pointing to Manus OAuth; references `manus-cookie` |
| **Client Auth Helpers** | `client/src/const.ts` (`startLogin`) | Generates Manus OAuth redirect URL |
| **Unused Template Code** | `client/src/components/ManusDialog.tsx` | Unused dialog for Manus login |
| **Unused Template Code** | `client/src/components/AIChatBox.tsx` | Unused AI chatbox template component |
| **Unused Template Code** | `client/src/components/Map.tsx` | Unused Google Maps template component using Manus Maps proxy |
| **Unused Template Code** | `client/src/components/DashboardLayout.tsx` | Unused dashboard shell with Manus OAuth buttons |
| **Unused Template Code** | `client/src/components/DashboardLayoutSkeleton.tsx` | Unused skeleton component |
| **Unused Template Code** | `client/src/pages/ComponentShowcase.tsx` | Unused template component showcase |
| **Unused Server Helpers**| `server/_core/dataApi.ts`, `imageGeneration.ts`, `llm.ts`, `notification.ts`, `storageProxy.ts`, `voiceTranscription.ts` | Unused helper files calling Manus Forge internal microservices |
| **Unused Server Storage**| `server/storage.ts` | Manus S3 presigned URL upload via Forge API |
| **Template Vitest Suite**| `server/platform.test.ts` | Vitest file testing Manus Forge API and OAuth |
| **Backup File** | `vite.config.ts.bak` | Leftover backup file |
| **Unused Packages** | `package.json` | `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@types/google.maps`, `@builder.io/vite-plugin-jsx-loc`, `add` |

---

## 5. Security & Privacy Assessment

1. **WebSocket Origin Validation:**
   - Currently, `server/chat/live.ts` does not check the `Origin` header during WebSocket connection upgrade. This leaves the endpoint vulnerable to Cross-Site WebSocket Hijacking (CSWSH) if malicious websites initiate connections.
   - **Recommendation:** Add origin validation matching configured `CORS_ORIGIN` / host.
2. **CORS & Security Headers:**
   - Express has no Helmet or Content Security Policy (CSP), X-Frame-Options, or Referrer-Policy configured.
   - **Recommendation:** Add security headers (Helmet / CSP) and configurable CORS origins.
3. **WebRTC STUN / TURN Configuration:**
   - `client/src/components/VideoCall.tsx` hardcodes `stun:stun.l.google.com:19302`.
   - Without TURN servers, users on symmetric NATs, cellular networks, or restrictive firewalls fail to connect.
   - Direct STUN reveals public IP addresses between peers.
   - **Recommendation:** Provide an `/api/ice-servers` endpoint configured via environment variables (`STUN_URLS`, `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`) so operators can provide TURN relays without hardcoding secrets in frontend client code.
4. **Session Secret Security:**
   - Session signing key in `server/chat/service.ts` is currently `randomBytes(32)` generated at process start. When the server restarts, all existing session tokens are invalidated instantly. While this fits an ephemeral MVP, using an optional environment variable `SESSION_SECRET` allows graceful restarts or multi-instance clustering in the future.
5. **Error Exposure:**
   - Server errors in `server/_core/index.ts` print raw error stacks. Unhandled rejections must log securely without leaking internal paths to clients.

---

## 6. Technical Debt & Code Organization

1. **Dead Template Code:**
   - Over 1,500 lines of template components and unused server modules clutter the codebase. Removing them will dramatically improve build times, reduce bundle size, and simplify ongoing maintenance.
2. **Unused Dependencies:**
   - AWS SDK, Google Maps types, and builder plugins add unnecessary weight to `node_modules` and lockfiles.
3. **Directory Structure:**
   - `server/_core/` currently mixes essential server bootstrap (`index.ts`, `trpc.ts`, `vite.ts`) with unused Manus API proxies (`llm.ts`, `imageGeneration.ts`, etc.).
   - Standardizing `server/` into clean modules (`server/chat`, `server/db`, `server/routes`, `server/middleware`, `server/config`) makes the system maintainable.

---

## 7. Deployment Blockers

1. **Hardcoded Manus Allowed Hosts:**
   - `vite.config.ts` allowedHosts contains `.manuspre.computer` domains. Deploying behind a custom domain or standard reverse proxy (Nginx, Traefik, Caddy) will cause host header rejections during development/preview.
2. **Startup Crash Without Manus Environment:**
   - `server/_core/env.ts` defaults to reading `MANUS_*` variables.
3. **Telemetry & Script Failures:**
   - The frontend loads `<script src="/api/platform/config.js"></script>` and injects `/__manus__/debug-collector.js`. If removed without updating `index.html` and `vite.config.ts`, the frontend throws 404 console errors.
4. **Client Redirect Loop:**
   - In `client/src/main.tsx`, any unauthorized query or mutation calls `startLogin()`, which attempts to navigate to `undefined/app-auth`.
5. **Missing Standard Environment Documentation:**
   - No `.env.example` exists. Deployers have no reference for required versus optional configuration settings.

---

## 8. Prioritized Implementation Plan

- **Phase 2: Removal of Manus Dependencies**
  - Delete unused Manus files (`.manus-starter-init.json`, `template.json`, `client/public/__manus__`, `client/public/manus-routes.json`, `client/src/components/ManusDialog.tsx`, unused template components, unused server Forge utilities).
  - Remove Manus telemetry plugin and host allowlist from `vite.config.ts`.
  - Remove `publicPlatformScript` and `<script src="/api/platform/config.js">` from `client/index.html`.
  - Clean up `package.json` dependencies (remove `@aws-sdk/*`, `@types/google.maps`, etc.).
  - Remove `vite.config.ts.bak`.

- **Phase 3: Make the Project Independent**
  - Refactor server environment configuration into a clean `server/config.ts` using standard variables (`PORT`, `NODE_ENV`, `DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGIN`, `STUN_URLS`, `TURN_URL`, etc.).
  - Replace `server/_core/env.ts` and `publicConfig.ts` with clean application config.
  - Implement `/api/ice-servers` endpoint to deliver configurable STUN/TURN configurations securely.
  - Update `VideoCall.tsx` to fetch ICE servers dynamically from `/api/ice-servers` with a reliable fallback to public STUN.
  - Clean up `main.tsx` to remove `redirectToLoginIfUnauthorized` and `manus-cookie`.

- **Phase 4 & 5: Feature Preservation, Security & Hardening**
  - Retain all chat, matchmaking, messaging, skip, block, report, and video call functionality.
  - Implement WebSocket origin validation on upgrade in `server/chat/live.ts`.
  - Add Helmet security headers and CORS configuration in Express.
  - Add health check endpoint (`/api/health` and `/healthz`).
  - Add graceful shutdown handling for SIGINT and SIGTERM to close WebSocket connections and HTTP listeners cleanly.

- **Phase 6: Project Structure Cleanliness**
  - Keep `client/`, `server/`, `shared/`, `drizzle/` structured logically.
  - Remove dead tests (`platform.test.ts`, `auth.logout.test.ts`) and create comprehensive Meetly tests covering chat matchmaking, session creation, spam filters, and ICE configuration.

- **Phase 7: Configuration & Deployment Preparation**
  - Create comprehensive `.env.example`.
  - Update `Dockerfile` and `.dockerignore` for efficient, independent multi-stage production builds.
  - Create `DEPLOYMENT.md`, `ENVIRONMENT_VARIABLES.md`, and `SECURITY_REVIEW.md`.

- **Phase 8 & 9: Validation, Testing & Documentation**
  - Execute full test suite, TypeScript type checking, and production build.
  - Update branding and legal notices to Evolix Studio in `README.md`.
  - Produce `FINAL_CLEANUP_REPORT.md`.
