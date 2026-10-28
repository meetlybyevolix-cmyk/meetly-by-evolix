# MEETLY — PHASE 3 EXECUTION PLAN
**Project:** Meetly (Random Text & Opt-In Video Chat)  
**Maintained by:** Evolix Studio  
**Target:** Production Readiness, WebRTC Video Hardening, Coturn TURN Deployment, User Safety & Launch Assessment  
**Date:** October 28, 2026

---

## 1. Audit Findings & Gap Analysis

| Subsystem | Current State (End of Phase 2) | Required State (Phase 3) | Priority |
|---|---|---|---|
| **Video UI & Layout** | Split-screen equal video boxes inside text chat flow | Dedicated video stage: large remote video, PiP local preview, controls for mute/cam/next/end/report, status indicator, mobile responsive | **P0** |
| **WebRTC Negotiation** | Basic offer/answer exchange, simple candidate queuing | W3C Perfect Negotiation (glare handling with polite/impolite peers), ICE restart on failure, audio track routing, track disposal | **P0** |
| **TURN Relay Infrastructure** | STUN only (`stun.l.google.com:19302`) | Production Coturn integration, ephemeral time-limited HMAC-SHA1 credential generator in `/api/ice-servers`, `turnserver.conf`, Docker service | **P0** |
| **Separate Match Queues** | Filtered in `startSearching` by `mediaMode` | Strict queue segregation, explicit video permissions prompt flow, queue timeout handling | **P1** |
| **Moderation & Safety** | Basic triage API (`/api/moderation/*`) + CLI | Priority weighting, status transitions, IP rate limiting/ban enforcement, audit trail, clear legal disclosures | **P1** |
| **Reliability & Observability** | Basic `/api/health` | `/api/ready`, structured logging, metrics endpoint (`/api/metrics`), graceful shutdown handling (`SIGTERM`/`SIGINT`) | **P1** |
| **Production Config & Docker** | App + MySQL compose | App + MySQL + Coturn TURN service, production Nginx config, deployment & backup scripts | **P1** |
| **Testing & Verification** | 31 vitest tests, 13 smoke test steps | Enhanced WebRTC unit tests, security regression tests, TURN credential tests, automated video smoke tests | **P0** |
| **Launch Documentation** | Phase 2 Report | Comprehensive `MEETLY_PUBLIC_LAUNCH_REPORT.md` with explicit launch gate verdict | **P0** |

---

## 2. Prioritized Task List

### Task 1: WebRTC Signaling, Perfect Negotiation & Video Calling Overhaul
- Implement W3C Perfect Negotiation in `client/src/components/VideoCall.tsx`:
  - Determine polite vs. impolite peer deterministically using room participants order or session ID ordering.
  - Implement glare handling: polite peer rolls back local description when colliding offer arrives (`makingOffer`, `ignoreOffer`).
  - Implement ICE restart support on connection failure / disconnected states.
  - Add explicit track management: separate audio/video track enabling/disabling, proper audio routing (`remoteAudio` element or video element with audio).
  - Explicit media stream cleanup ensuring browser camera/mic indicators turn off immediately on End, Skip, or Block.
- Enhance UI in `client/src/components/VideoCall.tsx` & `client/src/pages/Home.tsx`:
  - Main remote video area with responsive aspect ratio.
  - Smaller picture-in-picture (PiP) local camera preview with toggleable visibility.
  - Controls bar: Mic Mute/Unmute, Camera On/Off, Next Partner, End Chat, Report, Connection status badge.
  - Explicit camera/mic permission pre-check and error feedback banner.

### Task 2: Coturn Deployment & Ephemeral TURN Credential Generation
- Implement Coturn HMAC-SHA1 ephemeral credential generator in `server/_core/index.ts` / `server/config.ts`:
  - Read `TURN_SHARED_SECRET`, `TURN_SERVERS`, `TURN_CREDENTIAL_TTL`, `TURN_REALM`.
  - Validate requesting session token in `GET /api/ice-servers` (or authenticate active chat sessions).
  - Generate RFC 5766 compliant `username = "${timestamp}:${sessionId}"` and `credential = base64(hmac_sha1(secret, username))`.
  - Provide fallback to public STUN if TURN is unconfigured.
- Configure Coturn:
  - Create `coturn/turnserver.conf` with UDP/TCP/TLS configuration, realm, stale-nonce, and security parameters.
  - Update `docker-compose.yml` to include the `coturn` service with mapped ports (3478 UDP/TCP, 5349 TCP, 49152-49200 UDP).
  - Update `.env.example` with TURN configuration variables.

### Task 3: Moderation, User Safety & Age Assurance Hardening
- Extend Moderation API:
  - Add report prioritization (`high`, `medium`, `low`) based on safety category (e.g. `underage`, `harassment`, `threats`).
  - Add IP-level temporary blocklisting in memory or database to stop flooders.
  - Update `scripts/moderation-cli.js` with filter by priority and action commands.
- Transparent Age-Assurance & Video Safety Disclosures:
  - Ensure all policy and warning banners accurately represent the lack of third-party identity age-verification and unmonitored peer-to-peer video streams.

### Task 4: Reliability, Observability & Graceful Teardown
- Add `/api/ready` readiness probe checking database and memory thresholds.
- Add `/api/metrics` (protected by moderator key or localhost) exposing active sessions, active rooms, queue depth, WebRTC failure counts, and report statistics.
- Implement graceful shutdown handler in `server/_core/index.ts`:
  - Intercept `SIGTERM` / `SIGINT`.
  - Close HTTP and WebSocket servers gracefully.
  - Terminate active rooms with polite disconnect notice.
  - Close database connection pool.

### Task 5: Automated Testing & Verification
- Unit & integration tests in `server/integration.test.ts` and `server/chat/service.test.ts`:
  - Ephemeral TURN credential generation and validation.
  - Polite/impolite negotiation role assignment.
  - Mode-isolated queues (Text vs Video).
  - Metrics and readiness probes.
  - Security regressions (cross-room signaling rejection, rate limiters).
- Update and extend `scripts/e2e-smoke-test.js` to test:
  - Ephemeral ICE credential retrieval.
  - Signaling exchange with offer/answer/candidates.
  - Video-ready synchronization.
  - Metrics endpoint verification.

### Task 6: Release Documentation & Launch Gates Assessment
- Compile `MEETLY_PUBLIC_LAUNCH_REPORT.md` answering all user requirements and evaluating launch gates with empirical data.
