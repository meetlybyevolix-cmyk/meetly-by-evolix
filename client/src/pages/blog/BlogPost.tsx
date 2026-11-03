import React from "react";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  HelpCircle,
  Lightbulb,
  Shield,
  Sparkles,
  Tag,
  User,
} from "lucide-react";
import SEOHead, { SEOHeadProps } from "@/components/SEOHead";
import { getArticleBySlug, getRelatedArticles } from "@/lib/blogArticles";

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const article = getArticleBySlug(slug);

  if (!article) {
    return (
      <div className="app-shell legal-shell">
        <SEOHead
          title="Article Not Found — Meetly Blog"
          description="The requested guide could not be found."
          noindex
        />
        <main style={{ maxWidth: "680px", margin: "80px auto", padding: "0 16px", textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "16px", color: "var(--text)" }}>
            Guide Not Found
          </h1>
          <p style={{ color: "var(--muted)", marginBottom: "24px", lineHeight: 1.6 }}>
            The article you are looking for may have been moved or updated.
          </p>
          <Link href="/blog" className="button button-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <ArrowLeft size={16} /> Return to All Guides
          </Link>
        </main>
      </div>
    );
  }

  const relatedArticles = getRelatedArticles(article.slug, 3);
  const canonicalUrl = `https://meet-ly.in/blog/${article.slug}`;

  // Structured Data (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://meet-ly.in/" },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://meet-ly.in/blog" },
          { "@type": "ListItem", "position": 3, "name": article.title, "item": canonicalUrl },
        ],
      },
      {
        "@type": "BlogPosting",
        "@id": `${canonicalUrl}#article`,
        "headline": article.title,
        "description": article.description,
        "url": canonicalUrl,
        "datePublished": `${article.publishedDate}T00:00:00+05:30`,
        "dateModified": `${article.lastUpdated}T13:00:00+05:30`,
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
          "name": article.author,
          "url": "https://meet-ly.in/",
        },
      },
      ...(article.faqs && article.faqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              "mainEntity": article.faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer,
                },
              })),
            },
          ]
        : []),
    ],
  };

  const seo: SEOHeadProps = {
    title: article.seoTitle,
    description: article.description,
    canonicalPath: `/blog/${article.slug}`,
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
              {article.category}
            </li>
          </ol>
        </nav>

        {/* Article Header */}
        <header style={{ marginBottom: "36px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "20px", background: "#eef3eb", color: "#183b32", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
            <Tag size={13} /> {article.category}
          </div>

          <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", lineHeight: 1.2, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: "18px" }}>
            {article.title}
          </h1>

          <p style={{ fontSize: "1.15rem", lineHeight: 1.6, color: "var(--muted)", marginBottom: "22px" }}>
            {article.description}
          </p>

          {/* Meta Info Bar */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px", padding: "12px 16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px", fontSize: "13px", color: "var(--muted)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <User size={14} /> {article.author}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={14} /> Published: {article.publishedDate}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Clock size={14} /> {article.readTime}
            </span>
          </div>
        </header>

        {/* Quick Key Takeaways Box */}
        {article.keyTakeaways && article.keyTakeaways.length > 0 && (
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", padding: "20px", marginBottom: "32px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "8px", color: "#176e68" }}>
              <Lightbulb size={18} /> Quick Key Takeaways
            </h3>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", lineHeight: 1.6, color: "var(--muted)" }}>
              {article.keyTakeaways.map((takeaway, index) => (
                <li key={index} style={{ marginBottom: "6px" }}>
                  {takeaway}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Article Body Content */}
        <article
          className="prose-content"
          style={{ lineHeight: 1.75, fontSize: "15px", color: "var(--text)" }}
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />

        {/* In-Article FAQ Section */}
        {article.faqs && article.faqs.length > 0 && (
          <section style={{ marginTop: "44px", borderTop: "1px solid var(--line)", paddingTop: "32px" }}>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "20px", color: "var(--text)", display: "flex", alignItems: "center", gap: "8px" }}>
              <HelpCircle size={20} style={{ color: "#176e68" }} /> Frequently Asked Questions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {article.faqs.map((faq, index) => (
                <div key={index} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "10px", padding: "18px 20px" }}>
                  <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", margin: "0 0 8px 0" }}>
                    {faq.question}
                  </h4>
                  <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--muted)", margin: 0 }}>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Conversion CTA Banner */}
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

