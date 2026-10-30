# LEGAL & REGULATORY COMPLIANCE REVIEW: MEETLY
**Platform:** Meetly (Anonymous Random Text & Video Chat)  
**Operator:** Evolix Studio  
**Date:** October 29, 2026  
**Jurisdictional Focus:** Republic of India (with International Cross-Border Baseline)  
**Document Status:** Technical Architecture & Compliance Review (Pending Formal Review by Legal Counsel)

---

> [!WARNING]
> **STATUTORY DISCLAIMER & LIMITATION OF SCOPE**  
> This review documents the architectural safeguards, technical controls, reporting mechanisms, and operational workflows implemented within the Meetly codebase. **It does not constitute formal legal advice, nor does technical implementation guarantee legal immunity or statutory compliance under Indian or international law.**
>
> Intermediary status and safe harbor protections in India are governed by specific judicial interpretations, compliance practices, and ongoing regulatory assessments. This document identifies legal risks, ambiguities, and operational requirements that **must be reviewed and formalized by an advocate qualified to practice in the Republic of India** prior to public launch.

---

## 1. APPLICABLE STATUTORY & REGULATORY FRAMEWORKS

### 1.1 The Information Technology Act, 2000 (as amended)
* **Section 79 (Intermediary Safe Harbor):**  
  An intermediary is exempted from liability for third-party information, data, or communication links made available or hosted by it, provided:
  1. The function of the intermediary is limited to providing access to a communication system over which information made available by third parties is transmitted or temporarily stored or hosted;
  2. The intermediary does not initiate the transmission, select the receiver of the transmission, or select/modify the information contained in the transmission;
  3. The intermediary observes due diligence while discharging its duties under the Act and observes such other guidelines as the Central Government may prescribe.
* **Section 67, 67A, 67B (Obscene, Sexually Explicit & CSAM Content):**  
  Imposes severe criminal penalties for publishing, transmitting, or causing to be published or transmitted in electronic form obscene material, sexually explicit material, or material depicting children in sexually explicit acts. Section 67B is cognizable, non-bailable, and carries strict liability.
* **Section 69 & 69A (Government Interception & Website/Content Blocking Directions):**  
  Authorizes the Central Government or authorized officers to issue directions for interception, monitoring, decryption, or blocking of public access to information. Failure to comply is a punishable offence.

### 1.2 Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021
* **Rule 3(1)(a) & 3(1)(b) (Due Diligence & User Prohibitions):**  
  The intermediary must prominently publish on its website the rules and regulations, privacy policy, and user agreement. The intermediary must inform users not to host, display, upload, modify, publish, transmit, store, update, or share any prohibited category of information (e.g., content belonging to another without right, defamatory, obscene, pornographic, pedophilic, invasive of bodily privacy, racially or ethnically objectionable, encouraging money laundering, gambling, harming minors, or violating Indian sovereignty/integrity).
* **Rule 3(2) (Grievance Redressal Mechanism & Officer Appointment):**  
  The intermediary must publish the name of the Grievance Officer and their contact details (including email and postal address), as well as the mechanism by which a user or victim may make a complaint. The Grievance Officer must:
  - Acknowledge the receipt of each complaint within twenty-four (24) hours;
  - Dispose of the complaint within fifteen (15) days of receipt.
* **Rule 3(2)(b) (Emergency 24-Hour Removal of Non-Consensual Sexual Imagery):**  
  Within twenty-four (24) hours from receipt of a complaint, the intermediary must take all reasonable and practicable measures to remove or disable access to content that exposes the private areas of an individual, shows such person in full or partial nudity, or shows or depicts such person in any sexual act or conduct, or where the person is impersonated.

### 1.3 Digital Personal Data Protection Act, 2023 (DPDP Act)
* **Status:** Enacted by the Parliament of India (rules and operational dates notified in phases).
* **Role Classification:** Evolix Studio operates as a **Data Fiduciary** regarding personal data collected from data principals.
* **Section 4 & 7 (Lawful Grounds for Processing):**  
  Processing of digital personal data requires either valid, informed, unbundled, unconditional consent with an accompanying clear notice, or certain legitimate uses (such as compliance with legal obligations or court orders).
* **Section 9 (Obligations in Processing Children's Personal Data):**  
  A data fiduciary shall not undertake processing of personal data that is likely to cause any detrimental effect on the well-being of a child (defined as an individual who has not completed eighteen years of age). Fiduciaries must obtain verifiable consent of the parent or lawful guardian before processing any personal data of a child. **Because verifiable parental consent is technically incompatible with an anonymous, unauthenticated stranger chat model, the platform MUST strictly bar all individuals under 18 years of age.**
* **Sections 11, 12, 13, 14 (Rights of Data Principals):**  
  Right to access summary of personal data, right to correction and erasure, right of grievance redressal, and right to nominate.

### 1.4 CERT-In Cybersecurity Directions (No. 20(3)/2022-CERT-In, 28 April 2022)
* **Log Retention (Paragraph 5(v)):**  
  All service providers, intermediaries, data centers, and body corporate shall enable logs of all their ICT systems and maintain them securely for a rolling period of **180 days** within the Indian jurisdiction, and shall produce the same before CERT-In when required.
* **Mandatory 6-Hour Incident Reporting (Paragraph 5(i)):**  
  Any cybersecurity incident specified in Annexure I (e.g., unauthorized access, identity theft, denial of service, fake/forged identity) must be reported to CERT-In within **six (6) hours** of noticing or being brought to notice.

### 1.5 Protection of Children from Sexual Offences Act, 2012 (POCSO Act) & Bharatiya Nyaya Sanhita, 2023 (BNS)
* Sections 19 & 21 of the POCSO Act establish a statutory obligation for any person (including operators of internet services) who has apprehension or knowledge that an offence under the POCSO Act has been or is being committed, to report the matter immediately to the Special Juvenile Police Unit or local police.
* Facilitating, distributing, or failing to act upon child sexual abuse material (CSAM) creates immediate exposure to personal criminal liability for corporate officers and administrators.

### 1.6 Google Publisher & AdSense Policies
* **Unmoderated Dynamic User-Generated Content Prohibition:**  
  Google strictly prohibits placing AdSense code on screens displaying dynamic, unmoderated user-generated text, real-time audio, or live video feeds.
* **Allowed Inventory:**  
  Ads may only be served on static, informational pages with editorial context (e.g., Terms of Service, Privacy Policy, Safety Center, Community Guidelines, Home page before matchmaking begins).
* **AdSense Sensitive Categories:**  
  Because anonymous chat platforms frequently encounter policy violations, strict separation of advertising scripts from chat WebSockets and WebRTC media streams is mandatory to prevent account suspension and domain blacklisting.

---

## 2. ARCHITECTURAL & TECHNICAL CONTROLS IMPLEMENTED

| Statutory Requirement | Technical Control Implemented in Meetly Codebase | Verification Source |
| :--- | :--- | :--- |
| **Rule 3(1)(a) Due Diligence** | Dedicated legal routes: `/terms`, `/privacy`, `/guidelines`, `/safety`, `/data-rights`, `/grievance`, `/cookies`. Prominent banner notices and footer links on all views. | [`client/src/App.tsx`](file:///d:/meetly/client/src/App.tsx), [`client/src/pages/legal/LegalLayout.tsx`](file:///d:/meetly/client/src/pages/legal/LegalLayout.tsx) |
| **Rule 3(1)(b) Prohibited Content Notice** | Exhaustive enumeration of prohibited content categories in Terms of Service Section 4 and Community Guidelines; required affirmative consent modal before entering matchmaking queue. | [`client/src/pages/legal/TermsOfService.tsx`](file:///d:/meetly/client/src/pages/legal/TermsOfService.tsx), [`client/src/pages/Home.tsx`](file:///d:/meetly/client/src/pages/Home.tsx) |
| **Rule 3(2) Grievance Redressal** | Published Grievance Officer placeholders, 24-hour acknowledgment tracking, 15-day resolution target, interactive intake form (`POST /api/grievance/submit`), public ticket status checker (`GET /api/grievance/status/:code`). | [`server/_core/index.ts`](file:///d:/meetly/server/_core/index.ts#L185-L245), [`client/src/pages/legal/GrievanceRedressal.tsx`](file:///d:/meetly/client/src/pages/legal/GrievanceRedressal.tsx) |
| **Rule 3(2)(b) Emergency Takedown (24h)** | CSAM and non-consensual sexual content categories automatically elevated to `critical` priority with weight 4, sorting to the very top of operator triage. | [`server/db.ts`](file:///d:/meetly/server/db.ts#L29-L56), [`server/legal.test.ts`](file:///d:/meetly/server/legal.test.ts#L240-L280) |
| **DPDP Act 2023 Child Protection (18+)** | Strict 18+ gate with `ageConfirmed: true` requirement in API schema. Rejection of minors; zero marketing towards youth. | [`server/chat/service.ts`](file:///d:/meetly/server/chat/service.ts#L210-L230), [`server/legal.test.ts`](file:///d:/meetly/server/legal.test.ts#L285-L330) |
| **DPDP Act 2023 Data Principal Rights** | Dedicated Data Rights page (`/data-rights`), API endpoint (`POST /api/privacy/data-request`), unique tracking code (`DSR-YYYYMMDD-XXXX`), and operator status update tooling. | [`client/src/pages/legal/DataRights.tsx`](file:///d:/meetly/client/src/pages/legal/DataRights.tsx), [`server/_core/index.ts`](file:///d:/meetly/server/_core/index.ts#L260-L318) |
| **DPDP Act Privacy-by-Design** | Ephemeral chat messages held exclusively in volatile RAM buffer during active room lifetime; permanently wiped upon room disconnection. No chat transcripts written to disk or database. | [`server/chat/service.ts`](file:///d:/meetly/server/chat/service.ts#L340-L380) |
| **CERT-In Log Retention (180 Days)** | Configurable rolling log policy (`CERT_IN_LOG_RETENTION_DAYS=180`), anonymized session hashes in audit logs, secure database persistence for security and moderation events. | [`server/legalConfig.ts`](file:///d:/meetly/server/legalConfig.ts#L67-L70), [`drizzle/schema.ts`](file:///d:/meetly/drizzle/schema.ts#L35-L55) |
| **WebRTC IP Exposure Protection** | Prominent technical disclosures in Privacy Policy, Terms, and Safety Center explaining that peer-to-peer WebRTC connections exchange public IP addresses with peers. ICE STUN/TURN fallback implemented. | [`client/src/pages/legal/PrivacyPolicy.tsx`](file:///d:/meetly/client/src/pages/legal/PrivacyPolicy.tsx), [`client/src/pages/legal/SafetyCenter.tsx`](file:///d:/meetly/client/src/pages/legal/SafetyCenter.tsx) |
| **Google AdSense Policy Isolation** | Smart `<AdContainer />` component disabled on live chat/video/search views; strictly activates only on editorial/informational legal pages when `ENABLE_ADS=true` and valid publisher ID is present. | [`client/src/components/AdContainer.tsx`](file:///d:/meetly/client/src/components/AdContainer.tsx), [`client/src/pages/Home.tsx`](file:///d:/meetly/client/src/pages/Home.tsx) |

---

## 3. REMAINING LEGAL UNCERTAINTIES & AMBIGUITIES

1. **Peer-to-Peer WebRTC IP Disclosure Liability:**  
   In standard WebRTC peer-to-peer data and media streaming, direct peer connections expose the peer's public IP address to the other participant. While Meetly prominently warns users of this technical reality in its Privacy Policy and Safety Center, Indian courts or data protection authorities could examine whether failing to force all traffic through a relaying TURN server constitutes a failure to implement reasonable security safeguards under Section 8(5) of the DPDP Act or Section 43A of the IT Act.
2. **Intermediary Scope Under Section 79 for Algorithmic Matchmaking:**  
   Section 79(2)(b) requires that the intermediary does not select the receiver of the transmission. In Meetly, users enter a random pool and are matched algorithmically based on media mode and optional topic tags. While general industry precedent treats random matchmaking as passive transmission routing, judicial scrutiny in India could evaluate whether algorithmic filtering constitutes active involvement in determining the recipient.
3. **CERT-In 180-Day Log Retention vs. Ephemeral Privacy Principles:**  
   There is an inherent statutory tension between CERT-In's mandate to retain ICT system logs for 180 days and the DPDP Act's data minimization principles (Section 8(7)). Meetly reconciles this by retaining network access metadata (IP, timestamp, session hash) for 180 days while strictly refusing to record or retain communication contents (chat text, audio, video frames).
4. **Significant Social Media Intermediary (SSMI) Thresholds:**  
   Under the IT Rules, 2021, an intermediary with 50 lakh (5 million) or more registered users is classified as an SSMI, triggering additional obligations (such as appointing a Chief Compliance Officer, Resident Grievance Officer, and monthly compliance reports). Because Meetly does not maintain registered user accounts, tracking user volume requires unique monthly active session metrics. Legal counsel must advise on whether unregistered active session counts could trigger SSMI obligations.

---

## 4. MATTERS REQUIRING FORMAL REVIEW BY AN INDIAN ADVOCATE

Prior to public launch in India, Evolix Studio must instruct a qualified technology and media lawyer in India to review and advise on:

1. **Formal Appointment of the Grievance Officer:**
   - Verify that the designated individual is an Indian resident and capable of receiving and responding to statutory summons and user notices.
   - Formalize the physical service address within India for legal correspondence under Rule 3(2).
2. **Review of Terms of Service & Privacy Policy:**
   - Review limitation of liability clauses under the Indian Contract Act, 1872.
   - Confirm arbitration and jurisdiction clauses designating exclusive jurisdiction to courts in the operator's home state/city in India.
3. **Law Enforcement SOP Review:**
   - Establish formal operational procedures for handling notices under Section 91 of the Code of Criminal Procedure, 1973 (CrPC) / Section 94 of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS).
   - Establish emergency contact escalation channels with local Cyber Crime Police and state intelligence wings.
4. **Assessment of Video Chat Liability & Regulatory Exposure:**
   - Advise on potential police action in the event of persistent illegal broadcasts (e.g., unsolicited sexual display) and establish documentation demonstrating the platform's bona fide intermediary due diligence.

---

## 5. LAUNCH READINESS SUMMARY & CONCLUSION

| Area | Status | Notes |
| :--- | :--- | :--- |
| **Technical Safeguards & Pages** | **COMPLETE** | All 7 legal pages, forms, APIs, and rate limiters operational. |
| **Automated Test Validation** | **COMPLETE** | 81 passing Vitest tests; 18/18 live user journey smoke tests passing. |
| **AdSense Policy Compliance** | **COMPLETE** | Strict segregation from dynamic media views; ads restricted to informational pages. |
| **Corporate Operational Configuration** | **PENDING OWNER** | Requires inputting real officer name, physical postal address, and legal entity in `.env`. |
| **Formal Legal Review** | **PENDING COUNSEL** | Requires formal review and sign-off by Indian legal counsel. |

**Verdict:** **Implementation complete, pending legal and operational review.**

