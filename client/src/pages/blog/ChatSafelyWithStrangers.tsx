import React from "react";
import BlogLayout, { BLOG_POSTS } from "@/components/BlogLayout";
import { Link } from "wouter";
import { AlertTriangle, CheckCircle2, Lock, Shield, ShieldAlert, Sparkles, UserCheck } from "lucide-react";

export default function ChatSafelyWithStrangers() {
  const meta = BLOG_POSTS.find(p => p.slug === "how-to-chat-safely-with-strangers-online")!;

  return (
    <BlogLayout meta={meta}>
      {/* Intro Warning Box */}
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "20px", marginBottom: "32px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "8px", color: "#166534" }}>
          <Shield size={18} /> Our Commitment to Safe Conversations
        </h3>
        <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: "#14532d" }}>
          Connecting with adults worldwide should be exciting, enriching, and completely safe. Meeting strangers online requires healthy digital boundaries. Here are eight essential safety principles every adult should practice.
        </p>
      </div>

      <h2>The Golden Rules of Digital Privacy in Random Chats</h2>

      <h3>1. The Zero-PII Principle (Personally Identifiable Information)</h3>
      <p>
        In casual online chats, your real identity should remain completely separate from your conversational persona. Never disclose:
      </p>
      <ul>
        <li>Your full legal name or government ID details.</li>
        <li>Your exact residential address, apartment number, or neighborhood landmarks.</li>
        <li>Your specific employer, university campus, or daily transit commute routines.</li>
        <li>Your primary personal email or phone number.</li>
      </ul>
      <p>
        On <Link href="/chat-with-strangers">Meetly</Link>, your Google email and legal identity are never visible to chat partners. You appear as an anonymous peer with custom interest tags.
      </p>

      <h3>2. The Absolute Financial Boundary</h3>
      <p>
        Scammers frequently use romantic interest, dramatic sob stories, or investment "opportunities" to solicit funds. 
      </p>
      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "14px 18px", margin: "16px 0", color: "#991b1b", fontSize: "14px", lineHeight: 1.6 }}>
        <strong>Golden Rule:</strong> Under no circumstances should you ever send money, cryptocurrency, bank transfers, or gift cards to someone you met in an online chat, regardless of the emotional urgency of their story.
      </div>

      <h3>3. Video Chat Hygiene: Background &amp; Environment Checks</h3>
      <p>
        When participating in <Link href="/random-video-chat">random video chat</Link>, take ten seconds to audit your physical surroundings before turning on your camera:
      </p>
      <ul>
        <li><strong>Check Behind You:</strong> Ensure there are no diplomas, family portraits, mail envelopes with visible addresses, or work badges in the camera frame.</li>
        <li><strong>Position Your Lighting:</strong> Keep lighting in front of you rather than behind to avoid harsh glares or revealing room layouts.</li>
        <li><strong>Wear Appropriate Attire:</strong> Treat video calls with the same respect as a conversation in a public coffee shop. Meetly strictly prohibits nudity and sexual content under our <Link href="/community-guidelines">Community Guidelines</Link>.</li>
      </ul>

      <h3>4. Beware of Premature Platform Migration</h3>
      <p>
        One of the most common scammer tactics is trying to move you off the platform within the first 60 seconds: <em>"Hey, I hate this site, text me on WhatsApp / Telegram at [number]."</em>
      </p>
      <p>
        Your phone number is linked to your banking apps, Truecaller profile, and social accounts. Protect it. Stay within Meetly's secure chat environment until you have built genuine rapport over multiple sessions.
      </p>

      <h3>5. Identifying Social Engineering &amp; Love Bombing</h3>
      <p>
        Be skeptical of anyone who claims instant, intense love within minutes of meeting you. Emotional manipulators use flattery ("love bombing") to lower your defenses, making you more compliant when they subsequently ask for personal photos, money, or sensitive details.
      </p>

      <h3>6. Respect Boundaries &amp; Give No Second Chances to Harassment</h3>
      <p>
        Online chats should feel comfortable. If a partner makes you uncomfortable, makes sexually explicit demands, or uses abusive language:
      </p>
      <ul>
        <li>Do not argue, lecture, or negotiate with them.</li>
        <li>Click <strong>Report &amp; Block</strong> immediately.</li>
        <li>Meetly's automated moderation system records hash-based safety logs and flags offending accounts for immediate suspension.</li>
      </ul>

      <h3>7. Verify Adult Authenticity</h3>
      <p>
        Ensure you only use platforms that enforce age gating. Meetly requires Google authentication and strict 18+ confirmation to ensure all participants are consenting adults.
      </p>

      <h3>8. Understand Your Legal Rights &amp; Recourse</h3>
      <p>
        Under India's Information Technology Act and DPDP Act 2023, cyber harassment, non-consensual image transmission, and online fraud are serious offenses. If you encounter serious misconduct, you can submit a grievance directly to our dedicated <Link href="/grievance">Grievance Redressal Officer</Link> or report it to your national cybercrime portal.
      </p>
    </BlogLayout>
  );
}

