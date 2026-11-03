import { Link } from "wouter";
import { LegalLayout } from "./legal/LegalLayout";

export default function About() {
  return (
    <LegalLayout title="About Meetly & Contact" subtitle="How Meetly works, who maintains it, and where to get help." badge="About Meetly" effectiveDate="November 3, 2026">
      <div className="legal-prose" style={{ lineHeight: 1.75 }}>
        <h2>Conversations with someone new</h2>
        <p>Meetly is an online friendship and random chat platform maintained by Evolix Studio. It is intended for adults aged 18 and over. You can select interests and a language, then look for a one-to-one text or video conversation. Matching depends on who is available; a shared interest or language is not guaranteed.</p>
        <h2>What to expect</h2>
        <p>Google sign-in is required before matchmaking. Your Google name and email are not displayed to your chat partner. Video mode uses your browser's camera and microphone permissions and can start connecting automatically once you are matched. WebRTC connects browsers directly or through a configured relay; direct connections can reveal your public IP address to your partner.</p>
        <p>Next finds another partner, Leave ends your current conversation, and Block and Report let you respond to unwanted behavior. No platform can guarantee that a stranger is safe. Google sign-in and age confirmation do not independently verify someone's age. Do not share sensitive details or anything you would not want someone to record.</p>
        <h2>Guides and advertising</h2>
        <p>Our <Link href="/blog">guides</Link> offer conversation examples, friendship ideas and online safety advice. Advertising may support published guide articles when configured. Live chats, camera feeds and their controls remain ad-free. See the <Link href="/cookies">advertising disclosure</Link> for details.</p>
        <h2 id="contact">Contact and support</h2>
        <p>For harmful conduct, use Report in the chat or submit a complaint through the <Link href="/grievance">grievance and contact form</Link>. For account information, corrections or deletion requests, use the <Link href="/data-rights">privacy and data rights form</Link>. Keep the tracking code returned by the form to check progress. These channels are not emergency services.</p>
        <p>Read the <Link href="/community-guidelines">community guidelines</Link>, <Link href="/safety">safety center</Link>, <Link href="/privacy">privacy policy</Link> and <Link href="/terms">terms</Link> before starting a conversation.</p>
      </div>
    </LegalLayout>
  );
}
