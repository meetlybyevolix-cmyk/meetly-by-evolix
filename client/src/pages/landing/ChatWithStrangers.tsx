import DiscoveryContent from "@/components/DiscoveryContent";
import React from "react";
import LandingLayout from "@/components/LandingLayout";
import { Lock, ShieldCheck, Sparkles, UserCheck, Video } from "lucide-react";

export default function ChatWithStrangers() {
  const seo = {
    title: "Talk to Strangers Online | Free Chat on Meetly",
    description: "Talk to strangers online with Meetly: free one-to-one text and video chat for adults 18+. Choose interests and language; leave or report anytime.",
    canonicalPath: "/chat-with-strangers",
  };

  return (
    <LandingLayout
      seo={seo}
      kicker="Random Social Chat"
      h1="Chat with Strangers Online — Safely &amp; Anonymously"
      subtitle="Experience the thrill of meeting someone completely new. Meetly reimagines random online chatting for adults with real safety controls, shared interest matching, and zero public profiles."
      currentPath="/chat-with-strangers"
    >
      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "14px" }}>A Modern, Safer Alternative to Traditional Random Chat</h2>
        <p>
          The original appeal of random stranger chat was simple: connecting with someone across the globe you would never otherwise cross paths with. However, legacy platforms like Omegle became notorious for bots, unsolicited content, and toxic behavior, eventually leading to their shutdown.
        </p>
        <p>
          <strong>Meetly was created to solve these exact problems.</strong> We believe spontaneous conversations between adults should be fun, respectful, and safe. Meetly combines adult age confirmation, interest-based matching and reporting controls. Sign-in does not independently verify age, and automated screening cannot guarantee safe conversations.
        </p>
      </section>

      <section style={{ marginBottom: "36px", padding: "24px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "14px" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "16px" }}>Why People Choose Meetly to Chat With Strangers</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          <div>
            <strong style={{ color: "#183b32", fontSize: "15px" }}>✓ Identity Hidden From Partners</strong>
            <p style={{ margin: "6px 0 0 0", color: "var(--muted)", fontSize: "13px", lineHeight: 1.5 }}>
              Your partner only sees your first name or a randomized alias. Your email, phone, location, and social media handles are never displayed.
            </p>
          </div>
          <div>
            <strong style={{ color: "#183b32", fontSize: "15px" }}>✓ Topic &amp; Interest Matching</strong>
            <p style={{ margin: "6px 0 0 0", color: "var(--muted)", fontSize: "13px", lineHeight: 1.5 }}>
              Avoid awkward silences by tagging topics like Gaming, Movies, Travel, Tech, Music, or Philosophy before searching for a match.
            </p>
          </div>
          <div>
            <strong style={{ color: "#183b32", fontSize: "15px" }}>✓ Real-Time WebRTC Video</strong>
            <p style={{ margin: "6px 0 0 0", color: "var(--muted)", fontSize: "13px", lineHeight: 1.5 }}>
              Peer-to-peer, encrypted video calling that connects in under 300ms without middleman server recording or surveillance.
            </p>
          </div>
          <div>
            <strong style={{ color: "#183b32", fontSize: "15px" }}>✓ Instant Skip &amp; Block</strong>
            <p style={{ margin: "6px 0 0 0", color: "var(--muted)", fontSize: "13px", lineHeight: 1.5 }}>
              In full control of your experience: tap Next to change partners or Block to limit reconnection during your temporary sessions.
            </p>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "14px" }}>Golden Rules for Chatting with Strangers Online</h2>
        <ol style={{ paddingLeft: "20px", display: "grid", gap: "10px" }}>
          <li><strong>Never share personally identifiable information (PII):</strong> Keep your home address, financial details, workplace, and passwords strictly private.</li>
          <li><strong>Use platform features:</strong> Chat inside Meetly's secure interface rather than rushing to share personal phone numbers or external messaging handles.</li>
          <li><strong>Trust your instincts:</strong> If a conversation feels uncomfortable, invasive, or disrespectful, click Next immediately. You never owe anyone your time.</li>
          <li><strong>Report violations:</strong> If someone violates community guidelines, click Report to submit the incident for operator review.</li>
        </ol>
      </section>

      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "14px" }}>Frequently Asked Questions</h2>
        <div style={{ display: "grid", gap: "14px" }}>
          <details style={{ padding: "16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px", cursor: "pointer" }}>
            <summary style={{ fontWeight: 600, color: "var(--text)" }}>Do I have to turn on my camera to chat?</summary>
            <p style={{ margin: "10px 0 0 0", color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              No! Meetly offers both Text-Only Mode and Video Mode. Text chat requires no camera or microphone access whatsoever.
            </p>
          </details>
          <details style={{ padding: "16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px", cursor: "pointer" }}>
            <summary style={{ fontWeight: 600, color: "var(--text)" }}>Are messages saved or logged on your servers?</summary>
            <p style={{ margin: "10px 0 0 0", color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              No. In compliance with the India Digital Personal Data Protection Act 2023, chat messages are ephemeral and routed in memory only for live delivery. We do not store chat histories.
            </p>
          </details>
        </div>
      </section>
      <DiscoveryContent path="/chat-with-strangers" />
    </LandingLayout>
  );
}

