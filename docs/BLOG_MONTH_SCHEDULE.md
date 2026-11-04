# Meetly daily blog plan: 5 November–4 December 2026

The existing GitHub workflow `.github/workflows/daily-seo-blog.yml` is reused. No duplicate Codex timer was created. Its cron remains 03:30 UTC, equivalent to 09:00 Asia/Kolkata, with a date gate limiting automatic publication to 5 November through 4 December inclusive: 30 scheduled dates. GitHub may delay cron execution; 09:00 is the requested trigger time rather than a guaranteed publication instant.

All eight existing articles are preserved. A new 705-word article, **How to Find People With Similar Interests Online**, was authored and validated on 4 November. The next 30 unpublished topics have one date each in the month window. Scheduled jobs skip outside that window and when a published article already exists for the India date. An explicit manual `force` run can override those limits; automatic runs cannot. Concurrent workflow runs are serialized, and existing article slugs cannot be republished or overwritten.

## Generation setup still required

Read-only inspection confirmed the GitHub workflow is active but **GEMINI_API_KEY is not configured** in this repository. Add that key under the repository's **Settings → Secrets and variables → Actions → New repository secret**, named `GEMINI_API_KEY`. Do not paste the key into chat or source files. An optional Actions variable `GEMINI_MODEL` can override the documented `gemini-flash-latest` alias. API access and billing/quota depend on the operator's Google account.

Without that secret or a supplied reviewed article file, the legacy offline template is evaluated as a draft. It will not be silently published when it repeats old posts or lacks a direct answer. Rejected drafts are uploaded as a GitHub Actions artifact and the run fails visibly. The schedule is configured, but fresh daily AI-written publication requires the missing secret and passing checks. No score gains or daily publication success are guaranteed.

## Editorial checks for SEO, answer clarity and AI-search visibility

- Lead with a direct answer, then provide topic-specific examples, useful headings and complete FAQ answers. Link naturally to relevant product pages and existing guides. Do not target arbitrary keyword densities or add special AI markup.
- Preserve real publication/update dates and author attribution. Existing article rendering produces visible FAQs, BlogPosting schema, canonical URLs and the build sitemap. The workflow checks the built pages before committing.
- Reject substantially repeated five-word passages, duplicate slugs, unsafe embedded HTML and unsupported safety/performance/ranking claims. Keep the existing length/completeness checks as internal editorial rules, not Google ranking thresholds.
- Explain product limits accurately: Google sign-in is not age verification; matching depends on availability; video can start after matching and permissions; WebRTC can expose IP addresses; reports and uploaded images may be retained. Avoid fabricated statistics, citations, medical advice and helpline numbers.
- API errors, missing credentials and content-quality failures do not justify publishing repeated filler. The owner can review the saved draft and retry with a reviewed article or working API configuration.

Google says normal useful-content and technical SEO practices remain relevant to AI features; it offers no special guaranteed AEO/GEO score or ranking mechanism. See [Google's AI-search guidance](https://developers.google.com/search/docs/appearance/ai-features) and [GitHub scheduled workflow timing](https://docs.github.com/en/actions/how-tos/troubleshoot-workflows).

## Operation

Schedule: `content/blog/publishing-schedule.json`. Topic dates: `content/blog/calendar.json`.

Check the current date gate with `node scripts/daily-blog-engine.js --schedule-check`. Test a reviewed article without writing content using `--force --dry-run --slug=TOPIC --article-file=PATH`. A successful non-dry run appends one new article, updates the calendar and source sitemap, and records the result. Never use `--force` for routine scheduled runs.

The job retains existing type checks, tests and production build, adds built SEO validation, and commits to `main` only after those checks pass. A hosting deployment is separate from a GitHub commit: verify Cloudflare's deployment status and the live article URL rather than assuming a successful push means the article is live.

Validation completed: 173 tests across 14 files, TypeScript, production build, SEO checks for 24 public pages, workflow YAML parsing, schedule boundary/daily-limit tests and a missing-key dry-run rejection with no content side effects. All eight pre-existing articles were compared with their committed versions and remain identical. Real Gemini generation was not tested because the repository has no API key.
