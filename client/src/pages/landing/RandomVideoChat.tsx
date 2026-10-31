import React from "react";
import LandingLayout from "@/components/LandingLayout";
import { Camera, Check, Shield, Video, Zap } from "lucide-react";

export default function RandomVideoChat() {
  const seo = {
    title: "Random Video Chat with Strangers | Fast & Private — Meetly",
    description: "Start instant 1-on-1 random video calls with friendly adults worldwide. Peer-to-peer WebRTC video, no lag, mobile-optimized, and 100% private on Meetly.",
    canonicalPath: "/random-video-chat",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does Meetly's random video chat work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Meetly connects two adults via direct peer-to-peer WebRTC. As soon as both users opt into Video Mode, their browser establishes an encrypted video connection with sub-300ms latency. No video is ever routed through or stored on external recording servers."
          }
        },
        {
          "@type": "Question",
          "name": "Does random video chat work smoothly on mobile phones?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Meetly is specifically optimized for mobile devices with hardware-accelerated VP8/H.264 video decoding, dynamic bitrate adaptation for 4G/5G networks, and persistent warm camera caching so you can skip to the next person with zero camera restart delay."
          }
        },
        {
          "@type": "Question",
          "name": "Is video chat moderated for safety?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Meetly implements real-time client-side safety classifiers and strict zero-tolerance enforcement against nudity, harassment, and inappropriate behavior under India's IT Intermediary Rules (Rule 3(2)). Violators face permanent bans."
          }
        }
      ]
    }
  };

  return (
    <LandingLayout
      seo={seo}
      kicker="Live WebRTC Video"
      h1="Instant 1-on-1 Random Video Chat with Adults Worldwide"
      subtitle="Experience lightning-fast, high-definition random video conversations directly in your browser. Powered by modern WebRTC technology with zero middleman servers and strict community safety."
      currentPath="/random-video-chat"
    >
      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "14px" }}>Why Meetly Video Chat Connects in Under 300ms</h2>
        <p>
          Traditional video chat websites often suffer from choppy connections, high latency, and draining phone batteries. Meetly was engineered using modern WebRTC protocols designed specifically for high-speed mobile and desktop performance:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginTop: "16px" }}>
          <div style={{ padding: "16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px" }}>
            <Zap size={20} style={{ color: "#176e68", marginBottom: "8px" }} />
            <strong style={{ display: "block", color: "var(--text)" }}>Warm Camera Caching</strong>
            <p style={{ margin: "6px 0 0 0", color: "var(--muted)", fontSize: "13px" }}>
              Skip to the next person instantly. Your camera stays warm in the background so you never wait for hardware reboots between conversations.
            </p>
          </div>
          <div style={{ padding: "16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px" }}>
            <Shield size={20} style={{ color: "#176e68", marginBottom: "8px" }} />
            <strong style={{ display: "block", color: "var(--text)" }}>Cloudflare Edge STUN</strong>
            <p style={{ margin: "6px 0 0 0", color: "var(--muted)", fontSize: "13px" }}>
              Sub-15ms connection negotiation across Mumbai, Delhi, Chennai, and 300+ global data centers for lightning-fast NAT traversal.
            </p>
          </div>
          <div style={{ padding: "16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px" }}>
            <Camera size={20} style={{ color: "#176e68", marginBottom: "8px" }} />
            <strong style={{ display: "block", color: "var(--text)" }}>Hardware Acceleration</strong>
            <p style={{ margin: "6px 0 0 0", color: "var(--muted)", fontSize: "13px" }}>
              Optimized for mobile battery and thermal efficiency using native VP8/H.264 codecs with capped cellular bitrates.
            </p>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "14px" }}>Video Chat Etiquette &amp; Safety Guidelines</h2>
        <ul style={{ paddingLeft: "20px", display: "grid", gap: "10px" }}>
          <li><strong>Face the camera with good lighting:</strong> A clear, well-lit video feed creates immediate trust and leads to longer, more engaging conversations.</li>
          <li><strong>Wear appropriate clothing:</strong> Meetly is strictly for clothed, adult conversations. Nudity or sexually suggestive behavior triggers automated bans.</li>
          <li><strong>Keep background noise down:</strong> Use headphones if you are in a noisy room so your chat partner can hear you clearly without echo.</li>
          <li><strong>Respect boundaries:</strong> If your chat partner does not want to answer a question or wants to change the topic, honor their comfort.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "14px" }}>Frequently Asked Questions</h2>
        <div style={{ display: "grid", gap: "14px" }}>
          <details style={{ padding: "16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px", cursor: "pointer" }}>
            <summary style={{ fontWeight: 600, color: "var(--text)" }}>Do I need to install any app or plugin?</summary>
            <p style={{ margin: "10px 0 0 0", color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              No. Meetly runs 100% inside your standard web browser (Chrome, Safari, Firefox, Edge, or mobile browsers) using native WebRTC capabilities.
            </p>
          </details>
          <details style={{ padding: "16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px", cursor: "pointer" }}>
            <summary style={{ fontWeight: 600, color: "var(--text)" }}>Can I switch camera front/back on my phone?</summary>
            <p style={{ margin: "10px 0 0 0", color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              Yes. In the video call header settings drawer, you can select any connected camera or microphone hardware seamlessly without dropping the call.
            </p>
          </details>
        </div>
      </section>
    </LandingLayout>
  );
}

