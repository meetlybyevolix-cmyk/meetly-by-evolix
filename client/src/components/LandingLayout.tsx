import React from "react";
import { ArrowRight, ChevronRight, MessageCircle, Shield, Sparkles, UserPlus, Users, Video } from "lucide-react";
import { Link } from "wouter";
import SEOHead, { SEOHeadProps } from "./SEOHead";

interface LandingLayoutProps {
  seo: SEOHeadProps;
  kicker?: string;
  h1: string;
  subtitle: string;
  currentPath: string;
  children: React.ReactNode;
}

const DISCOVERY_PAGES = [
  { href: "/make-friends-online", label: "Make Friends Online", icon: UserPlus, desc: "Connect with genuine people through shared interests." },
  { href: "/talk-to-someone-online", label: "Talk to Someone Online", icon: Users, desc: "Have a real conversation when you need someone to chat with." },
  { href: "/chat-with-strangers", label: "Chat With Strangers", icon: MessageCircle, desc: "Safe, respectful text and video chats with adults worldwide." },
  { href: "/random-video-chat", label: "Random Video Chat", icon: Video, desc: "Instant peer-to-peer 1-on-1 video conversations." },
  { href: "/anonymous-text-chat", label: "Anonymous Text Chat", icon: Sparkles, desc: "Private, low-pressure conversations with no public profile." },
];

export default function LandingLayout({
  seo,
  kicker = "Social Discovery",
  h1,
  subtitle,
  currentPath,
  children,
}: LandingLayoutProps) {
  const otherPages = DISCOVERY_PAGES.filter(p => p.href !== currentPath);

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
          <Link href="/" className="button button-primary button-small" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            Start Chatting <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 16px 64px 16px", width: "100%" }}>
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: "24px" }}>
          <ol style={{ display: "flex", alignItems: "center", gap: "6px", listStyle: "none", padding: 0, margin: 0, fontSize: "13px", color: "var(--muted)" }}>
            <li>
              <Link href="/" style={{ color: "var(--muted)", textDecoration: "none" }}>Home</Link>
            </li>
            <li><ChevronRight size={12} /></li>
            <li aria-current="page" style={{ color: "var(--text)", fontWeight: 600 }}>{h1}</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <header style={{ marginBottom: "40px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "20px", background: "#eef3eb", color: "#183b32", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "14px" }}>
            <Sparkles size={13} /> {kicker}
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", lineHeight: 1.15, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: "16px" }}>
            {h1}
          </h1>
          <p style={{ fontSize: "1.15rem", lineHeight: 1.6, color: "var(--muted)", maxWidth: "720px", marginBottom: "24px" }}>
            {subtitle}
          </p>

          {/* Quick CTA Box */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px", padding: "16px 20px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <div style={{ flex: 1, minWidth: "220px" }}>
              <strong style={{ display: "block", color: "var(--text)", fontSize: "15px" }}>Ready to meet someone new?</strong>
              <span style={{ fontSize: "13px", color: "var(--muted)" }}>No public profile required. Free, anonymous, adults 18+ only.</span>
            </div>
            <Link href="/" className="button button-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: 700 }}>
              Launch Chat Now <ArrowRight size={15} />
            </Link>
          </div>
        </header>

        {/* Article Body */}
        <article className="prose-content" style={{ lineHeight: 1.7, fontSize: "15px", color: "var(--text)" }}>
          {children}
        </article>

        {/* Cross-linking to Sibling Discovery Pages */}
        <section style={{ marginTop: "56px", paddingTop: "40px", borderTop: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px" }}>Explore More Ways to Connect on Meetly</h2>
          <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "20px" }}>
            Whether you want a casual text conversation, video face-to-face chat, or want to bond over shared hobbies, choose the format that fits you:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
            {otherPages.map(page => {
              const Icon = page.icon;
              return (
                <Link
                  key={page.href}
                  href={page.href}
                  style={{
                    display: "block",
                    padding: "16px",
                    background: "var(--card)",
                    border: "1px solid var(--line)",
                    borderRadius: "12px",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "transform 0.15s ease, border-color 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#eef3eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#183b32" }}>
                      <Icon size={16} />
                    </div>
                    <strong style={{ fontSize: "14px", color: "var(--text)" }}>{page.label}</strong>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>{page.desc}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      {/* Comprehensive Footer */}
      <footer className="site-footer" style={{ padding: "32px 16px", borderTop: "1px solid var(--line)", background: "var(--card)" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
            <div>
              <strong style={{ fontSize: "15px", color: "var(--text)" }}>Meetly.</strong>
              <p style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0 0 0" }}>
                Maintained by Evolix Studio · Anonymous text &amp; video conversations · 18+ Adults Only
              </p>
            </div>
            <Link href="/" className="button button-secondary button-small">
              Back to Home
            </Link>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", paddingTop: "12px", borderTop: "1px solid var(--line)", fontSize: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontWeight: 700, color: "var(--text)" }}>Explore</span>
              <Link href="/make-friends-online" style={{ color: "var(--muted)" }}>Make Friends Online</Link>
              <Link href="/talk-to-someone-online" style={{ color: "var(--muted)" }}>Talk to Someone Online</Link>
              <Link href="/chat-with-strangers" style={{ color: "var(--muted)" }}>Chat With Strangers</Link>
              <Link href="/random-video-chat" style={{ color: "var(--muted)" }}>Random Video Chat</Link>
              <Link href="/anonymous-text-chat" style={{ color: "var(--muted)" }}>Anonymous Text Chat</Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontWeight: 700, color: "var(--text)" }}>Trust &amp; Safety</span>
              <Link href="/safety" style={{ color: "var(--muted)" }}>Safety Center</Link>
              <Link href="/community-guidelines" style={{ color: "var(--muted)" }}>Community Guidelines</Link>
              <Link href="/grievance" style={{ color: "var(--muted)" }}>Grievance Redressal (Rule 3(2))</Link>
              <Link href="/data-rights" style={{ color: "var(--muted)" }}>Data Rights</Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontWeight: 700, color: "var(--text)" }}>Legal &amp; Privacy</span>
              <Link href="/privacy" style={{ color: "var(--muted)" }}>Privacy Policy (DPDP Act)</Link>
              <Link href="/terms" style={{ color: "var(--muted)" }}>Terms of Service</Link>
              <Link href="/cookies" style={{ color: "var(--muted)" }}>Cookie Disclosure</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
