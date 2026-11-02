/**
 * Meetly Static SEO Prerenderer
 * Evolix Studio - Phase 6 Technical SEO
 *
 * Generates crawlable, static HTML files with custom meta tags, canonical URLs,
 * Open Graph / Twitter cards, JSON-LD structured data, and semantic readable content
 * for all public routes. Guarantees 100% indexability by Googlebot without relying
 * on client-side JavaScript execution.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist/public");
const baseTemplatePath = path.join(distDir, "index.html");

if (!fs.existsSync(baseTemplatePath)) {
  console.error("[Prerender] Error: dist/public/index.html does not exist. Run vite build first.");
  process.exit(1);
}

const baseTemplate = fs.readFileSync(baseTemplatePath, "utf-8");

const PAGES = [
  {
    route: "",
    title: "Meetly – Make New Friends Online | Text & Video Chat",
    description: "Meet new people through random text and video conversations on Meetly. Connect with adults worldwide, explore shared interests, and start chatting.",
    canonical: "https://meet-ly.in/",
    h1: "Meet New People. Start Real Conversations.",
    content: `
      <section>
        <h2>Connect With Real People Worldwide</h2>
        <p>Want to make a new friend or simply have someone to talk to? Meetly helps adults connect with new people through random text and video conversations. 100% private with no public profiles.</p>
        <p>Choose your vibe with interest tags, connect one-on-one, and chat freely without tracking or public scrutiny. Available for adults 18+ worldwide and across India.</p>
        <ul>
          <li><strong>Text &amp; Video Mode:</strong> Choose casual typing or mutual opt-in peer-to-peer WebRTC video.</li>
          <li><strong>No Public Profiles:</strong> Your email and real identity remain private in every conversation.</li>
          <li><strong>Community Safety:</strong> Verified 18+ adult community with zero tolerance for harassment or unsolicited explicit content.</li>
        </ul>
      </section>
    `,
  },
  {
    route: "make-friends-online",
    title: "How to Make Friends Online as an Adult | Free & Safe — Meetly",
    description: "Learn how to make genuine friends online as an adult. Connect with people worldwide over shared interests in private, safe, 1-on-1 random text and video chats.",
    canonical: "https://meet-ly.in/make-friends-online",
    h1: "Make New Friends Online Through Real Conversations",
    content: `
      <section>
        <h2>Why Making Friends as an Adult Feels Hard (And How to Fix It)</h2>
        <p>Between busy work schedules, relocations, and daily responsibilities, traditional ways of making friends often fade after college. Meetly lets you connect one-on-one with verified adults worldwide based on shared passions and mutual respect.</p>
        <h2>How Meetly Works in 3 Simple Steps</h2>
        <ol>
          <li><strong>Choose Your Interests:</strong> Tag topics like music, cinema, tech, books, sports, or creative writing.</li>
          <li><strong>Select Your Mode:</strong> Choose low-pressure text chat or opt-in peer-to-peer video calls.</li>
          <li><strong>Talk Freely:</strong> Connect with zero expectations. If the vibe isn't right, skip to the next person anytime.</li>
        </ol>
      </section>
    `,
    faq: [
      { q: "How can I make real friends online safely?", a: "Start on platforms with verified adult communities like Meetly that do not require exposing personal social media profiles or phone numbers. Select shared interest tags to connect with people who share your vibe." },
      { q: "Is it normal to make friends online as an adult?", a: "Yes, millions of adults find it difficult to make new friends after university or relocation. Online social discovery platforms provide a welcoming space to meet people outside your daily routine." },
      { q: "Does Meetly store my conversations or contact details?", a: "No. Meetly operates under privacy-by-design principles compliant with India's DPDP Act 2023. Text conversations are never logged to a database, and video calls are direct peer-to-peer WebRTC connections." }
    ]
  },
  {
    route: "talk-to-someone-online",
    title: "Talk to Someone Online | Safe & Casual Conversations — Meetly",
    description: "Looking for someone to talk to right now? Connect with friendly adults worldwide for casual, zero-pressure text or video conversations on Meetly.",
    canonical: "https://meet-ly.in/talk-to-someone-online",
    h1: "Want Someone to Talk To? Start a Real Conversation",
    content: `
      <section>
        <h2>Why Casual Conversations Matter When You Feel Disconnected</h2>
        <p>Sometimes you just need to talk about your day, share a thought, or have a relaxed chat with someone new. Meetly gives you a safe, welcoming space to connect one-on-one with verified adults.</p>
        <p><strong>Note on Community Scope:</strong> Meetly provides informal social discovery. We are not a medical service or crisis helpline. For acute mental health support in India, please contact Tele-MANAS at 14416 or KIRAN at 1800-599-0019.</p>
      </section>
    `,
    faq: [
      { q: "Can I talk to someone online right now without downloading an app?", a: "Yes. Meetly works directly in any desktop or mobile browser. Simply complete a quick Google 18+ verification and you can begin chatting 1-on-1 immediately." },
      { q: "Is Meetly a therapy or crisis helpline?", a: "No. Meetly is a social discovery platform for casual, informal human conversations between adults. If you need professional support, please contact dedicated free helplines." }
    ]
  },
  {
    route: "chat-with-strangers",
    title: "Chat with Strangers Online | Safe Anonymous Random Chat — Meetly",
    description: "Chat with strangers safely on Meetly. Connect with random adults worldwide via text or video. 18+ verified, private, and free modern Omegle alternative.",
    canonical: "https://meet-ly.in/chat-with-strangers",
    h1: "Chat with Strangers Online — Safely & Anonymously",
    content: `
      <section>
        <h2>A Modern, Safer Alternative to Traditional Random Chat</h2>
        <p>Experience the thrill of meeting someone completely new. Meetly reimagines random online chatting for adults with real safety controls, shared interest matching, and zero public profiles.</p>
        <h2>Why Choose Meetly to Chat with Strangers?</h2>
        <ul>
          <li><strong>100% Anonymous Identity:</strong> Your real name, email, and social handles are never displayed.</li>
          <li><strong>Topic &amp; Interest Matching:</strong> Tag topics to avoid awkward silences and find common ground.</li>
          <li><strong>Instant Skip &amp; Block:</strong> Complete control over every interaction with one-click Skip and Report tools.</li>
        </ul>
      </section>
    `,
    faq: [
      { q: "Is it safe to chat with strangers on Meetly?", a: "Yes. Meetly enforces an adults-only (18+) community via Google verification, protects personal data under DPDP Act 2023, and provides immediate skip, block, and reporting tools." },
      { q: "How is Meetly different from old sites like Omegle?", a: "Unlike unmoderated legacy platforms, Meetly requires adult verification, operates automated safety classifiers, and gives users full control over interest tags and text/video preferences." }
    ]
  },
  {
    route: "random-video-chat",
    title: "Random Video Chat with Strangers | Fast & Private — Meetly",
    description: "Start instant 1-on-1 random video calls with friendly adults worldwide. Peer-to-peer WebRTC video, no lag, mobile-optimized, and 100% private on Meetly.",
    canonical: "https://meet-ly.in/random-video-chat",
    h1: "Instant 1-on-1 Random Video Chat with Adults Worldwide",
    content: `
      <section>
        <h2>Lightning-Fast WebRTC Video Calling</h2>
        <p>Experience high-definition, low-latency random video conversations directly in your browser. Engineered with warm camera caching and Cloudflare edge STUN servers for sub-300ms connection speeds.</p>
        <h2>Mobile-Optimized &amp; Privacy-First</h2>
        <p>No video feeds are ever stored or recorded on middleman servers. WebRTC connections are direct peer-to-peer and encrypted.</p>
      </section>
    `,
    faq: [
      { q: "How does Meetly's random video chat work?", a: "Meetly connects two adults via direct peer-to-peer WebRTC with sub-300ms latency. No video is ever routed through or stored on external recording servers." },
      { q: "Does random video chat work smoothly on mobile phones?", a: "Yes. Meetly is specifically optimized for mobile devices with hardware-accelerated VP8/H.264 video decoding and warm camera caching across skips." }
    ]
  },
  {
    route: "anonymous-text-chat",
    title: "Anonymous Text Chat with Strangers | Free & Private — Meetly",
    description: "Enjoy private, anonymous random text chat with strangers online. No public profiles, no camera required, zero chat logs stored. Connect with adults worldwide.",
    canonical: "https://meet-ly.in/anonymous-text-chat",
    h1: "Anonymous Text Chat with Strangers — Private & Free",
    content: `
      <section>
        <h2>Low-Pressure, Pure Human Conversation</h2>
        <p>Talk openly without cameras, microphones, or social media pressure. Meetly's anonymous text chat pairs you 1-on-1 with adults worldwide based on genuine interests.</p>
        <h2>Zero Chat Logs &amp; Total Discretion</h2>
        <p>In compliance with India's DPDP Act 2023, chat messages exist solely in live memory and vanish permanently when your chat session ends.</p>
      </section>
    `,
    faq: [
      { q: "Is Meetly text chat truly anonymous?", a: "Yes. Your real name, email, and Google profile details are completely hidden. You are assigned a funky random avatar and first-name username with no public profile." },
      { q: "Are my text chat messages saved anywhere?", a: "No. Chat messages are processed solely in temporary memory to deliver them between active participants. Once your session closes, messages disappear permanently." }
    ]
  },
  {
    route: "safety",
    title: "Safety Center & User Education Guide — Meetly",
    description: "Read Meetly's Safety Center guidelines, user protection tools, reporting procedures, and legal compliance under India's IT Intermediary Rules (Rule 3(2)).",
    canonical: "https://meet-ly.in/safety",
    h1: "Safety Center & User Protection Guide",
    content: `
      <section>
        <h2>Our Commitment to Community Safety</h2>
        <p>Meetly enforces strict safety controls including Google 18+ adult verification, instant reporting, real-time safety classifiers, and a designated Grievance Officer under India's IT Rules 2021.</p>
      </section>
    `
  },
  {
    route: "community-guidelines",
    title: "Community Guidelines & Acceptable Use Policy — Meetly",
    description: "Community guidelines and prohibited conduct for Meetly. Learn our zero-tolerance standards against harassment, explicit content, hate speech, and scams.",
    canonical: "https://meet-ly.in/community-guidelines",
    h1: "Community Guidelines & Acceptable Use Policy",
    content: `
      <section>
        <h2>Acceptable Use on Meetly</h2>
        <p>Every participant on Meetly agrees to treat others with dignity and respect. Prohibited behaviors include non-consensual sexual content, hate speech, harassment, spam, and commercial solicitation.</p>
      </section>
    `
  },
  {
    route: "privacy",
    title: "Privacy Policy & Data Processing Notice — Meetly",
    description: "Meetly's Privacy Policy compliant with India's Digital Personal Data Protection (DPDP) Act 2023. Transparent disclosures on Google authentication and data retention.",
    canonical: "https://meet-ly.in/privacy",
    h1: "Privacy Policy & Data Processing Notice",
    content: `
      <section>
        <h2>Privacy by Design</h2>
        <p>Meetly is built with minimal data collection. We do not store chat histories, do not sell user data, and process personal identifiers strictly for authentication and statutory compliance under the DPDP Act 2023.</p>
      </section>
    `
  },
  {
    route: "terms",
    title: "Terms of Service & User Agreement — Meetly",
    description: "Terms of Service and legal user agreement for Meetly. Adults 18+ only, user obligations, intellectual property, and dispute resolution under Indian jurisdiction.",
    canonical: "https://meet-ly.in/terms",
    h1: "Terms of Service & User Agreement",
    content: `
      <section>
        <h2>Terms of Service</h2>
        <p>By accessing or using Meetly, you confirm that you are at least 18 years of age and agree to be bound by these Terms of Service and applicable laws.</p>
      </section>
    `
  },
  {
    route: "cookies",
    title: "Cookie & Advertising Technology Disclosure — Meetly",
    description: "Learn about Meetly's minimal cookie policy. We only use essential session cookies for authentication and do not use intrusive tracking cookies.",
    canonical: "https://meet-ly.in/cookies",
    h1: "Cookie & Advertising Technology Disclosure",
    content: `
      <section>
        <h2>Essential Cookies Only</h2>
        <p>Meetly utilizes strictly essential session cookies to manage temporary chat states and authenticate authorized users. We do not use third-party behavioral advertising cookies.</p>
      </section>
    `
  },
  {
    route: "data-rights",
    title: "Privacy & Data Subject Rights — Meetly",
    description: "Exercise your data rights under India's DPDP Act 2023. Submit requests for data summary, correction, deletion, or withdrawal of consent.",
    canonical: "https://meet-ly.in/data-rights",
    h1: "Privacy & Data Subject Rights",
    content: `
      <section>
        <h2>Data Subject Rights</h2>
        <p>Under India's Digital Personal Data Protection Act 2023, users may exercise their rights of access, correction, erasure, and grievance redressal through our automated portal.</p>
      </section>
    `
  },
  {
    route: "grievance",
    title: "Grievance Redressal (Rule 3(2)) — Meetly",
    description: "Submit a statutory grievance to Meetly's designated Grievance Officer in accordance with Rule 3(2) of the Information Technology Intermediary Rules 2021.",
    canonical: "https://meet-ly.in/grievance",
    h1: "Grievance Redressal Mechanism",
    content: `
      <section>
        <h2>Statutory Grievance Redressal</h2>
        <p>In accordance with Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, Meetly maintains a dedicated Grievance Officer to acknowledge and redress complaints within statutory timelines.</p>
      </section>
    `
  },
  {
    route: "blog",
    title: "Meetly Blog — Tips for Making Friends, Safe Chat & Conversation Advice",
    description: "Explore practical guides, icebreakers, online safety tips, and expert advice for meeting new people and making genuine friends online as an adult.",
    canonical: "https://meet-ly.in/blog",
    h1: "The Meetly Blog: Social Discovery, Guides & Conversation Advice",
    content: `
      <section>
        <h2>Guides, Advice &amp; Safety Insights for Adult Social Connection</h2>
        <p>Welcome to the Meetly Blog. Whether you are looking to make new friends as an adult, overcome transient loneliness, master the art of conversation starters, or ensure your digital privacy while chatting with strangers, our editorial guides provide actionable, evidence-based advice.</p>
        <ul>
          <li><a href="/blog/how-to-make-friends-online-as-an-adult">How to Make Friends Online as an Adult</a></li>
          <li><a href="/blog/what-to-do-when-you-feel-lonely-and-want-to-talk">Feeling Lonely and Want to Talk? Healthy Ways to Connect</a></li>
          <li><a href="/blog/how-to-start-a-conversation-with-someone-new">How to Start a Conversation With Someone New: 15 Icebreakers</a></li>
          <li><a href="/blog/how-to-chat-safely-with-strangers-online">How to Chat Safely With Strangers Online: 8 Essential Rules</a></li>
          <li><a href="/blog/text-chat-vs-video-chat">Text Chat vs Video Chat: Which Is Better for Meeting New People?</a></li>
        </ul>
      </section>
    `
  },
  {
    route: "blog/how-to-make-friends-online-as-an-adult",
    title: "How to Make Friends Online as an Adult: A Practical Guide — Meetly",
    description: "Struggling to make friends after college or moving? Discover 5 proven, low-pressure ways to meet like-minded adults online safely and naturally.",
    canonical: "https://meet-ly.in/blog/how-to-make-friends-online-as-an-adult",
    h1: "How to Make Friends Online as an Adult: A Practical, Low-Pressure Guide",
    content: `
      <section>
        <h2>The Adult Friendship Cliff (And How to Overcome It)</h2>
        <p>Losing the spontaneous proximity of school and college naturally shrinks social circles in adulthood. Meetly provides low-stakes, interest-aligned 1-on-1 conversations without the performance pressure of traditional social networks.</p>
        <h2>The 3-Stage Friendship Blueprint</h2>
        <ol>
          <li><strong>The Casual Exchange:</strong> Test conversational rhythm and shared humor with low-friction open-ended questions.</li>
          <li><strong>Mutual Exploration:</strong> Exchange stories, songs, and perspectives over low-pressure touchpoints.</li>
          <li><strong>Transitioning to Long-Term Friends:</strong> Safely move to persistent channels once mutual trust is verified.</li>
        </ol>
      </section>
    `,
    faq: [
      { q: "How long does it take to make an adult friend online?", a: "Research suggests it takes roughly 50 hours of shared interaction to move from acquaintance to friend. Frequent short exchanges (15-20 minutes) online accelerate this timeline." },
      { q: "Is it safe to meet friends online?", a: "Yes, when following zero-PII boundaries: never share financial info, exact addresses, or personal phone numbers until trust is deeply established." }
    ]
  },
  {
    route: "blog/what-to-do-when-you-feel-lonely-and-want-to-talk",
    title: "Feeling Lonely and Want to Talk? Healthy Ways to Connect — Meetly",
    description: "When you feel disconnected or lonely and want someone to talk to, here are healthy, low-pressure steps to find casual human connection right now.",
    canonical: "https://meet-ly.in/blog/what-to-do-when-you-feel-lonely-and-want-to-talk",
    h1: "Feeling Lonely and Want to Talk? Healthy Ways to Connect Right Now",
    content: `
      <section>
        <h2>Normalizing Transient Loneliness</h2>
        <p>Transient loneliness is a temporary biological signal craving social reciprocity. Unlike doomscrolling on social media—which increases social comparison—having a casual, two-way conversation with a friendly stranger resets your mental state.</p>
        <h2>Mental Health Helplines (24/7 Free Support)</h2>
        <p>Meetly is a casual social platform, not healthcare. If you need crisis support in India, contact Tele-MANAS at 14416 or KIRAN at 1800-599-0019.</p>
      </section>
    `,
    faq: [
      { q: "Can talking to a stranger help with loneliness?", a: "Yes. Short, low-pressure conversations with friendly strangers provide zero-baggage social reciprocity that reduces emotional isolation." }
    ]
  },
  {
    route: "blog/how-to-start-a-conversation-with-someone-new",
    title: "How to Start a Conversation With Someone New: 15 Proven Openers — Meetly",
    description: "Skip the boring 'hey' and 'what's up'. Master the art of starting engaging online chats with tested icebreakers, fun questions, and conversational hooks.",
    canonical: "https://meet-ly.in/blog/how-to-start-a-conversation-with-someone-new",
    h1: "How to Start a Conversation With Someone New (15 Icebreakers That Work)",
    content: `
      <section>
        <h2>Why 'Hey' and 'ASL' Fail Every Time</h2>
        <p>Low-effort openers force the recipient to carry 100% of the cognitive burden. Great conversation starters give your partner an effortless hook: a playful debate, an easy opinion, or a fun memory.</p>
        <h2>Top Tested Icebreakers</h2>
        <ul>
          <li><em>What is the most overrated movie everyone seems to love?</em></li>
          <li><em>If you could teleport to any city right now for dinner, where are we going?</em></li>
          <li><em>What is one song that never fails to boost your mood?</em></li>
        </ul>
      </section>
    `,
    faq: [
      { q: "What should I say after the icebreaker?", a: "Follow the Ping-Pong rule: always answer with a specific detail and attach an open-ended question back to keep the momentum flowing." }
    ]
  },
  {
    route: "blog/how-to-chat-safely-with-strangers-online",
    title: "How to Chat Safely With Strangers Online: 8 Essential Rules — Meetly",
    description: "Learn how to protect your privacy and stay secure while chatting with strangers online. Essential safety rules, red flags, and digital boundary tips.",
    canonical: "https://meet-ly.in/blog/how-to-chat-safely-with-strangers-online",
    h1: "How to Chat Safely With Strangers Online: 8 Essential Rules for Adults",
    content: `
      <section>
        <h2>Essential Digital Privacy Rules</h2>
        <ol>
          <li><strong>Zero Personally Identifiable Information:</strong> Never disclose full legal names, home addresses, or workplace locations.</li>
          <li><strong>Absolute Financial Boundary:</strong> Never send funds, cryptocurrency, or gift cards to online chat contacts.</li>
          <li><strong>Audit Camera Backgrounds:</strong> Verify no mail, diplomas, or badges are visible in video calls.</li>
          <li><strong>Avoid Rushing to WhatsApp/Telegram:</strong> Protect your real phone number until trust is established over time.</li>
        </ol>
      </section>
    `,
    faq: [
      { q: "Is Meetly anonymous?", a: "Yes. Meetly does not display public profiles, real names, or email addresses to chat partners. Text chats are ephemeral and video connections are direct peer-to-peer WebRTC." }
    ]
  },
  {
    route: "blog/text-chat-vs-video-chat",
    title: "Text Chat vs Video Chat: Which Is Better for Meeting New People? — Meetly",
    description: "Comparing random text chat and video chat for meeting strangers. Discover the pros, cons, privacy differences, and which mode fits your social style.",
    canonical: "https://meet-ly.in/blog/text-chat-vs-video-chat",
    h1: "Text Chat vs Video Chat: Which Is Better for Meeting New People?",
    content: `
      <section>
        <h2>Choosing the Right Format for Your Social Battery</h2>
        <p>Text chat provides low-pressure, asynchronous-style introspection without camera fatigue. Video chat delivers instantaneous laughter, facial micro-expressions, and authentic rapport. Meetly lets you switch between both with a single click.</p>
      </section>
    `,
    faq: [
      { q: "Are Meetly video chats recorded?", a: "No. Video calls use peer-to-peer WebRTC encryption directly between user browsers with no intermediate recording servers." }
    ]
  }
];

console.log(`[Prerender] Generating static HTML for ${PAGES.length} routes...`);

for (const page of PAGES) {
  let html = baseTemplate;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/s, `<title>${page.title}</title>`);

  // Replace Meta Description
  html = html.replace(
    /<meta\s+name="description"\s+content=".*?"\s*\/?>/s,
    `<meta name="description" content="${page.description}" />`
  );

  // Replace Canonical URL
  html = html.replace(
    /<link\s+rel="canonical"\s+href=".*?"\s*\/?>/s,
    `<link rel="canonical" href="${page.canonical}" />`
  );

  // Replace Open Graph Tags
  html = html.replace(
    /<meta\s+property="og:title"\s+content=".*?"\s*\/?>/s,
    `<meta property="og:title" content="${page.title}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/s,
    `<meta property="og:description" content="${page.description}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content=".*?"\s*\/?>/s,
    `<meta property="og:url" content="${page.canonical}" />`
  );

  // Replace Twitter Tags
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/s,
    `<meta name="twitter:title" content="${page.title}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/s,
    `<meta name="twitter:description" content="${page.description}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:url"\s+content=".*?"\s*\/?>/s,
    `<meta name="twitter:url" content="${page.canonical}" />`
  );

  // Inject Page-Specific FAQ Schema if available
  if (page.faq && page.faq.length > 0) {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": page.faq.map(item => ({
        "@type": "Question",
        "name": item.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.a
        }
      }))
    };
    const schemaTag = `\n    <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`;
    html = html.replace("</head>", `${schemaTag}\n  </head>`);
  }

  // Inject Prerendered Static Content into <div id="root">
  const staticFallbackMarkup = `
    <div id="root">
      <!-- Static Prerendered Content for SEO Crawlers -->
      <header class="topbar">
        <div style="display:flex;align-items:center;gap:12px">
          <a href="/" class="brand" aria-label="Meetly Home">
            <span class="brand-mark">🛡️</span>
            <span>Meetly<span class="brand-period">.</span></span>
          </a>
          <span style="font-size:12px;color:#6b7280;border-left:1px solid #e5e7eb;padding-left:12px">18+ Adults Only</span>
        </div>
        <div>
          <a href="/" class="button button-primary button-small">Start Chatting</a>
        </div>
      </header>
      <main style="max-width:860px;margin:32px auto;padding:0 16px">
        <article>
          <h1 style="font-size:2.2rem;font-weight:800;color:#183b32;margin-bottom:16px">${page.h1}</h1>
          <p style="font-size:1.1rem;color:#4b5563;line-height:1.6;margin-bottom:24px">${page.description}</p>
          ${page.content}
          ${
            page.faq && page.faq.length > 0
              ? `
            <section style="margin-top:32px">
              <h2>Frequently Asked Questions</h2>
              ${page.faq.map(f => `<div style="margin-bottom:16px"><strong>${f.q}</strong><p>${f.a}</p></div>`).join("")}
            </section>
          `
              : ""
          }
        </article>
      </main>
      <footer style="max-width:860px;margin:48px auto;padding:24px 16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
        <p>Meetly · Maintained by Evolix Studio · Anonymous Random Text &amp; Video Chat · 18+ Adults Only</p>
        <p>
          <a href="/make-friends-online">Make Friends Online</a> · 
          <a href="/talk-to-someone-online">Talk to Someone</a> · 
          <a href="/chat-with-strangers">Chat with Strangers</a> · 
          <a href="/random-video-chat">Random Video Chat</a> · 
          <a href="/anonymous-text-chat">Anonymous Text Chat</a> · 
          <a href="/safety">Safety</a> · 
          <a href="/terms">Terms</a> · 
          <a href="/privacy">Privacy</a>
        </p>
      </footer>
    </div>
  `;

  html = html.replace('<div id="root"></div>', staticFallbackMarkup);

  // Write to destination directory
  if (page.route === "") {
    fs.writeFileSync(baseTemplatePath, html, "utf-8");
    console.log(`[Prerender] -> / (root index.html updated)`);
  } else {
    const targetDir = path.join(distDir, page.route);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetFile = path.join(targetDir, "index.html");
    fs.writeFileSync(targetFile, html, "utf-8");
    console.log(`[Prerender] -> /${page.route}/index.html`);
  }
}

console.log("[Prerender] Complete! All static HTML pages successfully generated.");

