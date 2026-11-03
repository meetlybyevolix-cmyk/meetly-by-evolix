# MEETLY — BLOG SEO TECHNICAL IMPLEMENTATION & ARCHITECTURE

**Platform:** https://meet-ly.in/  
**Maintained by:** Evolix Studio  
**System:** Data-Driven SEO Blog & Automated Daily Publishing Engine  
**Release Version:** Phase 10 Production  
**Document Date:** November 2, 2026  

---

## 1. System Architecture Overview

The Meetly blog system is built on a headless, decoupled content architecture that integrates seamlessly with Meetly's React 19 / Vite 7 single-page application and static prerendering pipeline:

```
┌───────────────────────────┐      ┌───────────────────────────┐
│   content/blog/           │      │   content/blog/           │
│   calendar.json           │      │   articles.json           │
│   (90-Day Topic Queue)    │      │   (Published Articles)    │
└─────────────┬─────────────┘      └─────────────┬─────────────┘
              │                                  │
              ▼                                  ▼
┌───────────────────────────┐      ┌───────────────────────────┐
│ scripts/                  │      │ client/src/lib/           │
│ daily-blog-engine.js      │      │ blogArticles.ts           │
│ (Quality Gates & Builder) │      │ (Typed Content Accessor)  │
└─────────────┬─────────────┘      └─────────────┬─────────────┘
              │                                  │
              ▼                                  ▼
┌───────────────────────────┐      ┌───────────────────────────┐
│ client/public/sitemap.xml │      │ client/src/pages/blog/    │
│ (Regenerated Automatically│      │ BlogPost.tsx & BlogIndex  │
│ with Canonical URLs)      │      │ (Universal Dynamic Route) │
└─────────────┬─────────────┘      └─────────────┬─────────────┘
              │                                  │
              └──────────────────┬───────────────┘
                                 │
                                 ▼
                   ┌───────────────────────────┐
                   │ scripts/prerender-seo.js  │
                   │ (Static HTML Generator    │
                   │ for 100% Crawlability)    │
                   └───────────────────────────┘
```

---

## 2. Dynamic Frontend Routing

### Universal Article Renderer: [`BlogPost.tsx`](file:///d:/meetly/client/src/pages/blog/BlogPost.tsx)
Instead of requiring manual React JSX components for each blog post, Meetly uses a universal, high-performance article viewer mounted at:
```tsx
<Route path="/blog/:slug" component={BlogPost} />
```
- **Slug Resolution:** Matches `params.slug` against [`getAllPublishedArticles()`](file:///d:/meetly/client/src/lib/blogArticles.ts).
- **Graceful 404:** Unmatched slugs render an accessible "Guide Not Found" page with a return button to `/blog`.
- **Dynamic SEO Injection:** Automatically updates document title, description, canonical link, Open Graph tags, and JSON-LD structured data.

### Editorial Blog Hub: [`BlogIndex.tsx`](file:///d:/meetly/client/src/pages/blog/BlogIndex.tsx)
Mounted at `https://meet-ly.in/blog`:
- **Real-Time Search:** Client-side search across titles and descriptions.
- **Category Filter:** Filter by Friendship Advice, Wellbeing & Connection, Conversation Skills, Online Safety, Chat Platforms, and Cultural Connections.
- **Reading Time & Metadata:** Displays author attribution, read time, and publish dates.
- **Conversion CTA:** Inline banners inviting readers to test their conversational skills on Meetly.

---

## 3. On-Page SEO & Structured Data

Each blog post renders comprehensive, valid Schema.org structured data via [`SEOHead.tsx`](file:///d:/meetly/client/src/components/SEOHead.tsx):

### 3.1 `BlogPosting` Schema
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "@id": "https://meet-ly.in/blog/<slug>#article",
  "headline": "<Article Title>",
  "description": "<Meta Description under 160 chars>",
  "url": "https://meet-ly.in/blog/<slug>",
  "datePublished": "2026-11-02T00:00:00+05:30",
  "dateModified": "2026-11-02T13:00:00+05:30",
  "inLanguage": "en-US",
  "publisher": {
    "@type": "Organization",
    "name": "Meetly by Evolix Studio",
    "url": "https://meet-ly.in/",
    "logo": {
      "@type": "ImageObject",
      "url": "https://meet-ly.in/meetly-mark.svg"
    }
  },
  "author": {
    "@type": "Organization",
    "name": "Meetly Editorial Team",
    "url": "https://meet-ly.in/"
  }
}
```

### 3.2 `BreadcrumbList` Schema
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://meet-ly.in/" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://meet-ly.in/blog" },
    { "@type": "ListItem", "position": 3, "name": "<Article Title>", "item": "https://meet-ly.in/blog/<slug>" }
  ]
}
```

### 3.3 `FAQPage` Schema
Automatically rendered whenever an article defines a `faqs` array, enabling Google Rich Snippet question dropdowns in SERP results.

---

## 4. Static HTML Prerendering for Crawlers

During the build pipeline (`pnpm run build`), [`scripts/prerender-seo.js`](file:///d:/meetly/scripts/prerender-seo.js) runs automatically:
1. Dynamically loads `content/blog/articles.json`.
2. Generates dedicated directory structures in `dist/public/blog/[slug]/index.html`.
3. Injects complete pre-rendered semantic HTML (H1, H2, H3, paragraphs, key takeaways, FAQs, internal links) inside `<div id="root">`.
4. Replaces meta titles, canonical URLs, and schema tags.

**Benefit:** Googlebot, Bingbot, and social crawlers receive 100% complete, readable HTML on the first HTTP GET request without waiting for client-side JavaScript execution.

---

## 5. Automated Internal Linking Mesh

To build a strong page authority flow, every article automatically generates internal links:
1. **Contextual Product Links:** In-body links pointing to Meetly feature landing pages:
   - `/make-friends-online`
   - `/talk-to-someone-online`
   - `/chat-with-strangers`
   - `/random-video-chat`
   - `/anonymous-text-chat`
   - `/safety`
2. **Related Article Links:** [`getRelatedArticles()`](file:///d:/meetly/client/src/lib/blogArticles.ts) automatically resolves 3 contextually relevant articles using explicit related slugs or category clustering.
3. **Hub & Breadcrumb Links:** Every article links back to `/blog` and `/`.

---

## 6. Multi-Point Quality Gate & Safety Filters

The automated generation script ([`scripts/daily-blog-engine.js`](file:///d:/meetly/scripts/daily-blog-engine.js)) runs four mandatory checks before any article can be published:
- **Gate 1 (Length):** Content must exceed 450 words (typically 600–1,200 words).
- **Gate 2 (Keyword Density):** Primary keyword density is strictly bounded between 0.3% and 2.5% to avoid over-optimization penalties.
- **Gate 3 (Mental Health Safety):** Any topic in the "Wellbeing & Connection" category must include the verified 24/7 crisis helpline directory (Tele-MANAS: 14416, KIRAN: 1800-599-0019) and a non-medical disclaimer.
- **Gate 4 (Completeness):** Validates the presence of title, description, key takeaways, and FAQs.

Articles failing any gate are quarantined into `content/drafts/<slug>.json` for human editorial review and logged in `DAILY_BLOG_AUTOMATION_REPORT.md`.

