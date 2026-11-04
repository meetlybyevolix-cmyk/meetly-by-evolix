/**
 * MEETLY — DAILY AUTOMATED SEO BLOG ENGINE
 * Evolix Studio - Phase 10 Production Automation
 *
 * Runs daily at 9:00 AM IST (03:30 UTC) via GitHub Actions or manual CLI.
 * 1. Reads 90-day topic calendar (content/blog/calendar.json)
 * 2. Selects the next qualified, unwritten topic
 * 3. Reads topic-specific prepared editorial content
 * 4. Formats the next article without external APIs or credentials
 * 5. Runs strict multi-point quality gates (word count, keyword density, safety compliance, schema)
 * 6. Publishes qualified articles to content/blog/articles.json & regenerates sitemap.xml
 * 7. Records execution results to DAILY_BLOG_AUTOMATION_REPORT.md
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { indiaDate, publicationDecision, contentIssues } from "./blog-publishing-policy.mjs";
import { prepareBlogPost } from "./prepared-blog-post.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const calendarPath = path.join(rootDir, "content/blog/calendar.json");
const articlesPath = path.join(rootDir, "content/blog/articles.json");
const draftsDir = path.join(rootDir, "content/drafts");
const sitemapPath = path.join(rootDir, "client/public/sitemap.xml");
const reportPath = path.join(rootDir, "DAILY_BLOG_AUTOMATION_REPORT.md");

// CLI Flags
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isForce = args.includes("--force");
const targetSlugArg = args.find(a => a.startsWith("--slug="))?.split("=")[1];
const targetIdArg = args.find(a => a.startsWith("--topic-id="))?.split("=")[1];
const articleFile = args.find(a => a.startsWith("--article-file="))?.slice("--article-file=".length);

console.log(`[Blog Engine] Initializing daily run... (DryRun: ${isDryRun}, Force: ${isForce})`);

// 1. Emergency Pause Check
if (process.env.BLOG_AUTOMATION_PAUSED === "true") {
  console.log("[Blog Engine] Automation is paused via BLOG_AUTOMATION_PAUSED environment variable. Exiting.");
  process.exit(0);
}

// 2. Load Calendar and Existing Articles
if (!fs.existsSync(calendarPath) || !fs.existsSync(articlesPath)) {
  console.error("[Blog Engine] Fatal error: calendar.json or articles.json not found.");
  process.exit(1);
}

const calendar = JSON.parse(fs.readFileSync(calendarPath, "utf-8"));
const articles = JSON.parse(fs.readFileSync(articlesPath, "utf-8"));
const publishingSchedule = JSON.parse(fs.readFileSync(path.join(rootDir, "content/blog/publishing-schedule.json"), "utf8"));
const decision = publicationDecision(publishingSchedule, articles);
if (args.includes("--schedule-check")) {
  console.log(JSON.stringify(decision));
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `run_today=${decision.allowed}\n`);
  process.exit(0);
}
if (!decision.allowed && !isForce && !args.includes("--validate-queue")) {
  console.log(`[Blog Engine] ${decision.reason} (${decision.date}). No publication.`);
  process.exit(0);
}

if (args.includes("--validate-queue")) {
  const pending = calendar.filter(topic => topic.status === "scheduled" && topic.scheduledDate >= publishingSchedule.startDate && topic.scheduledDate <= publishingSchedule.endDate);
  const simulated = [...articles];
  for (const topic of pending) {
    const article = await generateArticle(topic);
    const result = runQualityGate(article, topic);
    const issues = [...new Set([...result.issues, ...contentIssues(article, simulated)])];
    if (issues.length) throw new Error(topic.slug + ": " + issues.join("; "));
    simulated.push(article);
    console.log("Prepared article validated: " + topic.slug + " (" + result.wordCount + " words)");
  }
  console.log("Validated " + pending.length + " prepared daily articles without API credentials.");
  process.exit(0);
}

// 3. Find Next Candidate Topic
const publishedSlugs = new Set(articles.map(a => a.slug));
let selectedTopic = null;

if (targetSlugArg) {
  selectedTopic = calendar.find(t => t.slug === targetSlugArg);
} else if (targetIdArg) {
  selectedTopic = calendar.find(t => t.id === parseInt(targetIdArg, 10));
} else {
  // Find the first topic whose status is 'scheduled' and slug not yet published
  selectedTopic = calendar.find(t => t.status === "scheduled" && t.scheduledDate <= indiaDate() && !publishedSlugs.has(t.slug));
}

if (!selectedTopic) {
  console.log("[Blog Engine] No scheduled topics pending publication in calendar. All topics are up to date!");
  process.exit(0);
}
if (publishedSlugs.has(selectedTopic.slug)) {
  throw new Error("This slug is already published. Existing posts are never overwritten or duplicated.");
}

console.log(`[Blog Engine] Selected Topic #${selectedTopic.id}: "${selectedTopic.title}" (Slug: ${selectedTopic.slug})`);

// 4. Load prepared editorial content. No network requests or API keys.
async function generateArticle(topic) {
  if (articleFile) return formatGeneratedOutput(topic, JSON.parse(fs.readFileSync(path.resolve(rootDir, articleFile), "utf8")));
  const editorialDir = path.join(rootDir, "content/editorial");
  const queue = fs.readdirSync(editorialDir).filter(file => /^monthly-queue(?:-\d+)?\.json$/.test(file)).flatMap(file => JSON.parse(fs.readFileSync(path.join(editorialDir, file), "utf8")));
  if (new Set(queue.map(entry => entry.slug)).size !== queue.length) throw new Error("Duplicate slugs in prepared article queue.");
  return formatGeneratedOutput(topic, prepareBlogPost(topic, queue.find(entry => entry.slug === topic.slug)));
}

function formatGeneratedOutput(topic, parsed) {
  return {
    slug: topic.slug,
    title: parsed.title || topic.title,
    seoTitle: parsed.seoTitle || `${topic.title} — Meetly`,
    description: parsed.description || `Practical guide on ${topic.primaryKeyword}. Discover safe ways to connect on Meetly.`,
    category: topic.category,
    readTime: parsed.readTime || "6 min read",
    publishedDate: indiaDate(),
    lastUpdated: indiaDate(),
    author: "Meetly Editorial Team",
    targetKeywords: [topic.primaryKeyword, ...topic.secondaryKeywords],
    searchIntent: topic.searchIntent || "Informational",
    keyTakeaways: parsed.keyTakeaways || [],
    contentHtml: parsed.contentHtml || "",
    faqs: parsed.faqs || [],
    relatedSlugs: ["how-to-make-friends-online-as-an-adult", "how-to-start-a-conversation-with-someone-new", "how-to-chat-safely-with-strangers-online"],
    isPublished: true,
  };
}

// 5. Multi-Point Quality Gate & Validation
function runQualityGate(article, topic) {
  const issues = contentIssues(article, articles);
  const plainText = (article.contentHtml || "").replace(/<[^>]+>/g, " ");
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;

  // Gate 1: Word Count
  if (wordCount < 450) {
    issues.push(`Word count too short: ${wordCount} words (minimum: 450)`);
  }

  // Gate 2: Primary Keyword Presence & Density
  const kwRegex = new RegExp(topic.primaryKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  const kwMatches = (article.contentHtml.match(kwRegex) || []).length;
  const kwDensity = (kwMatches / (wordCount || 1)) * 100;
  if (kwDensity > 3.0) {
    issues.push(`Keyword stuffing detected: ${kwDensity.toFixed(2)}% (maximum: 3.0%)`);
  }

  // Gate 3: Safety / Mental Health Compliance
  if (topic.category === "Wellbeing & Connection") {
    if (!/not (?:a |an )?(?:healthcare|therapy|medical)|not therapy/i.test(article.contentHtml)) {
      issues.push("Clarify that Meetly is not therapy or medical support.");
    }
  }

  // Gate 4: Completeness
  if (!article.description || article.description.length < 50) {
    issues.push("Meta description is missing or too short.");
  }
  if (!article.keyTakeaways || article.keyTakeaways.length < 2) {
    issues.push("Key takeaways missing or insufficient.");
  }

  return {
    passed: issues.length === 0,
    wordCount,
    kwMatches,
    kwDensity: `${kwDensity.toFixed(2)}%`,
    issues,
  };
}

// 6. Execution Controller
async function run() {
  const candidateArticle = await generateArticle(selectedTopic);
  const gateResult = runQualityGate(candidateArticle, selectedTopic);

  console.log(`[Blog Engine] Quality Gate Result: Passed = ${gateResult.passed} (${gateResult.wordCount} words, Keyword Density: ${gateResult.kwDensity})`);

  if (!gateResult.passed) {
    if (isDryRun) {
      console.error("[Blog Engine] Dry-run quality rejection:", gateResult.issues.join("; "));
      process.exitCode = 1;
      return;
    }
    console.warn("[Blog Engine] Quality Gate FAILED. Saving as draft for editorial review.");
    if (!fs.existsSync(draftsDir)) {
      fs.mkdirSync(draftsDir, { recursive: true });
    }
    const draftPath = path.join(draftsDir, `${selectedTopic.slug}.json`);
    fs.writeFileSync(draftPath, JSON.stringify({ ...candidateArticle, gateResult }, null, 2), "utf-8");

    recordReport({
      status: "REJECTED_DRAFT",
      topic: selectedTopic,
      wordCount: gateResult.wordCount,
      reasons: gateResult.issues,
    });
    process.exitCode = 1;
    return;
  }

  if (isDryRun) {
    console.log("[Blog Engine] DRY RUN MODE: Article generated and validated successfully! (No files committed)");
    console.log(`[Blog Engine] Preview: "${candidateArticle.title}" (${gateResult.wordCount} words)`);
    return;
  }

  // 7. Publish to Articles Store
  articles.push(candidateArticle);
  fs.writeFileSync(articlesPath, JSON.stringify(articles, null, 2), "utf-8");
  console.log(`[Blog Engine] Successfully written to content/blog/articles.json`);

  // 8. Update Calendar Topic Status
  const calIdx = calendar.findIndex(t => t.id === selectedTopic.id);
  if (calIdx !== -1) {
    calendar[calIdx].status = "published";
    fs.writeFileSync(calendarPath, JSON.stringify(calendar, null, 2), "utf-8");
  }

  // 9. Update XML Sitemap
  updateSitemap(candidateArticle);

  // 10. Record Report
  recordReport({
    status: "PUBLISHED",
    topic: selectedTopic,
    wordCount: gateResult.wordCount,
    slug: candidateArticle.slug,
  });

  console.log(`[Blog Engine] Publication of "${candidateArticle.title}" complete! Ready for deployment.`);
}

function updateSitemap(newArticle) {
  try {
    if (!fs.existsSync(sitemapPath)) return;
    let sitemap = fs.readFileSync(sitemapPath, "utf-8");
    const today = indiaDate();

    const newUrlEntry = `  <url>\n    <loc>https://meet-ly.in/blog/${newArticle.slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;

    if (!sitemap.includes(`/blog/${newArticle.slug}`)) {
      sitemap = sitemap.replace("</urlset>", `${newUrlEntry}</urlset>`);
      fs.writeFileSync(sitemapPath, sitemap, "utf-8");
      console.log(`[Blog Engine] Added https://meet-ly.in/blog/${newArticle.slug} to client/public/sitemap.xml`);
    }
  } catch (err) {
    console.warn("[Blog Engine] Sitemap update warning:", err.message);
  }
}

function recordReport(entry) {
  try {
    const timestamp = new Date().toISOString();
    const logLine = `\n### [${timestamp}] Run Status: **${entry.status}**\n- **Topic #${entry.topic.id}:** ${entry.topic.title}\n- **Slug:** \`${entry.topic.slug}\`\n- **Category:** ${entry.topic.category}\n- **Word Count:** ${entry.wordCount}\n${entry.reasons ? `- **Rejection Reasons:** ${entry.reasons.join("; ")}\n` : "- **Result:** Successfully published to content repository and sitemap.\n"}`;

    if (!fs.existsSync(reportPath)) {
      fs.writeFileSync(reportPath, `# MEETLY — DAILY BLOG AUTOMATION LOG\n${logLine}`, "utf-8");
    } else {
      fs.appendFileSync(reportPath, logLine, "utf-8");
    }
  } catch (err) {
    console.warn("[Blog Engine] Could not write report log:", err.message);
  }
}

run().catch(err => {
  console.error("[Blog Engine] Unhandled execution error:", err);
  process.exit(1);
});
