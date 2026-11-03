import React from "react";
import { ArrowLeft, ArrowRight, BookOpen, Calendar, Clock, HeartHandshake, Shield, Sparkles, Tag, User } from "lucide-react";
import { Link } from "wouter";
import SEOHead, { SEOHeadProps } from "./SEOHead";

export interface BlogPostMeta {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  category: "Friendship Advice" | "Wellbeing & Connection" | "Conversation Skills" | "Online Safety" | "Chat Platforms";
  readTime: string;
  publishedDate: string;
  lastUpdated: string;
  author: string;
  relatedSlugs: string[];
}

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: "how-to-make-friends-online-as-an-adult",
    title: "How to Make Friends Online as an Adult: A Practical, Low-Pressure Guide",
    seoTitle: "How to Make Friends Online as an Adult: A Practical Guide — Meetly",
    description: "Struggling to make friends after college or moving? Discover 5 proven, low-pressure ways to meet like-minded adults online safely and naturally.",
    category: "Friendship Advice",
    readTime: "7 min read",
    publishedDate: "November 2, 2026",
    lastUpdated: "November 2, 2026",
    author: "Meetly Editorial Team",
    relatedSlugs: [
      "how-to-start-a-conversation-with-someone-new",
      "what-to-do-when-you-feel-lonely-and-want-to-talk",
      "how-to-chat-safely-with-strangers-online",
    ],
  },
  {
    slug: "what-to-do-when-you-feel-lonely-and-want-to-talk",
    title: "Feeling Lonely and Want to Talk? Healthy Ways to Connect Right Now",
    seoTitle: "Feeling Lonely and Want to Talk? Healthy Ways to Connect — Meetly",
    description: "When you feel disconnected or lonely and want someone to talk to, here are healthy, low-pressure steps to find casual human connection right now.",
    category: "Wellbeing & Connection",
    readTime: "6 min read",
    publishedDate: "November 2, 2026",
    lastUpdated: "November 2, 2026",
    author: "Meetly Editorial Team",
    relatedSlugs: [
      "how-to-make-friends-online-as-an-adult",
      "how-to-start-a-conversation-with-someone-new",
      "text-chat-vs-video-chat",
    ],
  },
  {
    slug: "how-to-start-a-conversation-with-someone-new",
    title: "How to Start a Conversation With Someone New: 15 Icebreakers That Actually Work",
    seoTitle: "How to Start a Conversation With Someone New: 15 Proven Openers — Meetly",
    description: "Skip the boring 'hey' and 'what's up'. Master the art of starting engaging online chats with tested icebreakers, fun questions, and conversational hooks.",
    category: "Conversation Skills",
    readTime: "6 min read",
    publishedDate: "November 2, 2026",
    lastUpdated: "November 2, 2026",
    author: "Meetly Editorial Team",
    relatedSlugs: [
      "how-to-make-friends-online-as-an-adult",
      "how-to-chat-safely-with-strangers-online",
      "text-chat-vs-video-chat",
    ],
  },
  {
    slug: "how-to-chat-safely-with-strangers-online",
    title: "How to Chat Safely With Strangers Online: 8 Essential Rules for Adults",
    seoTitle: "How to Chat Safely With Strangers Online: 8 Essential Rules — Meetly",
    description: "Learn how to protect your privacy and stay secure while chatting with strangers online. Essential safety rules, red flags, and digital boundary tips.",
    category: "Online Safety",
    readTime: "8 min read",
    publishedDate: "November 2, 2026",
    lastUpdated: "November 2, 2026",
    author: "Meetly Trust & Safety",
    relatedSlugs: [
      "how-to-make-friends-online-as-an-adult",
      "how-to-start-a-conversation-with-someone-new",
      "text-chat-vs-video-chat",
    ],
  },
  {
    slug: "text-chat-vs-video-chat",
    title: "Text Chat vs Video Chat: Which Is Better for Meeting New People?",
    seoTitle: "Text Chat vs Video Chat: Which Is Better for Meeting New People? — Meetly",
    description: "Comparing random text chat and video chat for meeting strangers. Discover the pros, cons, privacy differences, and which mode fits your social style.",
    category: "Chat Platforms",
    readTime: "5 min read",
    publishedDate: "November 2, 2026",
    lastUpdated: "November 2, 2026",
    author: "Meetly Editorial Team",
    relatedSlugs: [
      "how-to-start-a-conversation-with-someone-new",
      "how-to-chat-safely-with-strangers-online",
      "how-to-make-friends-online-as-an-adult",
    ],
  },
];

interface BlogLayoutProps {
  meta: BlogPostMeta;
  children: React.ReactNode;
}

export default function BlogLayout({ meta, children }: BlogLayoutProps) {
  const canonicalUrl = `https://meet-ly.in/blog/${meta.slug}`;
  const relatedArticles = BLOG_POSTS.filter(p => meta.relatedSlugs.includes(p.slug));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://meet-ly.in/" },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://meet-ly.in/blog" },
          { "@type": "ListItem", "position": 3, "name": meta.title, "item": canonicalUrl },
        ],
      },
      {
        "@type": "BlogPosting",
        "@id": `${canonicalUrl}#article`,
        "headline": meta.title,
        "description": meta.description,
        "url": canonicalUrl,
        "datePublished": "2026-11-02T00:00:00+05:30",
        "dateModified": "2026-11-02T13:00:00+05:30",
        "inLanguage": "en-US",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonicalUrl,
        },
        "publisher": {
          "@type": "Organization",
          "name": "Meetly by Evolix Studio",
          "url": "https://meet-ly.in/",
          "logo": {
            "@type": "ImageObject",
            "url": "https://meet-ly.in/meetly-mark.svg",
          },
        },
        "author": {
          "@type": "Organization",
          "name": meta.author,
          "url": "https://meet-ly.in/",
        },
      },
    ],
  };

  const seo: SEOHeadProps = {
    title: meta.seoTitle,
    description: meta.description,
    canonicalPath: `/blog/${meta.slug}`,
    ogType: "article",
    jsonLd,
  };

  return (
    <div className="app-shell legal-shell">
      <SEOHead {...seo} />

      {/* Top Header */}
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/" className="brand" aria-label="Meetly Home">
            <span className="brand-mark" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={20} style={{ color: "#176e68" }} />
            </span>
            <span>
              Meetly<span className="brand-period">.</span>
            </span>
          </Link>
          <span style={{ fontSize: "12px", color: "var(--muted)", borderLeft: "1px solid var(--line)", paddingLeft: "12px" }}>
            18+ Adults Only
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/blog" className="top-link" style={{ fontSize: "13px", fontWeight: 600 }}>
            <BookOpen size={15} /> All Guides
          </Link>
          <Link href="/" className="button button-primary button-small" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            Start Chatting <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 16px 64px 16px", width: "100%" }}>
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: "24px" }}>
          <ol style={{ display: "flex", alignItems: "center", gap: "8px", listStyle: "none", padding: 0, margin: 0, fontSize: "13px", color: "var(--muted)", flexWrap: "wrap" }}>
            <li>
              <Link href="/" style={{ color: "var(--muted)", textDecoration: "none" }}>Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/blog" style={{ color: "var(--muted)", textDecoration: "none" }}>Blog &amp; Guides</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" style={{ color: "var(--text)", fontWeight: 600 }}>
              {meta.category}
            </li>
          </ol>
        </nav>

        {/* Article Header */}
        <header style={{ marginBottom: "36px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "20px", background: "#eef3eb", color: "#183b32", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
            <Tag size={13} /> {meta.category}
          </div>

          <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", lineHeight: 1.2, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: "18px" }}>
            {meta.title}
          </h1>

          <p style={{ fontSize: "1.15rem", lineHeight: 1.6, color: "var(--muted)", marginBottom: "22px" }}>
            {meta.description}
          </p>

          {/* Meta Info Bar */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px", padding: "12px 16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px", fontSize: "13px", color: "var(--muted)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <User size={14} /> {meta.author}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={14} /> Published: {meta.publishedDate}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Clock size={14} /> {meta.readTime}
            </span>
          </div>
        </header>

        {/* Article Body */}
        <article className="prose-content" style={{ lineHeight: 1.75, fontSize: "15px", color: "var(--text)" }}>
          {children}
        </article>

        {/* In-Article Conversion Banner */}
        <div style={{ marginTop: "48px", padding: "28px", background: "linear-gradient(135deg, #176e68 0%, #0d4642 100%)", borderRadius: "16px", color: "#ffffff", boxShadow: "0 8px 24px rgba(23, 110, 104, 0.2)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700, marginBottom: "12px" }}>
            <Sparkles size={13} /> Put It Into Practice
          </div>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "8px", color: "#ffffff" }}>
            Ready to Start a Real Conversation?
          </h3>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.9)", maxWidth: "600px", marginBottom: "20px" }}>
            Meetly lets you connect with friendly adults worldwide via 1-on-1 random text or video chat. Free, verified 18+ community, with no public profiles.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/" className="button" style={{ background: "#ffffff", color: "#176e68", fontWeight: 700, padding: "10px 22px", borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              Start Chatting for Free <ArrowRight size={15} />
            </Link>
            <Link href="/make-friends-online" style={{ color: "rgba(255,255,255,0.9)", padding: "10px 16px", fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", textDecoration: "underline" }}>
              How Matching Works
            </Link>
          </div>
        </div>

        {/* Related Guides Section */}
        {relatedArticles.length > 0 && (
          <section style={{ marginTop: "56px", borderTop: "1px solid var(--line)", paddingTop: "36px" }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px", color: "var(--text)" }}>
              Recommended Next Reads
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
              {relatedArticles.map(post => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  style={{ display: "block", padding: "18px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", textDecoration: "none", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
                >
                  <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 700, color: "#176e68", textTransform: "uppercase", marginBottom: "8px" }}>
                    {post.category}
                  </span>
                  <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", lineHeight: 1.4, marginBottom: "8px" }}>
                    {post.title}
                  </h4>
                  <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5, margin: 0 }}>
                    {post.readTime} &bull; Read Guide &rarr;
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to Blog Hub */}
        <div style={{ marginTop: "36px", textAlign: "center" }}>
          <Link href="/blog" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#176e68", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
            <ArrowLeft size={15} /> Back to all Meetly Guides &amp; Articles
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--line)", padding: "32px 16px", textAlign: "center", fontSize: "13px", color: "var(--muted)" }}>
        <p style={{ margin: "0 0 12px 0" }}>
          &copy; {new Date().getFullYear()} Meetly by Evolix Studio. Adults only (18+). Safe, respectful conversations.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
          <Link href="/make-friends-online" style={{ color: "var(--muted)" }}>Make Friends Online</Link>
          <Link href="/talk-to-someone-online" style={{ color: "var(--muted)" }}>Talk to Someone</Link>
          <Link href="/chat-with-strangers" style={{ color: "var(--muted)" }}>Chat with Strangers</Link>
          <Link href="/random-video-chat" style={{ color: "var(--muted)" }}>Random Video Chat</Link>
          <Link href="/safety" style={{ color: "var(--muted)" }}>Safety Center</Link>
          <Link href="/privacy" style={{ color: "var(--muted)" }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: "var(--muted)" }}>Terms</Link>
        </div>
      </footer>
    </div>
  );
}

