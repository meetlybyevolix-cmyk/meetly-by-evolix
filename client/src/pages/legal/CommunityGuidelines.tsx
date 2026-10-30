import React from "react";
import { LegalLayout } from "./LegalLayout";
import { Link } from "wouter";
import { AlertTriangle, CheckCircle, LifeBuoy, ShieldAlert, XCircle } from "lucide-react";

export default function CommunityGuidelines() {
  return (
    <LegalLayout
      title="Community Guidelines & Acceptable Use Policy"
      subtitle="Clear, enforceable standards of conduct to keep random conversations respectful, consensual, and safe for everyone on Meetly."
      badge="Safety & Conduct Standards"
      effectiveDate="October 29, 2026"
    >
      <div className="legal-prose" style={{ lineHeight: "1.7", color: "var(--ink)" }}>
        {/* Core Principles Banner */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          <div style={{ background: "rgba(23, 110, 104, 0.08)", border: "1px solid var(--teal)", padding: "16px", borderRadius: "10px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 6px 0", color: "var(--teal)", display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle size={16} /> 1. Explicit Consent
            </h3>
            <p style={{ fontSize: "13px", margin: 0, color: "var(--ink)" }}>
              A stranger is still a human being. Respect boundaries immediately. When someone says "no" or asks to end a topic, stop.
            </p>
          </div>
          <div style={{ background: "rgba(200, 110, 85, 0.08)", border: "1px solid var(--coral)", padding: "16px", borderRadius: "10px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 6px 0", color: "var(--coral)", display: "flex", alignItems: "center", gap: "6px" }}>
              <XCircle size={16} /> 2. Zero Harm
            </h3>
            <p style={{ fontSize: "13px", margin: 0, color: "var(--ink)" }}>
              Zero tolerance for child exploitation, non-consensual sexual material, threats, hate speech, scams, and private data disclosure.
            </p>
          </div>
          <div style={{ background: "var(--mint)", border: "1px solid var(--line)", padding: "16px", borderRadius: "10px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 6px 0", color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px" }}>
              <LifeBuoy size={16} /> 3. Instant Exit & Recourse
            </h3>
            <p style={{ fontSize: "13px", margin: 0, color: "var(--ink)" }}>
              You are always in control. Skip, end call, block, or report instantly with a single click at any point during any conversation.
            </p>
          </div>
        </div>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--coral)", borderBottom: "1px solid var(--line)", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldAlert size={20} /> Zero-Tolerance Violations (Immediate Ban & Escalation)
          </h2>
          <p>
            The following violations result in <strong>immediate session termination, IP address banning, and mandatory escalation to law enforcement authorities</strong> (such as the National Cyber Crime Reporting Portal <code>cybercrime.gov.in</code> and NCMEC):
          </p>
          <div style={{ background: "rgba(200, 110, 85, 0.05)", borderLeft: "4px solid var(--coral)", padding: "16px", borderRadius: "0 8px 8px 0", margin: "14px 0" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "var(--coral)", fontSize: "15px", fontWeight: 700 }}>
              1. Child Sexual Abuse Material (CSAM) & Minor Exploitation
            </h4>
            <p style={{ margin: "0 0 10px 0", fontSize: "13px" }}>
              Any transmission, display, streaming, solicitation, or facilitation of child sexual abuse material, grooming, or sexual exploitation involving anyone under the age of 18 is strictly prohibited. Meetly cooperates fully with law enforcement under the <em>POCSO Act, 2012</em> and the <em>IT Act, 2000</em>.
            </p>

            <h4 style={{ margin: "12px 0 8px 0", color: "var(--coral)", fontSize: "15px", fontWeight: 700 }}>
              2. Non-Consensual Sexual Content & Intimate Imagery
            </h4>
            <p style={{ margin: "0 0 10px 0", fontSize: "13px" }}>
              Streaming, sharing, or displaying non-consensual intimate imagery, nudity, sexual acts, or deepfake/synthetic sexual depictions without the explicit consent of the subject. In compliance with Rule 3(2)(b) of the IT Rules 2021, such material is subject to 24-hour statutory takedown.
            </p>

            <h4 style={{ margin: "12px 0 8px 0", color: "var(--coral)", fontSize: "15px", fontWeight: 700 }}>
              3. Violent Threats, Extortion & Self-Harm
            </h4>
            <p style={{ margin: 0, fontSize: "13px" }}>
              Credible threats of physical violence, terrorism, extortion, sextortion, coercion, or encouraging suicide and self-harm.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            Unacceptable User Conduct & Activities
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <h4 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 4px 0" }}>🚫 Harassment, Bullying & Stalking</h4>
              <p style={{ fontSize: "14px", margin: 0, color: "var(--muted)" }}>
                Targeted insults, persistent unwanted sexual advances, stalking, degradation, or repeated attempts to connect with and harass specific users.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 4px 0" }}>🚫 Hate Speech & Discrimination</h4>
              <p style={{ fontSize: "14px", margin: 0, color: "var(--muted)" }}>
                Attacking, demeaning, or promoting violence against individuals based on race, religion, caste, ethnicity, gender, sexual orientation, disability, or nationality.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 4px 0" }}>🚫 Doxxing & Privacy Invasions</h4>
              <p style={{ fontSize: "14px", margin: 0, color: "var(--muted)" }}>
                Sharing another person's private phone number, email address, home address, social media profile, or photos without their explicit permission.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 4px 0" }}>🚫 Scams, Fraud & Malicious Links</h4>
              <p style={{ fontSize: "14px", margin: 0, color: "var(--muted)" }}>
                Requesting money, promoting investment fraud, phishing, impersonating public officials or celebrities, or attempting to distribute malware. Hyperlinks are automatically disabled in text chat to protect users.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 4px 0" }}>🚫 Unauthorized Screen Recording & Redistribution</h4>
              <p style={{ fontSize: "14px", margin: 0, color: "var(--muted)" }}>
                Recording, photographing, screenshotting, or streaming conversations or video feeds of another participant without their consent is strictly prohibited.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 4px 0" }}>🚫 Bot Swarms & Platform Manipulation</h4>
              <p style={{ fontSize: "14px", margin: 0, color: "var(--muted)" }}>
                Using automated scripts, bots, crawlers, rapid-skip generators, or commercial advertising spam. Automated matchmaking manipulation will trigger automatic IP bans.
              </p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            How to Protect Yourself & Report Violations
          </h2>
          <ol style={{ paddingLeft: "20px" }}>
            <li><strong>Click "Next" / "End":</strong> If a conversation makes you uncomfortable, disconnect immediately. You do not owe a stranger an explanation.</li>
            <li><strong>Click "Report":</strong> Available on the chat screen. Select the appropriate reason and optionally provide an excerpt. The connection terminates instantly, and a mutual 24-hour block is placed.</li>
            <li><strong>External Grievance:</strong> If you encountered severe abuse, non-consensual material, or child safety threats, submit an official ticket through our <Link href="/grievance" style={{ color: "var(--teal)", fontWeight: 600 }}>Grievance Redressal Portal</Link>.</li>
            <li><strong>Preserve Your Anonymity:</strong> Never share real names, addresses, social handles, or phone numbers. Meetly will never ask you for money or passwords.</li>
          </ol>
        </section>
      </div>
    </LegalLayout>
  );
}

