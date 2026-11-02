# MEETLY — BLOG & CONTENT AUTOMATION AUDIT

**Domain:** https://meet-ly.in/  
**Maintained by:** Evolix Studio  
**Audit Date:** November 2, 2026  
**Auditor:** Principal SEO Strategist, Full-Stack & Automation Architect  
**Objective:** Architecture audit for daily automated SEO blog publishing engine  

---

## 1. Executive Summary & Findings

Meetly is a live, adults-only (18+) social discovery platform providing anonymous 1-on-1 text chat and opt-in peer-to-peer WebRTC video chat. The platform has a dual architecture:
1. **Frontend:** React 19 + Vite 7 SPA hosted on **Cloudflare Pages** (`meet-ly.in`), utilizing static build output (`dist/public`).
2. **Backend:** Node.js + Express + tRPC + WebSockets hosted on **Render** (`meetly-by-evolix.onrender.com`).

### Core SEO Findings
| Metric / Component | Current State | Audit Assessment |
| :--- | :--- | :--- |
| **Indexing Architecture** | Hybrid: Vite SPA + Static Prerenderer (`scripts/prerender-seo.js`) | **Strong.** Static HTML is generated at build time, ensuring Googlebot receives semantic HTML without JS execution. |
| **Canonical Host** | `https://meet-ly.in/` | **Verified.** Consistent across `index.html`, canonical tags, sitemap, and robots.txt. |
| **Sitemap** | `client/public/sitemap.xml` (19 URLs) | **Valid.** Includes homepage, 5 core intent landing pages, trust/safety pages, and initial blog pages. |
| **Robots.txt** | `client/public/robots.txt` | **Optimized.** Allows public routes and `/blog/`, disallows `/api/`, `/trpc/`, `/auth/`, and `/404`. Declares Host and Sitemap. |
| **Structured Data** | JSON-LD (`WebSite`, `WebApplication`, `BreadcrumbList`, `FAQPage`, `BlogPosting`) | **Implemented.** Dynamic schema injection supported on landing pages and blog layouts. |
| **Blog System** | Initial 5 static React pages in `client/src/pages/blog/` | **Requires Evolution.** Manual React JSX files are not scalable for daily automated publishing. A data-driven content pipeline is required. |
| **Daily Automation** | None currently configured | **Missing.** Requires a scheduled GitHub Actions workflow running at 9:00 AM IST (03:30 UTC) with quality gates, dry-run support, and auto-deployment. |

---

## 2. Technical Stack & Deployment Workflow Analysis

### 2.1 Cloudflare Pages Frontend Deployment
- **Trigger:** Cloudflare Pages monitors the `main` branch of `https://github.com/meetlybyevolix-cmyk/meetly-by-evolix.git`.
- **Build Command:** `pnpm run build` (`vite build && node scripts/prerender-seo.js && esbuild server/_core/index.ts ...`).
- **Output Directory:** `dist/public`.
- **Prerendering Behavior:** Vite compiles the client bundle, then `scripts/prerender-seo.js` reads `dist/public/index.html` and writes prerendered static HTML files for every route (e.g. `/blog/index.html`, `/blog/[slug]/index.html`).
- **Advantage for Automation:** Any commit pushed to `main` by an automated GitHub Actions scheduler automatically triggers a Cloudflare Pages build and immediate global edge deployment!

### 2.2 Google Crawlability & JS-Rendering Limitations
- Pure client-side SPAs often suffer from indexing lag because Googlebot defers JavaScript rendering (second wave of indexing).
- Meetly avoids this through its **static prerendering pipeline**:
  - The static HTML output contains the full article content, H1/H2 headings, intro copy, FAQ text, and JSON-LD schema inside `<div id="root">`.
  - When a human browser loads the page, React hydrates the DOM smoothly.
  - When Googlebot fetches the page, it gets the complete text immediately on the first HTTP GET response (HTTP 200).

---

## 3. Bottlenecks in the Previous Blog Architecture

1. **Hardcoded Route Coupling:** Previously, every new blog post required:
   - Creating a new `.tsx` file in `client/src/pages/blog/`.
   - Editing `client/src/App.tsx` to add a new `<Route>` component.
   - Editing `client/src/components/BlogLayout.tsx` to add to `BLOG_POSTS`.
   - Editing `scripts/prerender-seo.js` to add an entry in the `PAGES` array.
   - Editing `client/public/sitemap.xml` manually.
2. **Lack of Automated Scheduling:** There was no background process or cron job to research, draft, validate, and publish articles daily without human intervention.
3. **No Quality Gate Pipeline:** Without automated validation, AI-generated content risks hallucinating facts, stuffing keywords, or violating sensitive mental health boundaries around loneliness.

---

## 4. Automation Architecture Blueprint

To achieve sustainable, autonomous organic growth, the daily blog engine will be built with four decoupled components:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SCHEDULED GITHUB ACTIONS WORKFLOW                    │
│                 Every Day at 03:30 UTC (9:00 AM IST)                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      DAILY BLOG ENGINE SCRIPT                          │
│                    (scripts/daily-blog-engine.js)                      │
│                                                                        │
│  1. Read 90-Day Topic Calendar (content/calendar.json)                 │
│  2. Select next scheduled topic & prevent duplicates                   │
│  3. Research search intent & keywords                                  │
│  4. Generate human-first article (Gemini API or offline generator)     │
│  5. Multi-Point Quality Gate & Validation                              │
│     - Word count & readability                                         │
│     - Keyword density (<2.5%, no stuffing)                             │
│     - Mental health safety compliance (helplines + non-medical note)   │
│     - Originality & duplicate prevention                               │
│  6. Store qualified article in content/articles/                       │
│  7. Regenerate sitemap.xml & prerender index                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                   (If Quality Checks Pass 100%)
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       AUTOMATED GIT COMMIT & PUSH                      │
│            Commit: [Daily SEO Blog] Publish: <article-title>           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  CLOUDFLARE PAGES AUTO-BUILD & DEPLOY                  │
│       Vite Build + Static Prerenderer -> Live at meet-ly.in/blog       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Security, Cost & Safety Controls

1. **No Client-Side Secrets:** Generation runs exclusively in server-side/CI environments (GitHub Actions or local Node.js CLI). API keys (`GEMINI_API_KEY`) are stored in GitHub Repository Secrets and never bundled into frontend assets.
2. **Emergency Pause:** A simple environment variable `BLOG_AUTOMATION_PAUSED=true` or status flag in `content/calendar.json` immediately halts publishing without modifying code.
3. **Dry-Run Mode:** Supports `--dry-run` to preview generation, test quality gates, and output sample drafts without committing or deploying.
4. **Mental Health Safety:** Any article discussing loneliness, depression, or distress must automatically include:
   - A non-medical disclaimer emphasizing Meetly is for casual adult social connection.
   - A verified 24/7 crisis helpline directory (Tele-MANAS, KIRAN, Vandrevala Foundation, Befrienders).

---

## 6. Audit Verdict

The existing repository architecture is **fully capable and primed** for this automated SEO blogging engine. By replacing static JSX files with a structured JSON/Markdown content repository, a universal dynamic article renderer (`/blog/:slug`), and a scheduled GitHub Actions cron workflow, Meetly will automatically publish high-quality, search-optimized articles daily at 9:00 AM IST.
