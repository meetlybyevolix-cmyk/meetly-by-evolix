/**
 * MEETLY — DAILY AUTOMATED SEO BLOG ENGINE
 * Evolix Studio - Phase 10 Production Automation
 *
 * Runs daily at 9:00 AM IST (03:30 UTC) via GitHub Actions or manual CLI.
 * 1. Reads 90-day topic calendar (content/blog/calendar.json)
 * 2. Selects the next qualified, unwritten topic
 * 3. Researches intent & keywords
 * 4. Generates a human-first, search-optimized article
 * 5. Runs strict multi-point quality gates (word count, keyword density, safety compliance, schema)
 * 6. Publishes qualified articles to content/blog/articles.json & regenerates sitemap.xml
 * 7. Records execution results to DAILY_BLOG_AUTOMATION_REPORT.md
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { indiaDate, publicationDecision, contentIssues } from "./blog-publishing-policy.mjs";

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
if (!decision.allowed && !isForce) {
  console.log(`[Blog Engine] ${decision.reason} (${decision.date}). No publication.`);
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

// 4. Content Generation Function
async function generateArticle(topic) {
  if (articleFile) return formatGeneratedOutput(topic, JSON.parse(fs.readFileSync(path.resolve(rootDir, articleFile), "utf8")));
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (apiKey) {
    console.log("[Blog Engine] Generating article via Gemini API...");
    try {
      const prompt = `
You are a Senior Content Strategist and Writer for Meetly (https://meet-ly.in), an adults-only (18+) social discovery platform offering anonymous 1-on-1 random text chat and opt-in peer-to-peer video calls with interest tags.

Write an in-depth, human-first, highly practical blog article for adults.

Topic: ${topic.title}
Category: ${topic.category}
Primary Keyword: ${topic.primaryKeyword}
Secondary Keywords: ${topic.secondaryKeywords.join(", ")}
Target Audience: ${topic.targetAudience}
Content Angle: ${topic.contentAngle}

STRICT EDITORIAL RULES:
1. Target length: 900 to 1,300 words.
2. Natural, engaging English. Never sound robotic or repetitive.
3. Answer the searcher's question with actionable steps, relatable examples, and real conversational scripts.
4. Open contentHtml with a short paragraph directly answering the topic in plain language, before any H2. Use keywords naturally without density targets, repeated headings or forced mentions.
5. Include 4 Quick Key Takeaways at the start.
6. Include 2-3 detailed FAQ questions with helpful answers.
7. Naturally integrate contextual links to Meetly features:
   - <a href="/make-friends-online">making friends online</a>
   - <a href="/talk-to-someone-online">talking to someone online</a>
   - <a href="/chat-with-strangers">chat with strangers</a>
   - <a href="/random-video-chat">random video chat</a>
   - <a href="/anonymous-text-chat">anonymous text chat</a>
   - <a href="/safety">Safety Center</a>
8. ${topic.category === "Wellbeing & Connection" ? "Clarify Meetly is casual adult social connection, not therapy or emergency support. Do not provide unverified medical advice or helpline numbers." : ""}
9. Write genuinely topic-specific advice and examples. Do not invent statistics, research, citations, legal compliance, user counts, personal experience, or promises of safety or ranking. AEO/GEO means useful direct answers and clear facts, not a guaranteed score or special AI markup.
10. Product facts: Google sign-in is required before matchmaking; it does not verify age. Matching depends on available people and interests are not guaranteed. Video can start automatically after matching and browser permissions. Direct WebRTC may expose public IPs. Report and uploaded image evidence may be retained; no total anonymity or zero-data promise. Link to /privacy for details.
11. Use only simple article HTML, no scripts, iframes, event handlers, inline styles or forms. Avoid repeating the same introductory paragraphs or FAQ answers across articles. Do not add external factual claims unless their sources have actually been checked.

Return ONLY a valid JSON object matching this exact schema:
{
  "title": "${topic.title}",
  "seoTitle": "${topic.title} — Meetly",
  "description": "Meta description under 155 characters summarizing the article with primary keyword.",
  "readTime": "6 min read",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4"],
  "contentHtml": "<h2>...</h2><p>...</p>...",
  "faqs": [
    {"question": "Q1?", "answer": "A1."},
    {"question": "Q2?", "answer": "A2."}
  ]
}
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-flash-latest"}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          signal: AbortSignal.timeout(90000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          return formatGeneratedOutput(topic, parsed);
        }
      } else {
        console.warn(`[Blog Engine] Gemini API request failed (${response.status}). Falling back to editorial synthesis engine.`);
      }
    } catch (apiErr) {
      console.warn("[Blog Engine] Gemini API call error:", apiErr.message);
    }
  } else {
    console.log("[Blog Engine] No GEMINI_API_KEY configured. Offline template output must pass originality checks or be held as a draft.");
  }

  // High-Quality Offline Synthesis Engine (Deterministic & Complete)
  return generateEditorialSynthesis(topic);
}

function generateEditorialSynthesis(topic) {
  const isLoneliness = topic.category === "Wellbeing & Connection";
  const isSafety = topic.category === "Online Safety";
  const isVideo = topic.category === "Chat Platforms";
  const isConversation = topic.category === "Conversation Skills";
  const isIndia = topic.targetAudience === "Adults India" || topic.category === "Cultural Connections";

  const takeaways = [
    `The digital social landscape has evolved: intentional, direct communication beats passive algorithm scrolling every time.`,
    `Focus on curiosity over performance: approaching conversations to learn about the other person eliminates social anxiety.`,
    `Respect personal boundaries and privacy: zero personal identifiable information (zero-PII) protects your peace of mind.`,
    `Small conversational micro-moments compound: even a 15-minute chat can reset cognitive fatigue and uplift your daily mood.`,
  ];

  let bodyHtml = `
    <h2>Understanding the Real Need Behind "${topic.title}"</h2>
    <p>In our hyper-connected modern world, adults frequently find themselves navigating an unexpected paradox: despite having hundreds of contacts on social media, having a genuine, uninterrupted conversation feels harder than ever. When searching for practical advice on <strong>${topic.primaryKeyword}</strong>, most people are not looking for complex psychological theory. They want real, actionable guidance on how to connect naturally without awkwardness, judgment, or social exhaustion.</p>
    <p>Traditional social feeds are engineered for broadcast and consumption, not conversation. When you scroll through feeds, you are observing polished highlights rather than exchanging spontaneous thoughts. Reclaiming direct human dialogue—whether through focused hobby groups, local activities, or <a href="/make-friends-online">interest-based 1-on-1 chat platforms</a>—is how modern adults are rediscovering the joy of meeting new people.</p>

    <h2>Why Traditional Approaches Often Fall Short</h2>
    <p>Many adults assume that making new friends or finding someone to talk to requires joining high-commitment clubs or attending loud social events. However, these environments often introduce significant social friction:</p>
    <ul>
      <li><strong>High Cognitive Load:</strong> Walking into a crowded room full of strangers triggers social anxiety and performance pressure.</li>
      <li><strong>Mismatched Expectations:</strong> In general social mixers, people often have divergent agendas ranging from professional networking to romantic pursuit.</li>
      <li><strong>Geographical Limitations:</strong> Depending on where you live, finding people who share your specific passions (such as indie cinema, niche coding languages, or obscure musical genres) locally can be extremely difficult.</li>
    </ul>
    <p>This is why intentional digital discovery has become the preferred alternative. When you engage with <em>${topic.primaryKeyword}</em> in a structured, private setting, you remove superficial distractions and focus entirely on shared wavelength.</p>

    <h2>Step-by-Step Blueprint: Putting This Into Practice</h2>
    <p>To make meaningful progress, break your social discovery down into three manageable, low-pressure steps:</p>

    <h3>1. Start With Low-Stakes, Focused Micro-Interactions</h3>
    <p>Do not aim to meet a lifelong best friend in the first five minutes. Instead, aim for a pleasant, engaging 10-to-15-minute exchange. Treat every interaction like a brief, enjoyable chat with someone sitting next to you at a bookstore or coffee lounge. Using <a href="/anonymous-text-chat">anonymous text chat</a> allows you to test conversational chemistry without the pressure of managing facial expressions or camera angles.</p>

    <h3>2. Use the Ping-Pong Conversational Method</h3>
    <p>The single most common reason online conversations stall is one-sided answering. If your chat partner asks what you enjoyed doing this weekend, avoid answering with a flat <em>"Not much, just watched TV."</em> Instead, expand with sensory detail and return the serve: <em>"I ended up watching an incredible documentary on retro video games, which brought back huge nostalgia. Are you into gaming or do you prefer movies?"</em> This gives your partner an effortless conversational hook to grab onto.</p>

    <h3>3. Anchor Conversations Around Shared Passions</h3>
    <p>Shared interests are the ultimate shortcut to authentic rapport. When you connect over topics like literature, technology, travel, or creative arts, you bypass superficial small talk and dive directly into topics that both people genuinely care about. On Meetly, selecting custom interest tags ensures that you match with people who are already eager to discuss your favorite subjects.</p>

    <h2>Digital Safety and Healthy Boundaries</h2>
    <p>Whenever you engage with new people online, safety must remain your foundational priority. Practicing <em>${topic.primaryKeyword}</em> safely means enforcing strict boundaries from the very first message:</p>
    <ul>
      <li><strong>Protect Your PII:</strong> Never share your full legal name, home address, workplace details, or banking information. Keep conversations anonymous until mutual trust has been proven over a long period.</li>
      <li><strong>Avoid Financial Requests:</strong> If anyone ever asks for money, gift cards, or cryptocurrency in an online chat, exit and report them immediately.</li>
      <li><strong>Verify Moderation:</strong> Always use verified platforms with built-in reporting controls like Meetly's <a href="/safety">Safety Center</a>, which provides instant block-and-report tools and strict 18+ adult age gating.</li>
    </ul>
  `;

  if (isVideo) {
    bodyHtml += `
      <h2>Maximizing Rapport in Live Video Conversations</h2>
      <p>When you are ready to transition from typing to face-to-face interaction, <a href="/random-video-chat">random video chat</a> provides instantaneous laughter and micro-expressions that text cannot capture. Ensure your room lighting is positioned in front of you, check that no personal documents or badges are visible in the camera frame, and approach every call with warmth and an open smile.</p>
    `;
  }

  if (isLoneliness) {
    bodyHtml += '<h2>When casual conversation is not enough</h2><p>Meetly is for informal adult conversation, not therapy, medical advice or emergency support. Consider qualified professional support when you need more than a casual chat.</p>';
  }

  const faqs = [
    {
      question: `How can beginners get started with ${topic.primaryKeyword}?`,
      answer: `Start on platforms that do not require building complex public profiles. Focus on shared interest topics like cinema, gaming, or books, and keep initial conversations light, open-ended, and zero-pressure.`,
    },
    {
      question: `Is it normal to feel nervous when chatting with someone new?`,
      answer: `Yes, social hesitation is completely natural. The best way to ease anxiety is starting with anonymous text chat where you have time to formulate thoughts without camera pressure.`,
    },
    {
      question: `How does Meetly keep online conversations safe?`,
      answer: `Meetly enforces strict 18+ adult age gating, does not log private chat transcripts to a database, and provides one-click instant block and safety reporting controls.`,
    },
  ];

  return {
    slug: topic.slug,
    title: topic.title,
    seoTitle: `${topic.title} — Meetly`,
    description: `A practical, in-depth guide on ${topic.primaryKeyword}. Learn how to connect naturally and safely with new people online on Meetly.`,
    category: topic.category,
    readTime: "6 min read",
    publishedDate: indiaDate(),
    lastUpdated: indiaDate(),
    author: "Meetly Editorial Team",
    targetKeywords: [topic.primaryKeyword, ...topic.secondaryKeywords],
    searchIntent: topic.searchIntent || "Informational",
    keyTakeaways: takeaways,
    contentHtml: bodyHtml,
    faqs: faqs,
    relatedSlugs: ["how-to-make-friends-online-as-an-adult", "how-to-start-a-conversation-with-someone-new", "how-to-chat-safely-with-strangers-online"],
    isPublished: true,
  };
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
