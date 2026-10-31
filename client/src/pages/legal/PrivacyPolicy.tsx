import React from "react";
import { LegalLayout } from "./LegalLayout";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy & Data Processing Notice"
      subtitle="Detailed, transparent disclosure of how Meetly processes technical data, maintains anonymous communication, and safeguards your privacy under India's Digital Personal Data Protection Act, 2023."
      badge="Data Protection & Privacy Notice"
      effectiveDate="October 29, 2026"
    >
      <div className="legal-prose" style={{ lineHeight: "1.7", color: "var(--ink)" }}>
        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            1. Introduction & Data Fiduciary Details
          </h2>
          <p>
            This Privacy Policy explains how <strong>Evolix Studio</strong> (the <strong>"Data Fiduciary"</strong>, <strong>"Operator"</strong>, <strong>"we"</strong>, or <strong>"us"</strong>) processes information in connection with your anonymous use of <strong>Meetly</strong>.
          </p>
          <p>
            We adhere to the core principles of <strong>Privacy by Design</strong> and <strong>Data Minimization</strong>. We do not require registration, usernames, email addresses, phone numbers, or social logins. However, operating a secure, abuse-resistant web platform and complying with statutory cybersecurity mandates requires the processing of certain technical network metadata.
          </p>
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", padding: "14px 18px", borderRadius: "8px", fontSize: "13px", margin: "14px 0" }}>
            <div><strong>Data Protection Officer / Privacy Contact:</strong> <code>privacy@meetly.evolix.studio</code></div>
            <div><strong>Governing Law:</strong> Digital Personal Data Protection Act, 2023 (DPDP) & Information Technology Act, 2000 (India)</div>
            <div><strong>Data Subject Rights Portal:</strong> <Link href="/data-rights" style={{ color: "var(--teal)", fontWeight: 600 }}>Exercise Data Rights</Link></div>
          </div>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            2. What Data We Process (Accurate Technical Data Map)
          </h2>
          <p>
            We distinguish clearly between data processed in temporary memory and records that are securely retained:
          </p>

          <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "16px 0 8px 0" }}>A. Ephemeral Session & Matchmaking Data (Volatile Memory Only)</h3>
          <ul>
            <li><strong>Temporary Session Identifiers:</strong> A cryptographically generated token (HMAC-SHA256) is issued when you confirm your age and accept our terms. It is stored exclusively in your browser's temporary <code>sessionStorage</code> and destroyed upon closing the browser tab or ending the session.</li>
            <li><strong>Matching Preferences:</strong> Optional interests (e.g., Gaming, Music) and language preferences selected for pairing. These preferences are held in memory during the matchmaking search and discarded when the conversation ends.</li>
            <li><strong>Ordinary Chat Messages:</strong> Text messages exchanged during an active chat exist solely in volatile application memory to relay between the two participants. <strong>Ordinary chat messages are never recorded in a database or stored on disk.</strong> When either participant ends the call or skips, the room memory buffer is erased immediately.</li>
          </ul>

          <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "16px 0 8px 0" }}>B. Security Logs & Technical Connection Data (Statutory Retention)</h3>
          <ul>
            <li><strong>IP Addresses & Network Headers:</strong> Your public IP address, user-agent string, and HTTP/WebSocket request timestamps are processed by our reverse proxy and server to prevent denial-of-service (DoS) attacks, enforce sliding-window rate limits, and detect automated bots.</li>
            <li><strong>CERT-In 180-Day Log Mandate:</strong> Under Direction 20(3) / Direction (v) issued by the Indian Computer Emergency Response Team (CERT-In) under Section 70B of the <em>Information Technology Act, 2000</em>, intermediaries and service providers are legally obligated to securely maintain ICT system logs for a rolling period of <strong>180 days within the Indian jurisdiction</strong>. These logs are isolated, access-restricted, and processed strictly for cybersecurity defense and legal compliance.</li>
          </ul>

          <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "16px 0 8px 0" }}>C. User Safety Abuse Reports (Restricted Evidence)</h3>
          <ul>
            <li>When you submit an abuse report, our system stores:
              <ol style={{ paddingLeft: "20px", marginTop: "6px" }}>
                <li>A unique report ID and timestamp;</li>
                <li>The violation category selected (e.g. Harassment, Suspected Minor, CSAM);</li>
                <li>One-way SHA-256 cryptographic hashes of the reporter and reported session identifiers (the raw session token is never stored in the database);</li>
                <li>Your optional written description and optional user-selected message excerpt (capped at 1,000 characters).</li>
              </ol>
            </li>
            <li>Abuse reports are stored in an encrypted MySQL database, accessible only to authenticated operators for triage and law-enforcement compliance.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            3. WebRTC Video Chat: What Another Person & Third Parties Can See
          </h2>
          <p>
            Video calling on Meetly is strictly opt-in and operates over <strong>WebRTC (Web Real-Time Communication)</strong>:
          </p>
          <ul>
            <li><strong>Local Preview:</strong> Your camera and microphone remain strictly local on your device until both you and your matched partner explicitly grant browser permissions and click to join video.</li>
            <li><strong>Direct Peer-to-Peer Transmission:</strong> Video and audio streams flow directly between your browser and the stranger's browser using DTLS-SRTP encryption. <strong>Meetly does not record, intercept, view, or store raw video or audio packets.</strong></li>
            <li><strong>IP Address Disclosure Warning:</strong> In standard WebRTC, browsers exchange network candidates via STUN (Session Traversal Utilities for NAT). Tech-savvy participants inspecting browser network internals can discover your public IP address. If this is a concern, we recommend using text mode or connecting through a trusted virtual private network (VPN).</li>
            <li><strong>External Screen Recording:</strong> Meetly cannot technically prevent another participant from taking screenshots, filming their screen with another device, or using recording software. Never show intimate, sensitive, or identifying content to strangers.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            4. Google Authentication & Administrative Google Sheets Registration
          </h2>
          <p>
            To prevent automated bot abuse, enforce community safety, and ensure compliance with the <em>Digital Personal Data Protection Act, 2023 (DPDP)</em>, users authenticate with their Google account via official <strong>Google Identity Services</strong> prior to entering stranger matchmaking:
          </p>
          <ul>
            <li><strong>Purpose of Collection:</strong> Google authentication enables verified user registration, account continuity, abuse prevention, and administrative registry audit records for statutory compliance and platform safety.</li>
            <li><strong>Information Collected & Verified:</strong> When you sign in with Google, our backend cryptographically verifies the token issued by Google and securely captures your stable Google account subject identifier (<code>sub</code>), customer name from your verified Google profile, and email address. We never trust unverified client claims.</li>
            <li><strong>Chat Anonymity & Pseudonymous Guarantee:</strong> Your real Google identity, customer name, and email address are <strong>strictly isolated</strong> on our server. <strong>Strangers in text chat or video chat can NEVER see your real name, email, or Google profile details.</strong> Chat partners interact only as anonymous participants.</li>
            <li><strong>Administrative Google Sheets Synchronization:</strong> To enable administrative oversight without granting direct production database access, user registrations are synchronized to the platform owner's private Google Sheet via an authenticated webhook or dedicated Google Service Account. The Sheet records only: <code>Internal User ID</code>, <code>Customer Name</code>, <code>Email</code>, <code>Registration Date</code>, <code>Last Login</code>, <code>Registration Status</code>, <code>Total Visits</code>, and <code>Login Method</code>. No passwords, private keys, or chat messages are ever stored in the spreadsheet. OWASP-standard formula injection sanitization is strictly enforced on all spreadsheet inputs.</li>
            <li><strong>Age-Assurance Notice:</strong> Google account authentication is combined with mandatory explicit age confirmation (18+ Adults Only checkbox) under Section 9 of the DPDP Act 2023 before any matchmaking commences. Minors are strictly prohibited from using stranger matchmaking.</li>
            <li><strong>Account & Data Erasure (DPDP Act Chapter III):</strong> You may exercise your statutory right to complete account erasure at any time via our <Link href="/data-rights" style={{ color: "var(--teal)", fontWeight: 600 }}>Data Rights Portal</Link>. Authorized deletion immediately anonymizes your profile in the database and updates your record in the owner's Google Sheet to <em>Deleted</em> with your name redacted.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            5. Lawful Grounds for Processing (DPDP Act, 2023)
          </h2>
          <p>
            Under Section 4 and Section 7 of the <em>Digital Personal Data Protection Act, 2023</em> (India), we process digital data under the following lawful grounds:
          </p>
          <ul>
            <li><strong>Consent (Section 6):</strong> When you click "I Agree" to the Terms of Service and Privacy Notice, you consent to the processing of your temporary preferences for connecting with partners.</li>
            <li><strong>Compliance with Law (Section 7(b)):</strong> Processing and retaining technical logs to comply with CERT-In directions under Section 70B of the IT Act, 2000, and court orders or notices issued under Indian law.</li>
            <li><strong>Responding to Cybersecurity Incidents & Fraud (Section 7(c)):</strong> Processing network identifiers to mitigate DDoS attacks, prevent automated bot swarms, and enforce rate limits.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            6. Cookies & Local Browser Storage
          </h2>
          <p>
            Meetly uses minimal client-side storage technologies:
          </p>
          <ul>
            <li><code>sessionStorage</code>: Stores the ephemeral <code>meetly-session</code> token and consent flag. Scoped strictly to the active tab and deleted when the tab closes.</li>
            <li><code>localStorage</code>: Stores your UI color theme preference (<code>theme: "light" | "dark"</code>). Contains zero personal or tracking data.</li>
            <li><code>meetly_session</code> (Cookie): Secure HTTP-only, SameSite=None cookie used exclusively for authenticated Google sessions. Contains a cryptographically signed HMAC token verifying your account.</li>
            <li><strong>Advertising Cookies (Google AdSense):</strong> If advertising is enabled on informational pages, Google and its advertising partners may use cookies (such as the DoubleClick cookie) to serve ads based on your prior visits to this or other websites. Detailed opt-out instructions and cookie management are described in our <Link href="/cookies" style={{ color: "var(--teal)" }}>Cookie & Ad Disclosure</Link>.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            7. Data Retention & Deletion Schedule
          </h2>
          <div style={{ overflowX: "auto", margin: "16px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "var(--mint)", borderBottom: "2px solid var(--line)", textAlign: "left" }}>
                  <th style={{ padding: "10px" }}>Category of Data</th>
                  <th style={{ padding: "10px" }}>Storage Location</th>
                  <th style={{ padding: "10px" }}>Retention Duration</th>
                  <th style={{ padding: "10px" }}>Legal / Technical Justification</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px" }}>Ordinary Chat Messages</td>
                  <td style={{ padding: "10px" }}>Volatile Server RAM</td>
                  <td style={{ padding: "10px" }}><strong>0 days (immediate deletion upon room exit)</strong></td>
                  <td style={{ padding: "10px" }}>Privacy-by-Design; no chat logs saved.</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px" }}>Google Account Registration</td>
                  <td style={{ padding: "10px" }}>MySQL & Private Google Sheet</td>
                  <td style={{ padding: "10px" }}>Until user requests erasure</td>
                  <td style={{ padding: "10px" }}>Consent & administrative account continuity.</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px" }}>Temporary Session Token</td>
                  <td style={{ padding: "10px" }}>RAM & Browser <code>sessionStorage</code></td>
                  <td style={{ padding: "10px" }}>Max 3 hours (or tab close)</td>
                  <td style={{ padding: "10px" }}>Session management and reconnect grace period.</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px" }}>Abuse Safety Reports</td>
                  <td style={{ padding: "10px" }}>Encrypted MySQL Database</td>
                  <td style={{ padding: "10px" }}>90 days rolling</td>
                  <td style={{ padding: "10px" }}>Review of abuse, operator triage, legal preservation.</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px" }}>ICT System & Security Logs</td>
                  <td style={{ padding: "10px" }}>Secure Server Log Storage</td>
                  <td style={{ padding: "10px" }}><strong>180 days rolling</strong></td>
                  <td style={{ padding: "10px" }}>Mandatory under CERT-In Directions 2022 (Section 70B IT Act).</td>
                </tr>
                <tr>
                  <td style={{ padding: "10px" }}>Grievance Complaints</td>
                  <td style={{ padding: "10px" }}>Encrypted MySQL Database</td>
                  <td style={{ padding: "10px" }}>1 year following resolution</td>
                  <td style={{ padding: "10px" }}>Compliance audit under Rule 3(2) IT Rules, 2021.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            8. Your Privacy Rights (DPDP Act, 2023 & GDPR)
          </h2>
          <p>
            Under the <em>Digital Personal Data Protection Act, 2023</em>, you have the following rights regarding your personal data:
          </p>
          <ul>
            <li><strong>Right to Access Summary:</strong> You may request a summary of personal data processed by us and the processing activities undertaken.</li>
            <li><strong>Right to Correction & Erasure:</strong> You may request correction of inaccurate data or erasure of personal data that is no longer necessary for the purpose it was collected, unless retention is required by law (e.g. CERT-In logs).</li>
            <li><strong>Right of Grievance Redressal:</strong> You have the right to register a grievance with our Data Protection / Privacy Officer and escalate to the Data Protection Board of India if unresolved.</li>
            <li><strong>Right to Nominate:</strong> You have the right to nominate an individual to exercise your rights in the event of death or incapacity.</li>
          </ul>
          <p>
            To exercise these rights, please submit an official request through our online <Link href="/data-rights" style={{ color: "var(--teal)", fontWeight: 600 }}>Privacy & Data Rights Portal</Link> or email <code>privacy@meetly.evolix.studio</code>.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            9. Children’s Privacy Policy (Strict 18+ Prohibition)
          </h2>
          <p>
            Meetly does not knowingly solicit, collect, or process personal data from children under the age of 18. If you are a parent or guardian and suspect that a minor has accessed Meetly or transmitted personal data, please contact our <Link href="/grievance" style={{ color: "var(--teal)" }}>Grievance Officer</Link> immediately. Upon notification, we will immediately take steps to investigate, terminate active sessions, and restrict access from the associated network address.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            10. Cybersecurity Incidents & CERT-In Reporting
          </h2>
          <p>
            In the event of a verified cybersecurity incident (such as an unauthorized database breach or denial-of-service attack), the Operator follows a documented incident response procedure. In compliance with the CERT-In Directions of 28 April 2022, reportable cyber incidents will be formally notified to CERT-In (<code>incident@cert-in.org.in</code>) within <strong>6 hours</strong> of being detected or noticed.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            11. Changes to this Privacy Policy
          </h2>
          <p>
            We may update this Privacy Policy periodically. Changes will take effect immediately upon posting with an updated <strong>Effective Date</strong>. We encourage you to review this policy periodically.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}

