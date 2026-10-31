import React from "react";
import LandingLayout from "@/components/LandingLayout";
import { AlertCircle, HeartHandshake, MessageSquare, Shield, Smile } from "lucide-react";

export default function TalkToSomeoneOnline() {
  const seo = {
    title: "Talk to Someone Online | Safe & Casual Conversations — Meetly",
    description: "Looking for someone to talk to right now? Connect with friendly adults worldwide for casual, zero-pressure text or video conversations on Meetly.",
    canonicalPath: "/talk-to-someone-online",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Can I talk to someone online right now without downloading an app?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Meetly works directly in any desktop or mobile browser. Simply complete a quick Google 18+ verification and you can begin chatting 1-on-1 with another adult immediately."
          }
        },
        {
          "@type": "Question",
          "name": "Is Meetly a therapy or crisis helpline?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Meetly is a social discovery platform for casual, informal human conversations between adults. If you are experiencing acute mental health distress or a personal crisis, please reach out to professional counseling services or local crisis helplines such as Tele-MANAS (14416 in India) or emergency services."
          }
        },
        {
          "@type": "Question",
          "name": "What if my conversation partner is rude or inappropriate?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Meetly includes instant Skip, Block, and Report buttons in every conversation. You can end any chat in a single tap, block that user from ever connecting with you again, and submit a report for immediate moderator review."
          }
        }
      ]
    }
  };

  return (
    <LandingLayout
      seo={seo}
      kicker="Casual Conversations"
      h1="Want Someone to Talk To? Start a Real Conversation"
      subtitle="Sometimes you just need to talk about your day, share a thought, or have a relaxed chat with someone new. Meetly gives you a safe, welcoming space to connect one-on-one."
      currentPath="/talk-to-someone-online"
    >
      {/* Important Wellbeing & Scope Notice */}
      <div style={{ display: "flex", gap: "12px", padding: "16px", background: "#fdf8ee", border: "1px solid #ebd9a8", borderRadius: "10px", marginBottom: "32px", fontSize: "13px", color: "#6e4e1a" }}>
        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <strong>About Meetly's Community Role:</strong> Meetly offers informal social discovery and casual peer conversations. We are not a medical service, mental health clinic, or crisis helpline. If you are struggling with overwhelming emotions or need professional support, please contact dedicated free helplines such as India's <strong>Tele-MANAS (Dial 14416 / 1800-891-4416)</strong>, <strong>KIRAN (1800-599-0019)</strong>, or your local emergency services.
        </div>
      </div>

      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "14px" }}>Why Casual Chats Matter When You Feel Disconnected</h2>
        <p>
          It's completely normal to feel disconnected from time to time. You might be working remotely, studying late, living in a new city, or simply having a quiet evening where your friends are busy. Scrolling through endless social feeds often amplifies feelings of isolation rather than easing them.
        </p>
        <p>
          Having an actual back-and-forth exchange with another human being—even for just ten minutes—can brighten your mood, bring a fresh perspective, and remind you of the rich diversity of people experiencing similar thoughts across the world.
        </p>
      </section>

      <section style={{ marginBottom: "36px", padding: "24px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "14px" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "14px" }}>What You Can Talk About on Meetly</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
          <div style={{ padding: "14px", background: "#f8f7f1", borderRadius: "10px" }}>
            <strong style={{ display: "block", color: "var(--text)", marginBottom: "4px" }}>Daily Life &amp; Routine</strong>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>Talk about how your day went, a funny incident at work, or what you cooked for dinner.</span>
          </div>
          <div style={{ padding: "14px", background: "#f8f7f1", borderRadius: "10px" }}>
            <strong style={{ display: "block", color: "var(--text)", marginBottom: "4px" }}>Movies, TV &amp; Books</strong>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>Debate plot twists, recommend hidden gem shows, or discuss books that made you think.</span>
          </div>
          <div style={{ padding: "14px", background: "#f8f7f1", borderRadius: "10px" }}>
            <strong style={{ display: "block", color: "var(--text)", marginBottom: "4px" }}>Hobbies &amp; Projects</strong>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>Share coding projects, art, fitness goals, gaming adventures, or travel bucket lists.</span>
          </div>
          <div style={{ padding: "14px", background: "#f8f7f1", borderRadius: "10px" }}>
            <strong style={{ display: "block", color: "var(--text)", marginBottom: "4px" }}>Light Philosophical Thoughts</strong>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>Discuss life questions, what drives you, or what you want your future to look like.</span>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "14px" }}>How Meetly Keeps Conversations Respectful</h2>
        <ul style={{ paddingLeft: "20px", display: "grid", gap: "10px" }}>
          <li><strong>Adults 18+ Only:</strong> We require age confirmation to ensure conversations remain age-appropriate and safe.</li>
          <li><strong>One-Tap Next:</strong> You are never locked into any chat. If a conversation is uninteresting or uncomfortable, tap "Next" to seamlessly switch to someone else.</li>
          <li><strong>Zero Social Footprint:</strong> We do not ask for your phone number, social handles, or profile photos. Your identity is protected so you can talk without self-consciousness.</li>
          <li><strong>Active Moderation &amp; Safety:</strong> Strict zero-tolerance enforcement against harassment, hate speech, and unsolicited explicit content under Rule 3(2) of India's IT Intermediary Rules.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "14px" }}>Frequently Asked Questions</h2>
        <div style={{ display: "grid", gap: "14px" }}>
          <details style={{ padding: "16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px", cursor: "pointer" }}>
            <summary style={{ fontWeight: 600, color: "var(--text)" }}>Can I choose between text and video?</summary>
            <p style={{ margin: "10px 0 0 0", color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              Yes! You have full control. If you only want to type, choose Text Mode. Video is completely optional and only activates when both users explicitly opt in.
            </p>
          </details>
          <details style={{ padding: "16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px", cursor: "pointer" }}>
            <summary style={{ fontWeight: 600, color: "var(--text)" }}>How long do chats last?</summary>
            <p style={{ margin: "10px 0 0 0", color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              As long or as short as you want. Some conversations last 5 minutes while you share a laugh; others last for an hour discussing shared interests. You can end the chat whenever you're ready.
            </p>
          </details>
        </div>
      </section>
    </LandingLayout>
  );
}
