# PRE-LAUNCH LEGAL & OPERATIONAL CHECKLIST: MEETLY
**Platform:** Meetly (Anonymous Random Text & Video Chat)  
**Operator:** Evolix Studio  
**Date:** October 29, 2026  
**Status Assessment:** Implementation Complete; Pending Legal & Operational Review

---

## CATEGORY 1: IMPLEMENTED & VERIFIED IN CODEBASE

All items in this section have been fully coded, reviewed, and validated via automated tests (`pnpm check`, `pnpm test`, `pnpm build`, `pnpm test:smoke`).

- [x] **Adults-Only (18+) Guardrail:** Mandatory affirmative age confirmation in API schema (`ageConfirmed: true`); sessions rejected without confirmation.
- [x] **Affirmative Legal Consent Flow:** Required acceptance of Terms of Service and Privacy Policy before matching queue entry.
- [x] **Dedicated Legal Pages (7 Routes):**
  - `/terms` — Terms of Service (13 sections, Rule 3(1)(b) prohibitions, peer-to-peer WebRTC disclaimers, Indian law jurisdiction).
  - `/privacy` — Privacy Policy (Technical data map, DPDP Act 2023 lawful basis, CERT-In 180-day retention, RAM volatility).
  - `/community-guidelines` (alias `/guidelines`) — Zero-tolerance standards (CSAM, non-consensual sexual content, hate speech).
  - `/safety` — Safety Center (Educational guide on IP exposure, screen recordings, reporting, and crisis helpline numbers).
  - `/data-rights` — Data Principal Rights (Interactive submission form calling `POST /api/privacy/data-request`, public status lookup).
  - `/grievance` (alias `/report-abuse`) — Grievance Redressal (Rule 3(2) statutory details, interactive form calling `POST /api/grievance/submit`, public status lookup).
  - `/cookies` — Cookie & Storage Disclosure (Local/session storage disclosures and third-party advertising disclosures).
- [x] **Statutory In-Chat Reporting Categories:** Added all mandatory statutory categories (`csam_child_exploitation`, `non_consensual_sexual_content`, `privacy_violation`, etc.) to both UI and backend schemas.
- [x] **Automated Statutory Priority Classification:** Elevated CSAM and non-consensual sexual content to `critical` priority (weight 4) for immediate operator triage.
- [x] **Grievance Redressal Database & API:** Complete schema and endpoints for `grievanceTickets` with unique tracking codes (`GRV-YYYYMMDD-XXXX`).
- [x] **Data Subject Requests Database & API:** Complete schema and endpoints for `dataSubjectRequests` with unique tracking codes (`DSR-YYYYMMDD-XXXX`).
- [x] **Rate Limiting Protection:** Stricter rate limits on grievance submissions (10 req/min/IP), data requests (10 req/min/IP), and session creation to prevent abuse and denial of service.
- [x] **Google AdSense Policy Segregation:** `<AdContainer />` component remains completely dormant during live chats, video calls, or searches; strictly enabled only on static legal/informational pages when `ENABLE_ADS=true`.
- [x] **Automated Testing Coverage:** 81 passing Vitest tests (security, legal, integration, service) and 18 passing live end-to-end smoke test steps.

---

## CATEGORY 2: IMPLEMENTED AWAITING PRODUCTION ENVIRONMENT VERIFICATION

Items implemented in the software architecture that require verification in the final production hosting environment.

- [ ] **HTTPS / WSS Termination:** Ensure SSL/TLS 1.3 is active on production reverse proxy (e.g., Nginx, Caddy, Cloudflare) so all WebSockets and API traffic are encrypted.
- [ ] **Production MySQL Cluster:** Execute Drizzle database migration (`pnpm db:push`) against the live production MySQL instance.
- [ ] **Secure Session & Moderator Secrets:** Generate 64-character cryptographically random strings for `SESSION_SECRET`, `MODERATOR_KEY`, and `DATABASE_URL` in production `.env`.
- [ ] **TURN Server Deployment (Optional but Recommended):** Deploy a self-hosted Coturn relay server or configure commercial TURN credentials (`TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`) to mask peer IP addresses for users behind strict symmetric NATs.
- [ ] **System Time Synchronization (NTP):** Ensure host server clocks are synchronized with Indian Standard Time (IST) / UTC using NTP to satisfy CERT-In logging requirements.

---

## CATEGORY 3: REQUIRES BUSINESS-OWNER CONFIGURATION

These operational variables must be filled with real business details in the production `.env` file before public deployment.

- [ ] **`LEGAL_OPERATOR_NAME`**: Legal corporate name of the operator (e.g., `Evolix Studio Private Limited`).
- [ ] **`LEGAL_ENTITY_TYPE`**: Registered business entity type under Indian law (e.g., `Private Limited Company`, `Registered LLP`).
- [ ] **`LEGAL_CONTACT_EMAIL`**: Monitored corporate legal inbox (e.g., `legal@meetly.evolix.studio`).
- [ ] **`PRIVACY_CONTACT_EMAIL`**: Monitored privacy officer inbox (e.g., `privacy@meetly.evolix.studio`).
- [ ] **`GRIEVANCE_OFFICER_NAME`**: Name of formally appointed Grievance Officer in India (mandatory under Rule 3(2) IT Rules).
- [ ] **`GRIEVANCE_OFFICER_DESIGNATION`**: Official corporate title (e.g., `Grievance Officer & Legal Counsel`).
- [ ] **`GRIEVANCE_OFFICER_EMAIL`**: Official grievance redressal email (e.g., `grievance@meetly.evolix.studio`).
- [ ] **`GRIEVANCE_POSTAL_ADDRESS`**: Physical operational address in India for service of legal notices.
- [ ] **`ADSENSE_CLIENT_ID`**: Valid Google AdSense publisher ID (if advertising monetization is activated).

---

## CATEGORY 4: REQUIRES FORMAL INDIAN LEGAL COUNSEL REVIEW

Matters that must be formally reviewed and signed off by an advocate enrolled with the Bar Council of India.

- [ ] **Intermediary Safe Harbor Assessment:** Review whether Meetly's algorithmic matchmaking qualifies for full safe harbor protection under Section 79 of the IT Act, 2000.
- [ ] **Limitation of Liability & Indemnity Enforceability:** Review contractual clauses in `/terms` against the Indian Contract Act, 1872 and Consumer Protection Act, 2019.
- [ ] **Emergency Takedown SOP Verification:** Validate internal SOP for responding to notices under Rule 3(2)(b) (24-hour statutory takedown of intimate imagery).
- [ ] **Law Enforcement Summons Protocol:** Approve standard operating procedure for handling Section 91 CrPC / Section 94 BNSS notices from police and intelligence agencies.
- [ ] **Minor Ban Self-Attestation Assessment:** Confirm whether age self-attestation meets judicial standards in India given DPDP Act Section 9 constraints.

---

## CATEGORY 5: MANDATORY PUBLIC LAUNCH BLOCKERS

The platform **MUST NOT BE LAUNCHED TO THE GENERAL PUBLIC** if any of the following items remain unaddressed:

| Blocker ID | Description | Reason for Blocker |
| :--- | :--- | :--- |
| **BLK-01** | Missing Grievance Officer Details | Operating without a designated Grievance Officer and physical address in India is a direct violation of Rule 3(2) of the IT Rules, 2021 and forfeits Section 79 intermediary safe harbor immunity. |
| **BLK-02** | Default / Missing Production Secrets | Deploying with default database credentials or missing session secret compromises user privacy and server security. |
| **BLK-03** | Lack of SSL/HTTPS | Running WebRTC or unencrypted WebSockets over cleartext HTTP exposes user sessions and media negotiation to packet sniffing. |
| **BLK-04** | Absence of 180-Day Log Archive | Failure to configure 180-day ICT system log retention violates the mandatory CERT-In Directions 2022 (carries potential criminal penalties under Section 70B(7) IT Act). |
| **BLK-05** | Unreviewed Ad Placements | Enabling AdSense on dynamic chat or video views triggers immediate Google account ban and domain blacklisting. |

---

**Current Status:** **Implementation complete, pending legal and operational review.**

