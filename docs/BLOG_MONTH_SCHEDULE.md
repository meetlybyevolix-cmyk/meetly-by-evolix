# Meetly daily blog plan: 5 November–4 December 2026

The existing GitHub workflow `.github/workflows/daily-seo-blog.yml` is reused. No duplicate Codex timer was created. Its cron remains 03:30 UTC, equivalent to 09:00 Asia/Kolkata, with a date gate limiting automatic publication to 5 November through 4 December inclusive: 30 scheduled dates. GitHub may delay cron execution; 09:00 is the requested trigger time rather than a guaranteed publication instant.

All eight existing articles are preserved. A new 705-word article, **How to Find People With Similar Interests Online**, was authored and validated on 4 November. The next 30 unpublished topics have one date each in the month window. Scheduled jobs skip outside that window and when a published article already exists for the India date. An explicit manual `force` run can override those limits; automatic runs cannot. Concurrent workflow runs are serialized, and existing article slugs cannot be republished or overwritten.

## No API-key setup is required

The daily publisher now reads 30 distinct prepared posts from the three monthly-queue JSON files in content/editorial. It makes no generation API calls and does not read a Gemini key or model setting. The workflow no longer requests those secrets or variables. Existing published articles remain unchanged, and future articles stay unpublished until their scheduled date.

Posts contain direct answers, topic-specific examples, headings, takeaways and complete FAQs. They range from 459 to 523 words. Each article is checked against existing and earlier queued articles for substantial overlap before publication. Unsafe or incomplete content is still held for review; removing the API requirement did not disable those checks. Extending publication beyond this one-month window requires additional prepared content and an updated schedule, not an API subscription.

## Editorial checks for SEO, answer clarity and AI-search visibility

- Lead with a direct answer, then provide topic-specific examples, useful headings and complete FAQ answers. Link naturally to relevant product pages and existing guides. Do not target arbitrary keyword densities or add special AI markup.
- Preserve real publication/update dates and author attribution. Existing article rendering produces visible FAQs, BlogPosting schema, canonical URLs and the build sitemap. The workflow checks the built pages before committing.
- Reject substantially repeated five-word passages, duplicate slugs, unsafe embedded HTML and unsupported safety/performance/ranking claims. Keep the existing length/completeness checks as internal editorial rules, not Google ranking thresholds.
- Explain product limits accurately: Google sign-in is not age verification; matching depends on availability; video can start after matching and permissions; WebRTC can expose IP addresses; reports and uploaded images may be retained. Avoid fabricated statistics, citations, medical advice and helpline numbers.
- A missing prepared article or failed content check stops publication and preserves a review draft when available. No network-generated fallback or repeated generic template is silently published.

Google says normal useful-content and technical SEO practices remain relevant to AI features; it offers no special guaranteed AEO/GEO score or ranking mechanism. See [Google's AI-search guidance](https://developers.google.com/search/docs/appearance/ai-features) and [GitHub scheduled workflow timing](https://docs.github.com/en/actions/how-tos/troubleshoot-workflows).

## Operation

Schedule: `content/blog/publishing-schedule.json`. Topic dates: `content/blog/calendar.json`.

Check the current date gate with `node scripts/daily-blog-engine.js --schedule-check`. Test a reviewed article without writing content using `--force --dry-run --slug=TOPIC --article-file=PATH`. A successful non-dry run appends one new article, updates the calendar and source sitemap, and records the result. Never use `--force` for routine scheduled runs.

The job retains existing type checks, tests and production build, adds built SEO validation, and commits to `main` only after those checks pass. A hosting deployment is separate from a GitHub commit: verify Cloudflare's deployment status and the live article URL rather than assuming a successful push means the article is live.

Validation includes every queued article against all earlier content, a full month of publisher runs in an isolated fixture with network calls blocked and API-key variables absent, same-day rerun protection and automatic stop after 4 December. Existing published posts are compared unchanged. No production publication is performed by that simulation.

The prepared queue is intentionally separate from the public article store: it does not add 30 future articles to the website at once. Every queued post has at least 450 words, a direct opening answer, complete FAQs and topic-specific sections. The tests also check that every scheduled day has exactly one prepared article and that the posts do not substantially repeat each other.
