import React from "react";
import { LegalLayout } from "./LegalLayout";
import { Link } from "wouter";
import { Cookie, ExternalLink, HelpCircle, ShieldCheck } from "lucide-react";

export default function CookieDisclosure() {
  return (
    <LegalLayout
      title="Cookie & Advertising Technology Disclosure"
      subtitle="Transparent explanation of the local storage, essential cookies, and advertising technologies utilized across Meetly."
      badge="Cookies & Monetization Disclosure"
      effectiveDate="October 29, 2026"
    >
      <div className="legal-prose" style={{ lineHeight: "1.7", color: "var(--ink)" }}>
        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            1. What Are Cookies and Web Storage Technologies?
          </h2>
          <p>
            Cookies and web storage technologies (such as <code>localStorage</code> and <code>sessionStorage</code>) are small text files and key-value data stores placed on your device by websites you visit. They are widely used to make web applications function efficiently and provide reporting insights.
          </p>
          <p>
            Meetly uses storage for authentication and preferences. If advertising is enabled on published guide articles, Google's advertising technologies may also use cookies and identifiers, subject to the choices presented by the configured consent management platform.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            2. Storage Technologies Utilized by Meetly
          </h2>
          <div style={{ overflowX: "auto", margin: "16px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "var(--mint)", borderBottom: "2px solid var(--line)", textAlign: "left" }}>
                  <th style={{ padding: "10px" }}>Item Name</th>
                  <th style={{ padding: "10px" }}>Mechanism</th>
                  <th style={{ padding: "10px" }}>Classification</th>
                  <th style={{ padding: "10px" }}>Purpose</th>
                  <th style={{ padding: "10px" }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px" }}><code>meetly-auth-token</code>, <code>meetly-user-profile</code></td>
                  <td style={{ padding: "10px" }}><code>localStorage</code></td>
                  <td style={{ padding: "10px" }}>Authentication</td>
                  <td style={{ padding: "10px" }}>Stores the authentication token and cached Google profile. Not displayed to partners.</td>
                  <td style={{ padding: "10px" }}>Until sign-out or browser storage is cleared; the token has its own expiry.</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px" }}><code>meetly-session</code></td>
                  <td style={{ padding: "10px" }}><code>sessionStorage</code></td>
                  <td style={{ padding: "10px" }}><strong>Strictly Necessary</strong></td>
                  <td style={{ padding: "10px" }}>Cryptographic HMAC token authorizing your anonymous session and WebSockets.</td>
                  <td style={{ padding: "10px" }}>Deleted when tab closes (max 3 hours).</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px" }}><code>meetly-consent</code></td>
                  <td style={{ padding: "10px" }}><code>sessionStorage</code></td>
                  <td style={{ padding: "10px" }}><strong>Strictly Necessary</strong></td>
                  <td style={{ padding: "10px" }}>Remembers your 18+ age confirmation and policy acceptance for the session.</td>
                  <td style={{ padding: "10px" }}>Deleted when tab closes.</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px" }}><code>theme</code></td>
                  <td style={{ padding: "10px" }}><code>localStorage</code></td>
                  <td style={{ padding: "10px" }}>Functional / Preference</td>
                  <td style={{ padding: "10px" }}>Saves your light or dark color scheme preference across visits.</td>
                  <td style={{ padding: "10px" }}>Persistent until browser cache is cleared.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            3. Third-Party Advertising & Google AdSense Disclosures
          </h2>
          <p>
            Meetly may display Google AdSense Auto ads on published guide articles at <code>/blog/</code>. The homepage, matchmaking, text chat, video calls, legal and safety pages, request forms, blog index and error pages keep advertising requests paused. Advertising remains disabled until a publisher ID and consent setup have been configured.
          </p>
          <ul>
            <li><strong>Consent choices:</strong> When advertising is enabled, use the consent message's manage options or withdrawal control to change advertising choices. Google sign-in and the 18+ checkbox do not provide advertising consent. Choosing non-personalized ads does not necessarily eliminate cookies. If the consent controls are unavailable, contact the operator through the <Link href="/data-rights">Data Rights Portal</Link>.</li>
            <li><strong>Chat Screen Isolation:</strong> Advertisements are strictly prohibited and disabled during active text chats, live video calls, matchmaking searches, and error screens. Unmoderated user-generated content is never monetized.</li>
            <li><strong>DoubleClick & Third-Party Cookies:</strong> Google, as a third-party vendor, uses cookies to serve ads on Meetly. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to Meetly and/or other websites on the Internet.</li>
            <li><strong>Personalized Advertising:</strong> In eligible regions, ads may be personalized based on your browsing interests. You may opt out of personalized advertising by visiting Google's <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal)" }}>My Ad Center</a>.</li>
            <li><strong>Google's data use:</strong> Google and its partners may receive your IP address, device/browser information and advertising interactions. Read <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">how Google uses information from sites that use its services</a>.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            4. Managing & Opting Out of Cookies
          </h2>
          <p>
            You have multiple options to manage or disable cookies:
          </p>
          <ul>
            <li><strong>Browser Settings:</strong> You can configure your browser to block third-party cookies, clear cookies upon exit, or reject all cookies. Note that blocking <code>sessionStorage</code> will prevent anonymous chat from connecting.</li>
            <li><strong>Google Ad Settings:</strong> You can manage Google advertising cookies and personalized ads at <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal)" }}>adssettings.google.com</a>.</li>
            <li><strong>Industry Opt-Out Portals:</strong> You can opt out of a third-party vendor's use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal)" }}>aboutads.info/choices</a> or <a href="https://www.networkadvertising.org/choices/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal)" }}>networkadvertising.org/choices</a>.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            5. Contact Us
          </h2>
          <p>
            If you have questions regarding our use of cookies or advertising technologies, contact our Privacy Officer at <code>privacy@meetly.evolix.studio</code> or submit a request via our <Link href="/data-rights" style={{ color: "var(--teal)" }}>Data Rights Portal</Link>.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}

