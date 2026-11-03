import React from "react";
import BlogLayout, { BLOG_POSTS } from "@/components/BlogLayout";
import { Link } from "wouter";
import { Check, Lightbulb, MessageSquare, Sparkles, X } from "lucide-react";

export default function HowToStartConversation() {
  const meta = BLOG_POSTS.find(p => p.slug === "how-to-start-a-conversation-with-someone-new")!;

  return (
    <BlogLayout meta={meta}>
      {/* Intro Takeaways Box */}
      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", padding: "20px", marginBottom: "32px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "8px", color: "#176e68" }}>
          <Lightbulb size={18} /> Why Most Online Starters Fail
        </h3>
        <p style={{ margin: "0 0 8px 0", fontSize: "14px", lineHeight: 1.6, color: "var(--muted)" }}>
          Sending <em>"Hey"</em>, <em>"What's up"</em>, or <em>"ASL"</em> shifts 100% of the cognitive burden onto the other person to invent a conversation topic out of thin air.
        </p>
        <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: "var(--muted)" }}>
          Great openers give your chat partner an effortless <strong>hook</strong> to grab onto: a playful debate, a vivid memory, or an easy opinion.
        </p>
      </div>

      <h2>The Anatomy of Why "Hey" Fails Every Time</h2>
      <p>
        Imagine walking up to someone at an art exhibition, staring directly at them, saying the single word <em>"Hey"</em>, and then waiting in total silence for them to entertain you.
      </p>
      <p>
        Yet millions of people do this daily in online chat rooms. Low-effort openers fail because of what behavioral economists call <strong>conversational friction</strong>. When a partner receives <em>"Hey"</em>, their brain has to process:
      </p>
      <ul>
        <li><em>"Do I reply with 'Hey' back and get stuck in an endless loop?"</em></li>
        <li><em>"Is this person going to be boring or demanding?"</em></li>
        <li><em>"Is it worth my time to carry this entire conversation?"</em></li>
      </ul>
      <p>
        By giving the other person a specific, intriguing prompt, you eliminate friction and spark instant curiosity.
      </p>

      <h2>The "Good Opener vs. Bad Opener" Comparison</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", margin: "24px 0" }}>
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "18px" }}>
          <strong style={{ color: "#991b1b", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "15px" }}>
            <X size={16} /> Openers to Avoid
          </strong>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", lineHeight: 1.7, color: "#7f1d1d" }}>
            <li><em>"Hey"</em> / <em>"Hi"</em> / <em>"Hello"</em> (Zero substance)</li>
            <li><em>"ASL?"</em> (Feels like a police interrogation)</li>
            <li><em>"Entertain me, I'm bored"</em> (Demands emotional labor)</li>
            <li><em>"Are you single / where do you live?"</em> (Creepy and invasive)</li>
          </ul>
        </div>

        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "18px" }}>
          <strong style={{ color: "#166534", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "15px" }}>
            <Check size={16} /> High-Response Openers
          </strong>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", lineHeight: 1.7, color: "#14532d" }}>
            <li><em>"What is the most overrated movie everyone seems to love?"</em></li>
            <li><em>"Need a quick opinion: savory breakfast or sweet breakfast?"</em></li>
            <li><em>"What's one song that never fails to boost your mood?"</em></li>
            <li><em>"Tell me the story behind your favorite piece of travel memory."</em></li>
          </ul>
        </div>
      </div>

      <h2>15 Icebreakers Categorized for Any Online Chat</h2>

      <h3>Category 1: Low-Stakes Debates &amp; Fun Opinions</h3>
      <ol>
        <li><em>"Quick debate: is pizza significantly better hot out of the oven, or cold the next morning out of the fridge?"</em></li>
        <li><em>"What is a piece of popular modern technology that you secretly wish was never invented?"</em></li>
        <li><em>"If you could eliminate one mundane chore from your life forever without paying for it, what would it be?"</em></li>
        <li><em>"Do you believe we will see humans land on Mars in our lifetime, or is it mostly hype?"</em></li>
      </ol>

      <h3>Category 2: Cinema, Music &amp; Culture</h3>
      <ol start={5}>
        <li><em>"What is the absolute best movie plot twist you genuinely never saw coming?"</em></li>
        <li><em>"If you had to listen to only one artist's complete discography for the next month, who are you picking?"</em></li>
        <li><em>"What is a book, show, or video game that completely altered how you look at the world?"</em></li>
        <li><em>"What is the most underrated album you wish more people knew about?"</em></li>
      </ol>

      <h3>Category 3: Daily Life &amp; Quirky Hypotheses</h3>
      <ol start={9}>
        <li><em>"If you could teleport to any city in the world right now for exactly one dinner, where are we eating?"</em></li>
        <li><em>"What is something you recently tried for the first time that you were surprisingly good at?"</em></li>
        <li><em>"If you were banned from your current career tomorrow, what entirely different path would you pursue?"</em></li>
        <li><em>"What's the weirdest internet rabbit hole you fell down this week?"</em></li>
      </ol>

      <h3>Category 4: Nostalgia &amp; Warm Memories</h3>
      <ol start={13}>
        <li><em>"What was your favorite childhood video game that you still hold nostalgia for?"</em></li>
        <li><em>"What is one piece of advice you would give your 18-year-old self if you had two minutes?"</em></li>
        <li><em>"What's a local street food or dish from your hometown that visitors always miss out on?"</em></li>
      </ol>

      <h2>The "Ping-Pong" Rule: How to Keep Conversations Flowing</h2>
      <p>
        Starting a chat is only step one. Keeping it alive requires understanding the <strong>Ping-Pong Rule</strong>:
      </p>
      <ul>
        <li><strong>Every answer should contain a question:</strong> If your partner asks <em>"What do you do for fun?"</em>, don't just say <em>"I like coding and indie movies."</em> Say: <em>"I spend way too much time tinkering with coding projects and watching 90s cinema. Have you watched anything memorable recently?"</em></li>
        <li><strong>Notice specifics:</strong> If they mention they just adopted a rescue cat, ask about the cat's personality or funny quirks. People love discussing their passions.</li>
        <li><strong>Don't force a dead battery:</strong> If someone continuously gives one-word answers despite multiple engaging prompts, recognize they are low-energy or distracted. On <Link href="/chat-with-strangers">Meetly</Link>, you can simply hit "Next person" and find someone excited to talk.</li>
      </ul>
    </BlogLayout>
  );
}

