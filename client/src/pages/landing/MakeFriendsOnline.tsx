import React from "react";
import LandingLayout from "@/components/LandingLayout";
import { CheckCircle2, HeartHandshake, ShieldCheck, Sparkles, UserCheck } from "lucide-react";

export default function MakeFriendsOnline() {
  const seo = {
    title: "How to Make Friends Online as an Adult | Free & Safe — Meetly",
    description: "Learn how to make genuine friends online as an adult. Connect with people worldwide over shared interests in private, safe, 1-on-1 random text and video chats.",
    canonicalPath: "/make-friends-online",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How can I make real friends online safely?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Start on platforms with verified adult communities like Meetly that do not require exposing personal social media profiles or phone numbers. Select shared interest tags (books, gaming, philosophy, art) to connect with people who share your vibe, and keep conversations anonymous until mutual trust is built."
          }
        },
        {
          "@type": "Question",
          "name": "Is it normal to make friends online as an adult?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, millions of adults find it difficult to make new friends after university or relocation. Online social discovery platforms provide a welcoming, low-pressure space to meet people outside your daily routine."
          }
        },
        {
          "@type": "Question",
          "name": "Does Meetly store my conversations or contact details?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Meetly operates under privacy-by-design principles compliant with India's DPDP Act 2023. Text conversations are never logged to a database, video calls are direct peer-to-peer WebRTC connections, and your real identity remains private in every chat."
          }
        }
      ]
    }
  };

  return (
    <LandingLayout
      seo={seo}
      kicker="Community & Social Discovery"
      h1="Make New Friends Online Through Real Conversations"
      subtitle="Making friends as an adult doesn't have to feel difficult or intimidating. Meetly lets you connect one-on-one with verified adults worldwide based on shared passions and mutual respect."
      currentPath="/make-friends-online"
    >
      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "14px" }}>Why Making Friends as an Adult Feels Hard (And How to Fix It)</h2>
        <p>
          Between busy work schedules, relocations, and daily responsibilities, traditional ways of making friends often fade after college. Research shows that making a close friend requires <strong>over 50 hours of shared time</strong>, but modern social media apps have turned friendship into passive scrolling and follower counts rather than real conversations.
        </p>
        <p>
          <strong>Meetly was built on a different principle:</strong> meaningful human connection starts with a simple conversation. When you remove public follower counts, algorithmic pressure, and the expectation of perfection, two people can talk openly about hobbies, books, career dreams, or daily life.
        </p>
      </section>

      <section style={{ marginBottom: "36px", padding: "24px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "14px" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "14px" }}>How to Make Friends on Meetly in 3 Steps</h2>
        <div style={{ display: "grid", gap: "16px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#183b32", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", flexShrink: 0 }}>1</span>
            <div>
              <strong style={{ fontSize: "15px" }}>Choose Your Interests</strong>
              <p style={{ margin: "4px 0 0 0", color: "var(--muted)", fontSize: "14px" }}>
                Select topics you care about—like music, cinema, tech, books, sports, or creative writing. Meetly's matchmaking algorithm pairs you with someone who chose the same topics.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#183b32", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", flexShrink: 0 }}>2</span>
            <div>
              <strong style={{ fontSize: "15px" }}>Choose Your Mode: Text or Video</strong>
              <p style={{ margin: "4px 0 0 0", color: "var(--muted)", fontSize: "14px" }}>
                If you prefer casual typing, select Text Chat. If you want face-to-face interaction, choose Video Mode. Video requires mutual opt-in, so your camera is never turned on without your permission.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#183b32", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", flexShrink: 0 }}>3</span>
            <div>
              <strong style={{ fontSize: "15px" }}>Talk Freely, Leave Anytime</strong>
              <p style={{ margin: "4px 0 0 0", color: "var(--muted)", fontSize: "14px" }}>
                Every conversation is low-pressure. If you hit it off, you can exchange preferred contact handles voluntarily. If the vibe isn't right, tap "Next" to meet someone new without awkwardness.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "14px" }}>5 Tips for Great Online Conversations</h2>
        <ul style={{ paddingLeft: "20px", display: "grid", gap: "10px" }}>
          <li><strong>Ask open-ended questions:</strong> Instead of "How are you?", try "What was the most interesting part of your week?" or "What's a book or show you recently got into?"</li>
          <li><strong>Find common ground early:</strong> If you both matched on music, ask about their favorite live concert experience or the album they always go back to.</li>
          <li><strong>Be an active listener:</strong> Respond to what your chat partner says before jumping to a new topic. Genuine curiosity is the foundation of any friendship.</li>
          <li><strong>Respect privacy boundaries:</strong> Never pressure anyone for real-life location, phone numbers, or social handles before both sides feel comfortable.</li>
          <li><strong>Keep it lighthearted:</strong> Online chatting should be fun. Share a funny observation, a bizarre trivia fact, or an honest thought about your day.</li>
        </ul>
      </section>

      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "14px" }}>Frequently Asked Questions</h2>
        <div style={{ display: "grid", gap: "14px" }}>
          <details style={{ padding: "16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px", cursor: "pointer" }}>
            <summary style={{ fontWeight: 600, color: "var(--text)" }}>Is Meetly free to use?</summary>
            <p style={{ margin: "10px 0 0 0", color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              Yes, Meetly is 100% free with no subscription tiers, paywalls, or hidden coins. All features, including text chat, interest matchmaking, and video calling, are available to every adult user.
            </p>
          </details>
          <details style={{ padding: "16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px", cursor: "pointer" }}>
            <summary style={{ fontWeight: 600, color: "var(--text)" }}>Why is Google sign-in required if the chat is anonymous?</summary>
            <p style={{ margin: "10px 0 0 0", color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              Google authentication verifies that participants are real adults (18+) and prevents automated bots and abusive actors from ruining conversations. Your email address, profile picture, and real identity are never revealed to anyone you talk to.
            </p>
          </details>
          <details style={{ padding: "16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px", cursor: "pointer" }}>
            <summary style={{ fontWeight: 600, color: "var(--text)" }}>Can I make friends from specific countries?</summary>
            <p style={{ margin: "10px 0 0 0", color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>
              Meetly connects you with people worldwide as well as locally in India. You can select your preferred conversation language (English, Hindi, etc.) to match with people you can communicate with comfortably.
            </p>
          </details>
        </div>
      </section>
    </LandingLayout>
  );
}

