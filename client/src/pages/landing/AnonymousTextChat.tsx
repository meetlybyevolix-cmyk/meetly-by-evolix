import React from "react";
import LandingLayout from "@/components/LandingLayout";
import { EyeOff, Lock, MessageCircle, ShieldCheck, Sparkles, UserX } from "lucide-react";

export default function AnonymousTextChat() {
  const seo = {
    title: "Anonymous Text Chat with Strangers | Free & Private — Meetly",
    description: "Enjoy private, anonymous random text chat with strangers online. No public profiles, no camera required, zero chat logs stored. Connect with adults worldwide.",
    canonicalPath: "/anonymous-text-chat",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is Meetly text chat truly anonymous?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. While Google authentication is used to verify that participants are real adults (18+), your real name, email, and Google profile details are completely hidden in chat. You are assigned a funky random avatar and first-name username, and no public profile exists."
          }
        },
        {
          "@type": "Question",
          "name": "Are my text chat messages saved anywhere?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. In strict compliance with India's DPDP Act 2023, chat messages are processed solely in temporary memory to deliver them between active participants. Once your chat session closes, the messages disappear permanently."
          }
        },
        {
          "@type": "Question",
          "name": "Can I share photos in anonymous text chat?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Meetly includes an opt-in photo sharing feature with client-side no-nudity safety scanning to prevent explicit content and protect privacy."
          }
        }
      ]
    }
  };

  return (
    <LandingLayout
      seo={seo}
      kicker="Zero-Pressure Text Chat"
      h1="Anonymous Text Chat with Strangers — Private &amp; Free"
      subtitle="Talk openly without cameras, microphones, or social media pressure. Meetly's anonymous text chat pairs you 1-on-1 with adults worldwide based on genuine interests."
      currentPath="/anonymous-text-chat"
    >
      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "14px" }}>The Power of Words: Why Text Chat Remains the Most Relaxing Way to Talk</h2>
        <p>
          Video calls and voice messages require immediate reactions, self-consciousness about appearances, and a quiet private environment. <strong>Anonymous text chat offers freedom:</strong> you can take a moment to formulate your thoughts, chat while commuting or relaxing in bed, and enjoy pure conversation focused entirely on ideas, stories, and humor.
        </p>
        <p>
          Whether you want to debate a movie theory, share an embarrassing childhood memory, or just trade jokes with someone halfway across the planet, text chat strips away prejudice and lets your personality lead the way.
        </p>
      </section>

      <section style={{ marginBottom: "36px", padding: "24px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "14px" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "16px" }}>Core Privacy Features in Meetly Text Chat</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <div style={{ padding: "14px", background: "#f8f7f1", borderRadius: "10px" }}>
            <EyeOff size={20} style={{ color: "#183b32", marginBottom: "6px" }} />
            <strong style={{ display: "block", color: "var(--text)" }}>No Public Profile</strong>
            <p style={{ margin: "4px 0 0 0", color: "var(--muted)", fontSize: "13px" }}>
              There is no bio, follower count, or history to browse. Every chat starts completely fresh with a clean slate.
            </p>
          </div>
          <div style={{ padding: "14px", background: "#f8f7f1", borderRadius: "10px" }}>
            <Lock size={20} style={{ color: "#183b32", marginBottom: "6px" }} />
            <strong style={{ display: "block", color: "var(--text)" }}>Ephemeral Delivery</strong>
            <p style={{ margin: "4px 0 0 0", color: "var(--muted)", fontSize: "13px" }}>
              Messages exist only in live memory while the chat is active. When you tap Next or leave, messages vanish forever.
            </p>
          </div>
          <div style={{ padding: "14px", background: "#f8f7f1", borderRadius: "10px" }}>
            <Sparkles size={20} style={{ color: "#183b32", marginBottom: "6px" }} />
            <strong style={{ display: "block", color: "var(--text)" }}>Safe Photo Sharing</strong>
            <p style={{ margin: "4px 0 0 0", color: "var(--muted)", fontSize: "13px" }}>
              Share images securely with automated client-side safety verification and sensitive image blur protection.
            </p>
          </div>
          <div style={{ padding: "14px", background: "#f8f7f1", borderRadius: "10px" }}>
            <ShieldCheck size={20} style={{ color: "#183b32", marginBottom: "6px" }} />
            <strong style={{ display: "block", color: "var(--text)" }}>Instant Skip &amp; Safety</strong>
            <p style={{ margin: "4px 0 0 0", color: "var(--muted)", fontSize: "13px" }}>
              Easily skip uninteresting chats, block unwanted users, and report inappropriate conduct in one click.
            </p>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "14px" }}>Frequently Asked Questions</h2>
        <div style={{ display: "grid", gap: "14px" }}>
          <details style={{ padding: "16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px", cursor: "pointer" }}>
            <summary style={{ fontWeight: 600, color: "var(--text)" }}>Can I switch to video during a text conversation?</summary>
            <p style={{ margin: "10px 0 0 0", color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              Yes. If both you and your chat partner decide you want to upgrade the conversation to video, either person can tap the Video button to request mutual opt-in video.
            </p>
          </details>
          <details style={{ padding: "16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px", cursor: "pointer" }}>
            <summary style={{ fontWeight: 600, color: "var(--text)" }}>Can I use Meetly on my phone browser?</summary>
            <p style={{ margin: "10px 0 0 0", color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              Yes! Meetly is fully responsive and optimized for mobile browsers on Android and iOS without needing an app store download.
            </p>
          </details>
        </div>
      </section>
    </LandingLayout>
  );
}
