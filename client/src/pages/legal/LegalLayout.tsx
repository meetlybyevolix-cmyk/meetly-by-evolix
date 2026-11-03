import React from "react";
import { ArrowLeft, BookOpen, ExternalLink, HelpCircle, Lock, MessageSquare, Scale, Shield, ShieldAlert, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import SEOHead from "@/components/SEOHead";

interface LegalLayoutProps {
  title: string;
  subtitle?: string;
  effectiveDate?: string;
  badge?: string;
  children: React.ReactNode;
}

export const LEGAL_TABS = [
  { href: "/about", label: "About & Contact", icon: HelpCircle },
  { href: "/terms", label: "Terms of Service", icon: Scale },
  { href: "/privacy", label: "Privacy Policy", icon: Lock },
  { href: "/community-guidelines", label: "Community Guidelines", icon: BookOpen },
  { href: "/safety", label: "Safety Center", icon: Shield },
  { href: "/data-rights", label: "Privacy & Data Rights", icon: MessageSquare },
  { href: "/grievance", label: "Grievance Redressal", icon: ShieldAlert },
  { href: "/cookies", label: "Cookie & Ad Policy", icon: HelpCircle },
];

export function LegalLayout({
  title,
  subtitle,
  effectiveDate = "October 29, 2026",
  badge = "Legal & Compliance",
  children,
}: LegalLayoutProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-shell legal-shell">
      <SEOHead
        title={`${title} — Meetly`}
        description={subtitle || `${title} for Meetly, the adults-only random text and video chat platform.`}
        canonicalPath={location}
      />
      {/* Top Header */}
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/" className="brand" aria-label="Meetly Home">
            <span className="brand-mark" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={20} className="text-teal" />
            </span>
            <span>
              Meetly<span className="brand-period">.</span>
            </span>
          </Link>
          <span style={{ fontSize: "12px", color: "var(--muted)", borderLeft: "1px solid var(--line)", paddingLeft: "12px" }}>
            Trust & Safety Framework
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={toggleTheme}
            className="theme-button"
            title="Toggle theme"
            aria-label="Toggle theme"
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer" }}
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
          <Link href="/" className="button" style={{ padding: "8px 16px", borderRadius: "8px", background: "var(--teal)", color: "#fff", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Chat
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="legal-main" style={{ width: "min(1080px, calc(100% - 32px))", margin: "32px auto", flex: 1 }}>
        {/* Navigation Tabs */}
        <nav aria-label="Legal Navigation" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "32px", borderBottom: "1px solid var(--line)", paddingBottom: "16px" }}>
          {LEGAL_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = location === tab.href || (tab.href === "/community-guidelines" && location === "/guidelines");
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 500,
                  background: isActive ? "var(--teal)" : "var(--card)",
                  color: isActive ? "#ffffff" : "var(--ink)",
                  border: isActive ? "1px solid var(--teal)" : "1px solid var(--line)",
                  transition: "all 0.15s ease",
                  textDecoration: "none",
                }}
              >
                <Icon size={14} />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Page Header */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--mint)", color: "var(--teal)", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, marginBottom: "12px" }}>
            <Sparkles size={13} />
            {badge}
          </div>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 750, letterSpacing: "-0.03em", margin: "0 0 10px 0", color: "var(--ink)", lineHeight: 1.2 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: "16px", color: "var(--muted)", margin: "0 0 12px 0", maxWidth: "800px" }}>
              {subtitle}
            </p>
          )}
          <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <span>Effective Date: <strong>{effectiveDate}</strong></span>
            <span>Target Jurisdiction: <strong>Republic of India</strong> (with international user terms)</span>
            <span>Applicable Law: <strong>Information Technology Act, 2000 & DPDP Act, 2023</strong></span>
          </div>
        </div>

        {/* Statutory Legal Notice / Disclaimer Banner */}
        <div style={{ background: "rgba(23, 110, 104, 0.06)", borderLeft: "4px solid var(--teal)", padding: "14px 18px", borderRadius: "0 8px 8px 0", marginBottom: "32px", fontSize: "13px", lineHeight: "1.5" }}>
          <strong>Legal Implementation Notice:</strong> This framework reflects the real architecture and technical safeguards of Meetly, implemented in alignment with the <em>Information Technology (Intermediary Guidelines) Rules, 2021</em>, the <em>Digital Personal Data Protection Act, 2023</em>, and <em>CERT-In Directions, 2022</em>. Implementation does not constitute formal legal advice or guarantee immunity from statutory liability; matters requiring formal verification by an Indian advocate are clearly flagged.
        </div>

        {/* Legal Document Content */}
        <article className="legal-article" style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", padding: "clamp(20px, 4vw, 40px)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
          {children}
        </article>
      </main>

      {/* Global Comprehensive Legal Footer */}
      <footer className="site-footer" style={{ borderTop: "1px solid var(--line)", padding: "32px 0", marginTop: "48px", background: "var(--card)" }}>
        <div style={{ width: "min(1080px, calc(100% - 32px))", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
          <div>
            <div className="brand" style={{ fontSize: "18px", marginBottom: "8px" }}>
              Meetly<span className="brand-period">.</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 12px 0" }}>
              Text and WebRTC video conversations with no public profiles. Google sign-in is required before matchmaking.
            </p>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              Operated by Evolix Studio © {new Date().getFullYear()}
            </span>
          </div>

          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Legal & Policies</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
              <Link href="/terms" style={{ color: "var(--teal)" }}>Terms of Service</Link>
              <Link href="/privacy" style={{ color: "var(--teal)" }}>Privacy Policy</Link>
              <Link href="/community-guidelines" style={{ color: "var(--teal)" }}>Community Guidelines</Link>
              <Link href="/cookies" style={{ color: "var(--teal)" }}>Cookie & Ad Disclosure</Link>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Safety & Recourse</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
              <Link href="/safety" style={{ color: "var(--teal)" }}>Safety Center</Link>
              <Link href="/grievance" style={{ color: "var(--teal)" }}>Grievance Redressal (Rule 3(2))</Link>
              <Link href="/data-rights" style={{ color: "var(--teal)" }}>Privacy & Data Rights</Link>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Emergency Assistance</h4>
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 8px 0" }}>
              For immediate threats or child safety concerns, contact law enforcement immediately.
            </p>
            <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span>National Cyber Crime: <strong>cybercrime.gov.in</strong> (1930)</span>
              <span>Childline India: <strong>1098</strong></span>
              <span>National Emergency Number: <strong>112</strong></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

