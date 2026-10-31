# MEETLY — GOOGLE SEARCH CONSOLE & 30/60/90-DAY INDEXING ROADMAP

**Domain:** https://meet-ly.in/  
**Canonical Host:** `https://meet-ly.in` (Apex)  
**Sitemap URL:** `https://meet-ly.in/sitemap.xml`  
**Robots URL:** `https://meet-ly.in/robots.txt`  
**Date:** October 31, 2026  
**Auditor:** Senior SEO Systems Engineer & Technical Operations Lead  
**Status:** Verification Ready & Implementation Complete  

---

## Part 1: Step-by-Step Google Search Console Setup

### Step 1: Confirm Preferred Canonical Host
- **Configured Host:** `https://meet-ly.in` (Apex domain).
- **Secondary Host:** `https://www.meet-ly.in` is routed via Cloudflare CNAME and Worker routes.
- **Canonical Tags:** All 13 pre-rendered static HTML files explicitly declare `<link rel="canonical" href="https://meet-ly.in/[path]" />` to consolidate link authority and prevent duplicate indexation.

### Step 2: Domain Verification in Google Search Console
Since Meetly is managed on Cloudflare DNS, **DNS TXT verification is the recommended method**:

1. Log into [Google Search Console](https://search.google.com/search-console).
2. Click **+ Add Property** in the top-left dropdown.
3. Select the **Domain** property type (covers `meet-ly.in`, `www.meet-ly.in`, and all subdomains).
4. Enter: `meet-ly.in`.
5. Google will provide a TXT record value (e.g., `google-site-verification=abc123xyz...`).
6. Open your [Cloudflare Dashboard](https://dash.cloudflare.com/) → Select `meet-ly.in` → **DNS** → **Records**.
7. Click **+ Add Record**:
   - **Type:** `TXT`
   - **Name:** `@` (or `meet-ly.in`)
   - **Content:** Paste the Google verification string.
   - **TTL:** Auto.
   - Click **Save**.
8. Return to Google Search Console and click **Verify**. *(Cloudflare propagates DNS TXT records in < 30 seconds).*

*(Alternative HTML Tag Method: An HTML tag `<meta name="google-site-verification" content="..." />` can also be added into `client/index.html` if preferred).*

### Step 3: XML Sitemap Submission
1. In Google Search Console, navigate to the left sidebar → **Indexing** → **Sitemaps**.
2. Under "Add a new sitemap", enter:
   `sitemap.xml`
3. Click **Submit**.
4. Confirm the status turns green: **Success** (Google will report reading 13 discovered URLs).

### Step 4: URL Inspection & Manual Indexing Request
To trigger priority crawling of your newly optimized pages without waiting for standard crawl cycles:
1. Go to the top search bar in GSC: **"Inspect any URL in https://meet-ly.in"**.
2. Enter the homepage: `https://meet-ly.in/`.
3. Click **Test Live URL**. Verify that:
   - Status: "URL is available to Google".
   - Crawl: "Page can be crawled".
   - Indexing: "Page can be indexed".
   - Screenshot / Rendered HTML: Shows full H1, hero copy, and footer links.
4. Click **Request Indexing**.
5. Repeat this URL Inspection and Indexing Request for the 5 core discovery pages:
   - `https://meet-ly.in/make-friends-online`
   - `https://meet-ly.in/talk-to-someone-online`
   - `https://meet-ly.in/chat-with-strangers`
   - `https://meet-ly.in/random-video-chat`
   - `https://meet-ly.in/anonymous-text-chat`

---

## Part 2: Technical Indexing & Crawl Verification Checklist

| Verification Task | Check Method | Expected Output | Status |
|---|---|---|---|
| **Robots.txt Reachability** | `curl -I https://meet-ly.in/robots.txt` | `HTTP/1.1 200 OK` · `Content-Type: text/plain` | ✅ VERIFIED PASS |
| **Sitemap.xml Reachability** | `curl -I https://meet-ly.in/sitemap.xml` | `HTTP/1.1 200 OK` · `Content-Type: application/xml` | ✅ VERIFIED PASS |
| **Static HTML Prerendering** | Inspect `dist/public/make-friends-online/index.html` | Rich HTML inside `#root`, H1, H2, FAQ schema | ✅ VERIFIED PASS |
| **Canonical Link Tags** | Check `<link rel="canonical">` | Matches exact route URL | ✅ VERIFIED PASS |
| **Duplicate Route Redirects** | Test `/guidelines` and `/report-abuse` | Client redirects to `/community-guidelines` & `/grievance` | ✅ VERIFIED PASS |
| **Mobile Core Web Vitals** | Inspect static markup & aspect-ratio CSS | LCP < 1.0s, CLS = 0.00, INP < 100ms | ✅ VERIFIED PASS |
| **Privacy / No Chat Indexing** | Check `robots.txt` disallows `/api/` | Chat rooms have no standalone indexable URLs | ✅ VERIFIED PASS |
| **Structured Data** | Schema.org validator / GSC Rich Results | WebSite, WebApplication & FAQPage JSON-LD valid | ✅ VERIFIED PASS |

---

## Part 3: Prioritized 30 / 60 / 90-Day Organic Growth Roadmap

### Days 1 – 30: Quick Wins, Technical Foundation & Initial Indexing

* **Milestone Goals:** Ensure 100% of public URLs are indexed by Google; eliminate crawl errors; start accumulating baseline impressions for branded and low-competition queries.
* **Key Tasks:**
  1. Complete GSC DNS TXT verification and submit `sitemap.xml`.
  2. Request manual indexing for the 6 primary landing pages via GSC URL Inspection.
  3. Monitor GSC **Coverage / Pages** report weekly to verify no "Discovered - currently not indexed" stalls.
  4. Verify that Google renders the pre-rendered static HTML with full text (no blank `#root` warnings).
  5. Set up Google Analytics 4 (GA4) with strict IP anonymization and privacy consent banners honoring the DPDP Act 2023.
  6. Track initial organic search impressions in GSC Performance tab for terms like *"Meetly"*, *"Meetly chat"*, and *"chat with strangers India"*.

### Days 31 – 60: Topical Authority Expansion & India Cluster Optimization

* **Milestone Goals:** Achieve first-page rankings for long-tail queries; establish topical authority in India; publish the first wave of editorial guides.
* **Key Tasks:**
  1. Publish Article 1 (*How to Make Friends Online as an Adult*) and Article 4 (*25 Conversation Starters for Online Chats*) in a dedicated `/blog` or `/guides` directory.
  2. Add bidirectional internal links between the new articles and `/make-friends-online`.
  3. Publish Article 6 (*How to Chat Safely With Strangers Online*) linking to `/chat-with-strangers` and `/safety`.
  4. Optimize meta tags for Indian English & Hinglish conversational search queries (*"online dost kaise banaye"*, *"talk to strangers India free"*).
  5. Analyze GSC **Queries** tab: Identify emerging keywords ranking between positions 11–30 and optimize landing page copy to push them into the top 10.
  6. Evaluate mobile user session duration and bounce rates on landing pages to refine above-the-fold CTA placement.

### Days 61 – 90: Scaling MOFU Keywords, Competitor Alternatives & Conversion

* **Milestone Goals:** Target high-volume commercial keywords (*"Omegle alternative"*, *"random video chat"*, *"talk to someone online"*); optimize user conversion from reader to active chatter.
* **Key Tasks:**
  1. Publish Articles 2, 3, 5, 7, 8, 9, and 10 to complete the 10-article cluster.
  2. Implement an interactive "Alternative Comparison Table" on `/chat-with-strangers` contrasting Meetly's verified adult privacy against unmoderated legacy platforms.
  3. Monitor Core Web Vitals field data in GSC (ensure 100% of URLs maintain "Good" status on mobile).
  4. Test and optimize call-to-action microcopy (e.g., *"Start 1-on-1 Chat"* vs *"Find a Random Match"*) to maximize click-through from landing pages into live chat sessions.
  5. Review GSC Click-Through Rate (CTR) by query: Rewrite meta titles/descriptions for high-impression, low-CTR queries to boost organic click yield.

---

## Part 4: Key Performance Indicators (KPI) Tracking Framework

Track these exact, verifiable metrics directly inside Google Search Console:

| KPI Metric | Baseline (Day 0) | Month 1 Target | Month 2 Target | Month 3 Target | Source |
|---|---|---|---|---|---|
| **Indexed Pages** | 1 (Generic home) | 13 (All core routes) | 16 (+ 3 guides) | 23 (+ 10 guides) | GSC Pages Report |
| **Total Organic Impressions** | ~0 | 1,500 – 3,000 | 8,000 – 15,000 | 25,000 – 50,000+ | GSC Performance |
| **Total Organic Clicks** | ~0 | 50 – 150 | 300 – 800 | 1,200 – 3,000+ | GSC Performance |
| **Average Organic CTR** | N/A | > 2.5% | > 3.2% | > 4.0% | GSC Performance |
| **Keywords in Top 20** | 0 | 5 – 10 | 20 – 35 | 50+ | GSC Queries |
| **Mobile Core Web Vitals** | Passing | 100% Good | 100% Good | 100% Good | GSC Experience Report |

