import React from "react";
import { LegalLayout } from "./LegalLayout";
import { Link } from "wouter";
import { Eye, Lock, PhoneCall, ShieldAlert, Video, Zap } from "lucide-react";

export default function SafetyCenter() {
  return (
    <LegalLayout
      title="Safety Center & User Education Guide"
      subtitle="Everything you need to know about how anonymous text and live video work, what strangers can see, and how to protect yourself online."
      badge="User Education & Safety Tips"
      effectiveDate="October 29, 2026"
    >
      <div className="legal-prose" style={{ lineHeight: "1.7", color: "var(--ink)" }}>
        {/* Quick Safety Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", padding: "18px", borderRadius: "10px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: "8px", color: "var(--teal)" }}>
              <Eye size={18} /> What Strangers Can See
            </h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
              In text chat, only the messages you type. In video chat, your live camera feed, audio, face, and background environment. No phone numbers or profiles are ever shown.
            </p>
          </div>

          <div style={{ background: "var(--card)", border: "1px solid var(--line)", padding: "18px", borderRadius: "10px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: "8px", color: "var(--coral)" }}>
              <Video size={18} /> Screen Recording Risks
            </h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
              Meetly does not record your video. However, no web app can prevent another person from taking screenshots, recording their screen, or filming with an external camera.
            </p>
          </div>

          <div style={{ background: "var(--card)", border: "1px solid var(--line)", padding: "18px", borderRadius: "10px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: "8px", color: "var(--teal)" }}>
              <Zap size={18} /> Zero Chat Retention
            </h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
              Ordinary chat messages are kept only in volatile server memory while the room is active. Once either user disconnects or skips, the conversation is wiped completely.
            </p>
          </div>
        </div>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            1. Understanding Anonymity: What It Does and Doesn't Mean
          </h2>
          <p>
            Anonymity is a powerful tool for casual conversation, but it is important to understand its technical and legal boundaries:
          </p>
          <ul>
            <li><strong>Peer-to-Peer Anonymity:</strong> You and your chat partner are strangers. Meetly does not share your name, phone number, email address, location, or past conversation history with your partner.</li>
            <li><strong>Not Complete Untraceability:</strong> To comply with Indian cybersecurity laws (such as <em>CERT-In Directions under Section 70B of the IT Act</em>) and prevent malicious bot abuse, our servers process technical network logs (such as IP addresses and connection timestamps) and retain them securely for 180 days. In the event of serious criminal conduct (such as child exploitation or violent threats), technical logs may be provided to law enforcement pursuant to lawful legal process.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            2. Live WebRTC Video Safety & IP Exposure
          </h2>
          <p>
            When you choose <strong>Video Chat</strong>, please be aware of how real-time media operates:
          </p>
          <ul>
            <li><strong>Both Users Must Opt In:</strong> Your camera and microphone will never be transmitted until you click <em>Join Video</em>, grant browser permissions, and the other participant also explicitly opts in.</li>
            <li><strong>Direct WebRTC Connection:</strong> Video packets travel directly peer-to-peer between your device and the stranger's device using WebRTC. Because direct connections exchange network candidates via STUN, technical users can inspect network packets to discover your public IP address.</li>
            <li><strong>Privacy Recommendation:</strong> If you do not want strangers to potentially observe your network IP address or surroundings, we recommend using <strong>Text Chat only</strong> or using a reputable VPN service.</li>
            <li><strong>Be Mindful of Your Surroundings:</strong> Check what is visible in your camera background (e.g. family photos, street signs outside your window, mail with your address, work badges, or school uniforms).</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            3. Safety Rules of Thumb
          </h2>
          <div style={{ background: "var(--mint)", border: "1px solid var(--teal)", padding: "16px", borderRadius: "8px", margin: "14px 0" }}>
            <ul style={{ margin: 0, paddingLeft: "18px" }}>
              <li><strong>Never Send Money:</strong> Never send cryptocurrency, bank transfers, UPI payments, or gift cards to someone you just met online. Scammers frequently operate on stranger-chat platforms.</li>
              <li><strong>Beware of Sextortion:</strong> Never perform intimate, sexual, or compromising acts on camera. Criminals record these streams and threaten to send them to your friends or family.</li>
              <li><strong>Do Not Share External Social Accounts:</strong> Avoid quickly moving to WhatsApp, Telegram, Instagram, or Snapchat where your real profile and phone number can be compromised.</li>
              <li><strong>Never Click Unfamiliar Links:</strong> Meetly automatically blocks hyperlinks in chat. If someone shares an obfuscated link, do not copy or paste it into your browser.</li>
            </ul>
          </div>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            4. How Blocking and Reporting Work
          </h2>
          <p>
            Meetly provides instant built-in controls during every conversation:
          </p>
          <ul>
            <li><strong>Next / Skip:</strong> Pressing <em>Next</em> immediately leaves the room and places you back into the matchmaking queue to find a new stranger.</li>
            <li><strong>End Call:</strong> Immediately stops camera and microphone tracks, closes the room, and returns you to the home screen.</li>
            <li><strong>Report:</strong> Opens a safety report dialog with prioritized categories (CSAM, non-consensual sexual content, harassment, threats, etc.). Submitting a report:
              <ol style={{ paddingLeft: "20px", marginTop: "4px" }}>
                <li>Immediately ends the call and revokes media permissions;</li>
                <li>Applies a 24-hour mutual block between your temporary session and the reported partner;</li>
                <li>Submits a prioritized ticket to our moderation team for review.</li>
              </ol>
            </li>
            <li><strong>Limitations of Anonymous Blocking:</strong> Because Meetly uses temporary anonymous session identifiers rather than registered accounts, a user who clears their browser storage or restarts their device may receive a new session identifier. We enforce network-level heuristics and rate-limiting to mitigate ban evasion.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
            <PhoneCall size={20} className="text-teal" /> Emergency Help & Helpline Numbers
          </h2>
          <p>
            If you are in immediate physical danger, experiencing extortion, or witness severe child abuse, please reach out to law enforcement or dedicated crisis helplines immediately:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px", margin: "14px 0" }}>
            <div style={{ background: "var(--card)", border: "1px solid var(--line)", padding: "14px", borderRadius: "8px" }}>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--ink)" }}>National Cyber Crime (India)</div>
              <div style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0" }}>Financial fraud, cyberstalking, non-consensual imagery</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--teal)" }}>Call 1930 / cybercrime.gov.in</div>
            </div>

            <div style={{ background: "var(--card)", border: "1px solid var(--line)", padding: "14px", borderRadius: "8px" }}>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--ink)" }}>Childline India (POCSO)</div>
              <div style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0" }}>24/7 emergency helpline for children in distress</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--teal)" }}>Call 1098</div>
            </div>

            <div style={{ background: "var(--card)", border: "1px solid var(--line)", padding: "14px", borderRadius: "8px" }}>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--ink)" }}>National Emergency Service (India)</div>
              <div style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0" }}>Police, Ambulance, and Fire emergency services</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--teal)" }}>Call 112</div>
            </div>

            <div style={{ background: "var(--card)", border: "1px solid var(--line)", padding: "14px", borderRadius: "8px" }}>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--ink)" }}>International Hotlines</div>
              <div style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0" }}>NCMEC (Child Abuse): report.cybertip.org | Crisis Text Line: text HOME to 741741</div>
            </div>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
}

