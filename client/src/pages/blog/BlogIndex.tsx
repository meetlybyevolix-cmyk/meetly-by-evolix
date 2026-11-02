import React, { useState } from "react";
import { ArrowRight, BookOpen, Clock, Filter, MessageCircle, Search, Shield, Sparkles, Tag, User } from "lucide-react";
import { Link } from "wouter";
import SEOHead from "@/components/SEOHead";
import { getAllPublishedArticles } from "@/lib/blogArticles";

const CATEGORIES = [
  "All",
  "Friendship Advice",
  "Wellbeing & Connection",
  "Conversation Skills",
  "Online Safety",
  "Chat Platforms",
  "Cultural Connections",
] as const;

export default function BlogIndex() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const allPosts = getAllPublishedArticles();

  const filteredPosts = allPosts.filter(post => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://meet-ly.in/" },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://meet-ly.in/blog" },
        ],
      },
      {
        "@type": "CollectionPage",
        "@id": "https://meet-ly.in/blog#page",
        "name": "Meetly Blog & Social Connection Guides",
        "description": "Expert advice, icebreakers, safety rules, and psychological insights for meeting new people and making online friends as an adult.",
        "url": "https://meet-ly.in/blog",
        "publisher": {
          "@type": "Organization",
          "name": "Meetly by Evolix Studio",
          "url": "https://meet-ly.in/",
        },
      },
    ],
  };

  return (
    <div className="app-shell legal-shell">
      <SEOHead
        title="Meetly Blog — Tips for Making Friends, Safe Chat & Conversation Advice"
        description="Explore practical guides, icebreakers, online safety tips, and expert advice for meeting new people and making genuine friends online as an adult."
        canonicalPath="/blog"
        ogType="website"
        jsonLd={jsonLd}
      />

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
          <Link href="/" className="button button-primary button-small" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            Start Chatting <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero Header */}
      <main style={{ maxWidth: "980px", margin: "0 auto", padding: "40px 16px 80px 16px", width: "100%" }}>
        <header style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 14px", borderRadius: "20px", background: "#eef3eb", color: "#183b32", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
            <BookOpen size={14} /> Guides, Advice &amp; Safety Insights
          </div>
          <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.2rem)", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "18px" }}>
            The Meetly Blog
          </h1>
          <p style={{ fontSize: "1.15rem", lineHeight: 1.6, color: "var(--muted)", maxWidth: "680px", margin: "0 auto 32px auto" }}>
            Practical guides to making adult friends, starting great conversations, beating loneliness, and staying safe in online chats.
          </p>

          {/* Search Box */}
          <div style={{ maxWidth: "480px", margin: "0 auto", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
            <input
              type="text"
              placeholder="Search guides (e.g. icebreakers, loneliness, safety)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "12px 16px 12px 44px", borderRadius: "999px", border: "1px solid var(--line)", background: "var(--card)", fontSize: "14px", color: "var(--text)", outline: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
            />
          </div>
        </header>

        {/* Category Pills Filter */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "36px", justifyContent: "center", flexWrap: "wrap" }}>
          {CATEGORIES.map(category => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: "7px 16px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: isSelected ? "1px solid #176e68" : "1px solid var(--line)",
                  background: isSelected ? "#176e68" : "var(--card)",
                  color: isSelected ? "#ffffff" : "var(--text)",
                  transition: "all 0.15s ease",
                }}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Blog Post Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
          {filteredPosts.map(post => (
            <article
              key={post.slug}
              style={{
                background: "var(--card)",
                border: "1px solid var(--line)",
                borderRadius: "16px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#176e68", textTransform: "uppercase", background: "#eef3eb", padding: "3px 10px", borderRadius: "999px" }}>
                  {post.category}
                </span>
                <span style={{ fontSize: "12px", color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={12} /> {post.readTime}
                </span>
              </div>

              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)", lineHeight: 1.35, marginBottom: "12px" }}>
                <Link href={`/blog/${post.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
                  {post.title}
                </Link>
              </h2>

              <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, flex: 1, marginBottom: "20px" }}>
                {post.description}
              </p>

              <div style={{ borderTop: "1px solid var(--line)", paddingTop: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                  {post.publishedDate}
                </span>
                <Link
                  href={`/blog/${post.slug}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 700, color: "#176e68", textDecoration: "none" }}
                >
                  Read Article <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--muted)" }}>
            <p style={{ fontSize: "16px" }}>No guides found matching your query.</p>
            <button
              type="button"
              onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
              className="button button-secondary"
              style={{ marginTop: "12px" }}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Global CTA Box */}
        <div style={{ marginTop: "64px", padding: "36px", background: "linear-gradient(135deg, #176e68 0%, #0d4642 100%)", borderRadius: "20px", color: "#ffffff", textAlign: "center", boxShadow: "0 10px 30px rgba(23, 110, 104, 0.25)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.15)", padding: "5px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 700, marginBottom: "16px" }}>
            <Sparkles size={14} /> Connect Instantly
          </div>
          <h3 style={{ fontSize: "clamp(1.5rem, 3.5vw, 2rem)", fontWeight: 800, color: "#ffffff", marginBottom: "12px" }}>
            Ready to Put What You Learn Into Practice?
          </h3>
          <p style={{ fontSize: "15px", lineHeight: 1.6, color: "rgba(255,255,255,0.9)", maxWidth: "560px", margin: "0 auto 24px auto" }}>
            Meetly connects you with verified adults worldwide for 1-on-1 random text and video chats. Zero setup, 100% private, and completely free.
          </p>
          <Link href="/" className="button" style={{ background: "#ffffff", color: "#176e68", fontWeight: 700, padding: "12px 28px", borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "15px" }}>
            Launch Meetly Free <ArrowRight size={16} />
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
