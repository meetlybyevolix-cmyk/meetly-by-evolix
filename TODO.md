# Meetly MVP outcomes

Status is based on delivered evidence, not plan intent. An item remains open until its user-facing outcome exists and its relevant integration is confirmed.

## 1. Anonymous eligibility, session and preference flow — Partial

Implemented: the landing page states 18+, with a consent-only direct-random path, a separate optional-preferences path and a temporary HMAC-signed session API. Self-attested age is not verification; jurisdictional/legal sign-off remains open.

- A new eligible user can use the main chat flow without an email address or phone number; do not show either as a mandatory field.
- Generate an unpredictable temporary session identifier and short-lived authorization; do not create a public profile or conventional user account.
- State the minimum age on the landing page and require eligibility confirmation before chat; explain that self-attestation is not reliable age verification by itself and needs market-specific assessment.
- Require acceptance of applicable draft Terms and Privacy Notice before chat; record consent only as appropriate to the implemented session scope.
- Offer text chat; allow optional multiple interests and a configurable language preference; allow selected interests to be removed; allow a random match without selecting preferences; use broader matching as a fallback.
- Do not request real name, email, phone, social handle, contact list, precise location, or identity documents for the ordinary chat journey.

## 2. One-to-one random text conversation — Partial

Implemented: process-local queue/rooms and authenticated WebSocket delivery. Two-user smoke tests passed for matching, live messages, ending, Next/rematch, stale-send rejection and room isolation; load, reconnection and multi-instance behavior remain unverified and outside the approved first version.

- Eligible available users can be queued and assigned to one private room; prevent one session from occupying multiple active rooms or matching itself.
- Show an honest searching state (“Finding someone to chat with…”), a cancel action, and retry/error feedback; do not show fabricated wait estimates.
- Show a conversation area, accessible message input and Send control, connection status, Next, End Chat, Report and Block controls.
- Deliver text updates without page refresh; validate message length, rate-limit submissions, render untrusted text safely, support standard text/emoji, and do not accept arbitrary HTML, scripts, images, or attachments.
- Avoid uncontrolled duplicate submissions when the user double-clicks Send; keep server-side message limits even when client controls are bypassed.
- Next ends the existing room before starting a new search; End Chat leaves and returns to the start screen; disconnects are communicated clearly; stale participants/messages cannot cross into a new room.
- Do not persist ordinary message history or create public conversation records.
- Current approved architecture is a single running app instance with process-local volatile queue and room state; do not represent it as horizontally scaled or continuously available.
- Apply content-moderation rules to detect prohibited material and abusive behavior; this build has link/contact/spam safeguards, not a general content classifier, and that P0 requirement remains open.

## 3. Safety report and blocking controls — Partial

Implemented: additive report schema/API, explicit excerpt selection, session-level block, and basic spam/contact/link safeguards. A report-write test was intentionally not run because the managed database is shared; restricted moderator access and human review are not configured.

- Report is available during the chat and includes categories for harassment/bullying, sexual or explicit content, suspected minor, threats/violence, spam/scams, hate/abusive language, impersonation, and other safety concern.
- Before report submission, explain which information is submitted; offer optional description and an excerpt only when explicitly selected by the reporting user; bound/validate submitted text; allow the reporter to leave immediately.
- Store only submitted report data and permitted minimal report metadata; never silently turn ordinary conversation into an archive. Report access is not yet part of an authenticated, audited moderation workflow; this remains a critical gap while the service is publicly accessible.
- Block prevents the current participant from reconnecting to the same user to the extent supported by the anonymous session design; explain that anonymous identity means repeat-encounter prevention cannot be guaranteed.
- Automated safety checks and throttles are fallible controls, not substitutes for human review, staffing, or documented escalation.

## 4. Responsive interface and privacy/safety information — Partial

Implemented: responsive styles, keyboard-operable report focus management, consent/report UI, draft policy routes, direct-video/IP disclosures, and disabled injected site/badge analytics. No formal WCAG audit or legal/privacy approval has been completed; infrastructure logs may still exist.

- Work on desktop, laptop, Android and iPhone-sized browsers with readable type, touch-friendly controls, keyboard navigation, accessible labels, visible focus and responsive layouts.
- Keep the interface minimal, friendly and trustworthy, with strong visual hierarchy, a clear Start action, restrained rounded components and simple consistent icons.
- Include product mark, headline/supporting description, start action, anonymous access explanation, safety information, and links to Privacy Policy, Terms and Community Guidelines.
- Explain data collected, what another user can see, what is retained, reporting, no default chat-history storage, and limitations: anonymity to a partner is not complete invisibility to the service/providers, and users cannot be promised that another participant will not record/capture a screen.
- Clearly state text as the default experience and video as an opt-in public feature; do not imply that direct connections provide IP privacy or that public video is safety-reviewed.
- Add a separate public opt-in video mode for one-to-one strangers. Keep text-only available and match video users only with other video users.
- Do not request camera or microphone access until the user explicitly chooses to join video; both matched participants must independently accept and allow browser permissions before any local media is sent.
- Show local and remote video, clear camera/microphone controls and a separate End video control; ending video must not strand the user or silently restart their camera.
- Do not record or store video/audio media. Explain that the signaling service handles connection setup while media travels directly between peers in this prototype.
- Before enabling video, warn that direct STUN-assisted connections may expose a participant’s network IP to their stranger and the STUN provider, and may fail on some networks. Do not claim TURN/relay privacy; no TURN relay is configured.
- The user explicitly authorized public video with the stated limitations despite unresolved relay/privacy review, age assurance, media safety/moderation, operational procedures, and security testing. Preserve conspicuous disclosures; do not claim these gates have been satisfied.
- Enable video choice, session creation, matchmaking and authorized signaling in the published production server as well as Preview; do not retain a Preview-only client or server block.
- Identify Privacy, Terms and Community Guidelines copy as draft material requiring qualified jurisdiction-specific review.

## 5. Abuse controls, restricted operations and release gates — Open

Implemented baseline: per-session message/search/report/video-signaling throttles, a best-effort short-lived server-address throttle for session creation, temporary queue/room cleanup, public video enabled at the user's direction, and a health endpoint. Launch dependencies remain: a restricted moderator identity and audited review workflow; staffing and child-safety/serious-threat procedures; defined retention/deletion; legal/privacy and age-assurance review; security/load testing; monitoring and incident response; privacy-reviewed operational analytics.

- Apply server-side session/message throttles, basic spam/flood controls and validation; remove abandoned users from queue and clean up expired room/session state.
- Add proportionate bot challenge/detection for suspicious behavior; no CAPTCHA or device/browser fingerprinting is implemented in this MVP.
- Meet the proposed (not measured) operating targets only after realistic testing: 99.9% monthly availability; p95 lightweight API response below 300 ms; p95 match below 10 seconds when compatible users are available; p95 message delivery below 500 ms; horizontal matchmaking scale; and WCAG 2.2 AA for core journeys.
- Add privacy-reviewed basic operational analytics and error monitoring without recording conversation content; injected website/badge analytics are disabled, and operational metrics are not yet implemented.
- Do not expose an unrestricted moderator dashboard or an unauthenticated report listing; moderator access must be separately restricted and auditable.
- Reports involving suspected minors, child exploitation, credible threats and other critical cases need documented human escalation and jurisdiction-appropriate procedures. Those procedures and staffed response are not in place; a technical report form alone is not an operational response process.
- Establish report review/decision tooling and staffing; the current database intake row is not a controlled, authenticated or audited moderation workflow.
- Establish a privacy data map, retention/deletion periods, legal-request handling, age-assurance approach, incident response, moderator staffing/coverage, operational monitoring/alerts, and qualified privacy/legal/security reviews. These remain open safety and launch debts while public video is enabled at the user's direction; do not imply that they are complete.
- Test room authorization and unauthorized room access, simultaneous matching, disconnects, repeated skipping, spam, report workflow, mobile usability, load behavior, and security; do not claim the PRD's performance targets as measured results without measurement.
- Public video is enabled at the user's direction despite unresolved privacy, age-assurance, safety/moderation, operational and security gates; TURN/media relay, mutual reveal, persistent profiles, payments and monetization are not implemented. Do not represent public availability as proof those gates are complete.

## 6. Public opt-in video chat — Partial

Implemented: separate video-mode selection/queue, in-room mutual readiness events, bounded authenticated signaling in development and production, IP/STUN warnings, local media controls, and no-media-persistence design. Unit and live WebSocket tests cover queue isolation, single-user consent rejection, signal forwarding and Next cleanup; camera/microphone browser testing was not available here.

- Offer a separate video-chat choice while retaining the existing text-only mode; video matchmaking must not place a video-selected participant into a text-only room.
- Require each participant to press an explicit video opt-in and grant browser camera/microphone permission independently; do not send audio or video until both opt in.
- Provide the local preview, remote video, camera and microphone toggles, and an End video action that stops local media tracks; report, block, Next and End chat remain available.
- Use the authenticated active-room WebSocket only for WebRTC signaling; reject signaling from unauthorized sessions, users not in that room, or rooms not selected for video.
- Do not describe the app’s mutual-consent screen as a technical guarantee against a modified or dishonest client; a remote browser can misrepresent its own UI/permission behavior.
- Do not record or persist call media; retain only temporary in-memory signaling/session state needed to connect.
- Display the STUN/direct-connection IP disclosure before video opt-in; do not promise that stranger-to-stranger IPs are hidden or that calls will connect on every network.
- The user authorized enabling the feature in the public site despite open TURN/relay privacy, age assurance, media moderation, incident response, staffed reporting, legal review and security testing gaps. Preserve explicit warnings and do not claim the open gates are complete.
