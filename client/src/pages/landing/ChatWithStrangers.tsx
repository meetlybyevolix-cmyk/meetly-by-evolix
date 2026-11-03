import React from "react";
import LandingLayout from "@/components/LandingLayout";
import { Lock, ShieldCheck, Sparkles, UserCheck, Video } from "lucide-react";

export default function ChatWithStrangers() {
  const seo = {
    title: "Chat with Strangers Online | Safe Anonymous Random Chat — Meetly",
    description: "Chat with strangers safely on Meetly. Connect with random adults worldwide via text or video. 18+ only, private, and free modern Omegle alternative.",
    canonicalPath: "/chat-with-strangers",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is it safe to chat with strangers on Meetly?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Meetly enforces an adults-only (18+) community via Google verification, protects your personal data with DPDP Act 2023 compliance, does not expose social profiles, and provides immediate skip, block, and reporting tools in every conversation."
          }
        },
        {
          "@type": "Question",
          "name": "How is Meetly different from old sites like Omegle?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Unlike unmoderated legacy platforms that shut down due to abuse and bot spam, Meetly requires adult verification, operates automated safety classifiers, and gives users full control over interest tags and text/video preferences."
          }
        },
        {
          "@type": "Question",
          "name": "Can I chat with strangers in India and worldwide?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Meetly has a thriving community in India as well as international users. You can choose to match globally or filter by preferred conversation languages including English and Hindi."
          }
        }
      ]
    }
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
          <strong>Meetly was created to solve these exact problems.</strong> We believe spontaneous conversations between adults should be fun, respectful, and safe. By introducing age verification, automated no-nudity safety classifiers, and interest-based matchmaking, Meetly delivers the excitement of random chatting without the chaos.
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
              In full control of your experience: tap Next to change partners or Block to permanently prevent reconnection.
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
          <li><strong>Report violations:</strong> If someone violates community guidelines, click Report so our moderation team can take immediate disciplinary action.</li>
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
    </LandingLayout>
  );
}

