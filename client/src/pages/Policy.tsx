import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { Link, useRoute } from "wouter";

const pages = {
  "/privacy": {
    kicker: "Plain-language privacy note",
    title: "No profile.\nHonest about the limits.",
    lead: "Meetly does not ask you for a name, email address or phone number to start a text chat. Opt-in video shows your live camera and microphone to a stranger and may reveal network details.",
    sections: [
      ["What we use", "A short-lived random session credential, the interests/language you choose for that session, current room state and limited security signals are used to connect people and help reduce abuse. Network and browser connection information may also be processed by the service and its infrastructure providers."],
      ["What stays temporary", "Ordinary messages are held in the active room only so the conversation can work. They are not written as ordinary chat history, and the active room is cleared when it ends or expires. This service runs live room state in one application process; a restart ends current sessions."],
      ["What may be retained", "If you submit a safety report, the selected reason and any note you write are stored for review. An excerpt is included only when you deliberately select that option. Technical records needed to operate or protect the service may also be processed. Exact retention/deletion periods still require an approved policy."],
      ["Analytics and infrastructure", "Meetly’s injected site analytics and badge analytics are disabled. Other platform, hosting, network or CDN systems may still process technical request and connection metadata; disabling those two analytics scripts does not mean that all tracking or logging has stopped. Temporary safeguards also apply request limits in memory; network identifiers are not written as a visitor profile."],
      ["What another person can see", "The interface does not show a profile, email or phone number. Text chat does not include a public profile. In video mode, your live camera/microphone stream is sent directly to the matched participant after both people opt in; your face or voice may identify you. Direct WebRTC may expose your network IP to that person and to the STUN provider. A participant may also capture what is visible on their device using external software or another camera."],
      ["Video and network details", "Video is optional. After you press Join video and grant browser camera/microphone permission, your local preview stays on your device until the other person also opts in. The call uses Google's public STUN service (stun.l.google.com:19302), not a TURN privacy relay. The other participant and STUN provider may learn your network IP, and restrictive networks may prevent the call. Meetly does not record or store call media, but cannot prevent a recipient from recording their screen."],
      ["Age and safety limits", "The adults-only age step is self-attested; the service does not independently verify age. Staffed media moderation, complete abuse detection and guaranteed report response are not available. Do not use the service if these limitations are unacceptable to you."],
      ["Your choices", "You can choose text instead of video, skip, end, block or report. Interests are temporary matching preferences and are not a public profile. Do not share passwords, financial details, exact location or contact details with strangers."],
    ],
  },
  "/terms": {
    kicker: "Service terms · draft",
    title: "A few ground rules\nfor a good hello.",
    lead: "This is product-draft information, not a final legal agreement. Qualified counsel has not reviewed it for every market where the service may be accessed.",
    sections: [
      ["Who may use Meetly", "The service is intended for adults aged 18 or older. The current age step is self-attestation only and is not reliable age verification. Do not use Meetly if you are under 18."],
      ["Keep people safe", "Harassment, grooming, sexual exploitation, sexual content involving minors, credible threats, non-consensual sexual behaviour, doxxing, fraud, phishing, malicious links, harmful impersonation, spam, illegal activity and attempts to bypass safety controls are not allowed."],
      ["Use your own judgement", "Meetly connects strangers and cannot guarantee who you will meet, what another participant will say, or that another person will not record their screen. Video is direct rather than relayed and may reveal network details, including your IP address. Never send money, passwords, financial details or private identifying information."],
      ["Video calls", "Video is optional. Your local camera/microphone preview stays on your device until you choose Join video, grant browser permission and the other participant also opts in. The media then travels directly between devices using WebRTC and public STUN, with no TURN privacy relay. The call may fail on some networks, and the other participant or STUN provider may learn your network IP. Meetly does not record or store call media."],
      ["Leaving and reporting", "You can end or skip a text or video conversation without giving a reason; End video stops the media while leaving text chat active. Use Report for a safety concern. Anonymous session controls cannot guarantee that a person will never encounter the same participant again. Reports enter a technical queue; staffed human review and response times are not guaranteed."],
      ["Availability and review", "This service does not promise uninterrupted operation, a match within a set time, or human review of every incident. Final enforcement, appeals, contact and legal-request terms remain subject to operational and legal review."],
    ],
  },
  "/guidelines": {
    kicker: "Community guidelines · draft",
    title: "Make room for\na real conversation.",
    lead: "A stranger is still a person. Keep text and video consensual, respectful and free of private information.",
    sections: [
      ["Be kind and consensual", "No targeted harassment, hate, threats, intimidation or unwanted sexual behaviour. For video, wait for both people to explicitly opt in before media starts. Respect a clear “no” and end the conversation if someone asks you to stop."],
      ["Respect media privacy", "Do not record, screenshot, capture or redistribute someone's video/audio without permission. Meetly does not record or store call media, but cannot technically prevent recording through another device or software."],
      ["Protect privacy", "Do not share or request passwords, financial information, private contact details, exact location or another person's private information. Direct video may reveal network IP addresses to the other participant and STUN provider; choose text if you are not comfortable with that."],
      ["No exploitation or illegal activity", "Sexual exploitation or grooming, any sexual content involving minors, credible threats, scams, phishing, malicious links and other illegal activity are prohibited."],
      ["No spam or safety evasion", "Do not flood chats, automate abusive activity, evade restrictions or encourage another person to bypass safety controls."],
      ["Report concerns", "Use Report to send a reason and, only if you choose, a short recent excerpt. Reports involving suspected minors or credible threats need specialist response procedures; this service is not an emergency line and staffed review is not available."],
    ],
  },
  "/safety": {
    kicker: "A safer way to say hello",
    title: "Your comfort comes\nfirst. Always.",
    lead: "Meetly offers random text and opt-in video chat. Direct video can reveal network details, and no anonymous chat service can guarantee every conversation will be safe.",
    sections: [
      ["Before you chat", "Meetly is intended for adults 18+. The current eligibility check is self-attested and does not independently verify age. Do not use this service if you are under 18."],
      ["While you chat", "Never share passwords, financial details, private contact information or precise location. Links are disabled in this MVP. Messages are plain text; the service applies basic flood and personal-contact safeguards, but automated checks are limited and can make mistakes. Video uses a direct, non-relayed WebRTC connection that may expose your network IP; some networks may not connect."],
      ["If something feels wrong", "Use Next or End Chat at any time. Block ends the current conversation and reduces the chance of reconnecting with the same temporary session; it cannot guarantee permanent identity-based prevention. Report submits your chosen category and any optional note. A message excerpt is sent only when you select it."],
      ["Reports and response", "Submitted reports enter a technical review queue. Staffed human moderation, child-safety escalation, incident-response coverage and guaranteed response times are not available. This interface is not an emergency service."],
      ["Opt-in video", "Choose Join video and allow browser camera/microphone access; the other person must opt in separately. Your local preview stays local until both opt in. Video then travels directly between devices using Google's public STUN service—not a TURN privacy relay. Your chat partner and the STUN provider may learn your network IP, and some networks may fail. Meetly does not record or store audio/video, but screen recording by the other person cannot be ruled out."],
      ["Important limitations", "There is no robust age verification, TURN/media relay, automated visual-content moderation, staffed media moderation or guaranteed report response. Public video is available despite these open safety and operational limitations. This product text is still draft material requiring qualified, jurisdiction-specific review."],
    ],
  },
} as const;

export default function Policy() {
  const [isPrivacy] = useRoute("/privacy");
  const [isTerms] = useRoute("/terms");
  const [isGuidelines] = useRoute("/guidelines");
  const path = isPrivacy ? "/privacy" : isTerms ? "/terms" : isGuidelines ? "/guidelines" : "/safety";
  const page = pages[path as keyof typeof pages];
  return <div className="app-shell policy-shell">
    <header className="topbar"><Link href="/" className="brand" aria-label="Meetly home"><span className="brand-mark" aria-hidden="true"><i /><i /></span><span>meetly<span className="brand-period">.</span></span></Link><Link href="/" className="top-link"><ArrowLeft size={16} />Back to Meetly</Link></header>
    <main className="policy-main"><div className="policy-label"><ShieldCheck size={16} />{page.kicker}</div><h1>{page.title.split("\n").map((part, index) => <span key={part}>{index > 0 && <br />}{index === 1 ? <em>{part}</em> : part}</span>)}</h1><p className="policy-lead">{page.lead}</p>{(path === "/privacy" || path === "/terms" || path === "/guidelines") && <div className="draft-banner"><span>Draft for review</span> This page is product information, not final legal advice or a substitute for a jurisdiction-specific review.</div>}<div className="policy-sections">{page.sections.map(([heading, body], index) => <section key={heading}><span className="policy-section-number">{String(index + 1).padStart(2, "0")}</span><div><h2>{heading}</h2><p>{body}</p></div></section>)}</div><div className="policy-bottom"><span>Questions about safety? Read the <Link href="/safety">safety overview</Link>.</span><Link className="button button-primary" href="/">Back to Meetly <ArrowRight size={16} /></Link></div></main>
    <footer className="site-footer"><span>Meetly <span className="muted-inline">· conversations without the profile</span></span><nav aria-label="Site information"><Link href="/safety">Safety</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/guidelines">Guidelines</Link></nav></footer>
  </div>;
}
