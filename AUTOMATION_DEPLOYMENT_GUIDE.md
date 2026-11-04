# Meetly daily blog publishing

The existing GitHub workflow runs at **09:00 Asia/Kolkata**, with automatic publication limited to **5 November–4 December 2026**. It publishes one prepared article per day and preserves existing posts. **No external AI API or API key is required.**

Content lives in the three monthly-queue JSON files under content/editorial. The publisher stamps actual publication dates, updates articles and the sitemap, and runs quality checks before the workflow commits to main. Future content is not added to the public blog early.

See [the complete schedule and editorial checks](docs/BLOG_MONTH_SCHEDULE.md). Validate locally with these commands:

- node scripts/daily-blog-engine.js --validate-queue
- node scripts/check-keyless-publishing.mjs
- pnpm check
- pnpm test
- pnpm build
- node scripts/check-seo.js

The existing BLOG_AUTOMATION_PAUSED repository variable still pauses publishing. Manual workflow runs support dry-run, force and topic selection; routine scheduled jobs never force extra posts. Rejected content is held for review. A hosting deployment remains separate from a GitHub commit and must be verified in Cloudflare. GitHub may delay scheduled runs, so 09:00 is a trigger time rather than a guaranteed publication instant.
