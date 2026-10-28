# Meetly MVP — Implementation and Design Plan

## Approved product scope

Implement the approved anonymous random-chat MVP with an adults-only eligibility and consent gate, optional matching preferences, random one-to-one text chat, Next/End controls, reporting and session-level blocking, plus prominent safety/privacy information. The user explicitly authorized a public, opt-in one-to-one video-chat option despite the stated unresolved safeguards. No mandatory email, phone, account, profile, file sharing, audio-only mode, or payments. Normal text messages remain ephemeral; only a submitted safety report and an optional user-selected excerpt may persist. No audio/video is recorded or stored. Legal copy is clearly identified as draft material for review.

The active Node service and relational database are available. Matchmaking and live room state will be process-local and volatile in this version; report records may persist in the managed database. This design is intentionally limited to one running application instance. Video uses browser WebRTC with direct STUN-assisted peer connectivity, no TURN relay, and authenticated in-room WebSocket signaling. Both matched participants must separately opt in, grant their own browser permissions, and see a clear notice before media starts. Direct ICE may disclose a participant's network IP to the other participant and the STUN provider; connections may fail on some networks. The user authorized enabling this in public production while age assurance, staffed media moderation, incident response, relay/privacy review and other launch gates remain unresolved. Keep those limitations explicit; do not imply relay protection, verified ages, staffed moderation, legal compliance or production safety. Do not expose an unprotected moderator console.

## Implementation approach

- Retain the initialized React + TypeScript + Vite client, Express service, tRPC API, Drizzle/MySQL setup and package dependencies. Do not introduce OAuth or persisted user accounts for ordinary chat users.
- Replace the placeholder Home screen with a typed, accessible application flow: landing → eligibility/consent → optional media mode and preferences → searching → active one-to-one text or opt-in video chat. Offer a direct random-match choice without requiring preferences. Match only users selecting the same media mode. Route footer safety/privacy/terms/community links to readable in-app information pages or panels.
- Add a dedicated server module for anonymous session creation, expiring signed session credentials, eligibility acknowledgement, single-instance matchmaking queue, room authorization, ephemeral messages, disconnect/skip/end cleanup, block-pair avoidance where current session signals permit, and conservative per-session throttles. Authenticate and scope WebRTC offer/answer/ICE signaling to the active video room; relay signaling only, never media, and never trust a client-supplied room ID as authorization. Use server-only data structures for live queues, room state and messages; never write routine messages to the database.
- Add a Drizzle report record and server procedure/endpoint for category, optional description, and an explicitly selected bounded excerpt. Explain submitted fields before confirmation. Persist no excerpt unless the reporting user chooses it. Handle report submission errors visibly. Do not create an ordinary-chat archive or public report listing.
- Use a polished communication-tool interface, not a social feed: warm paper/ink neutrals, a distinctive deep-teal action color, rounded restrained controls, clear status chips, an asymmetric editorial hero and compact chat workspace. Provide reduced-motion behavior, visible keyboard focus, semantic labels, keyboard-operable controls, responsive layouts, and readable contrast. No decorative stock imagery or unnecessary motion.
- Keep the moderator console unavailable until a restricted operator authentication model is configured. Provide launch-readiness information instead of pretending that a client-only or unauthenticated dashboard is secure.
- Enable a public opt-in video-call component with a strong STUN/direct-IP warning, explicit readiness controls for both strangers, browser camera/microphone permission only after a user action, camera/mic/end-video controls, and a clear no-recording/no-storage notice. Do not apply a Preview-only or production environment block. Do not configure TURN credentials or present direct connectivity as IP-private.
- Maintain all applicable route declarations in `client/public/manus-routes.json` before starting the development service.

## Project structure

- `client/src/pages/Home.tsx`: main landing, preference, search and chat journeys.
- `client/src/components/VideoCall.tsx`: local/remote video elements, mutual media opt-in, permission acquisition and local media controls.
- `client/src/pages/Policy.tsx` (or equivalent): Privacy, Terms, Community Guidelines and Safety content, explicitly marked drafts.
- `client/src/components/`: reusable consent gate, preference chips, chat composer, report dialog, status/brand elements as appropriate.
- `client/src/index.css`: design tokens, typography, responsive layouts, accessible states and reduced-motion rules.
- `server/routers.ts`: typed public procedures for anonymous session/chat/report operations; no account login requirement.
- `server/chat/` (or equivalent): process-local queue/room lifecycle, session and room authorization, rate limits, ephemeral messages, and authorized WebRTC signaling.
- `drizzle/schema.ts` plus a new migration: narrowly scoped safety-report persistence only; no chat-history table or persistent visitor profile.
- `TODO.md`: feature outcomes and launch dependencies with evidence-based status.

## Design direction

Three alternate directions considered: civic utility signage (0.06), playful zine collage (0.04), and warm editorial minimalism (0.08). Selected: **warm editorial minimalism**, consistent with the PRD's friendly, fast, trustworthy communication-tool direction.

- **Design Movement:** Contemporary editorial minimalism with subtle Scandinavian warmth.
- **Core Principles:** Immediate comprehension; privacy stated plainly; safety controls remain close at hand; calm, accessible interactions.
- **Color Philosophy:** Soft ivory and sand make the interface feel human rather than clinical; dark ink gives legible structure; a distinctive deep teal signals safe, decisive actions without alarm.
- **Layout Paradigm:** An asymmetric landing composition with a clear conversation action on one side and a small product/privacy explainer on the other; compact, spacious chat workspace with conversation content central and persistent safety controls nearby.
- **Signature Elements:** A twin speech-mark brand glyph; small “private by default” status treatment; a slim teal conversation-progress line.
- **Interaction Philosophy:** One primary action per state, immediate exit/skip, explicit consent before entering chat or starting video, no fabricated wait countdowns, explicit report-evidence choice, and a visible warning before direct video.
- **Animation:** Restrained fades and a subtle searching pulse only; respect `prefers-reduced-motion`; no motion that delays exit or obscures connection status.
- **Typography System:** A characterful editorial serif for headline moments paired with a crisp sans-serif for controls and body copy; use resilient system fallbacks, with compact scale and generous line spacing.
- **Brand Essence:** Spontaneous private conversations without account friction; **calm, candid, considerate**.
- **Brand Voice:** Direct, reassuring, never absolute about privacy. Examples: “A conversation can start with one click.” “You’re anonymous to your chat partner—not invisible to the service.”
- **Wordmark & Logo:** Custom twin speech-mark glyph suggesting two people meeting briefly, paired with a compact “Meetly” wordmark; not a default-font-only logo.
- **Signature Brand Color:** Deep conversational teal, used consistently for primary actions and active status.

## Material constraints

The single-server in-memory queue is process-local and clears on restart; it cannot guarantee cross-instance matchmaking, durable block enforcement, or scalable availability. The user explicitly authorized public video while the following risks remain unresolved: STUN-assisted direct WebRTC can reveal peer IP addresses, has no TURN relay and may fail through restrictive NATs; camera/microphone access depends on browser permissions; no media is recorded or persisted; and no media moderation is implemented. Database storage is shared with the published app, so migrations must be additive and persistent report writes treated carefully. A report workflow is a technical intake mechanism, not staffed moderation coverage. Self-attested age is not robust verification. Draft policy text requires qualified review. Public availability does not establish launch readiness, safety, legal compliance or security review.
