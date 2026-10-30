import React from "react";
import { LegalLayout } from "./LegalLayout";
import { Link } from "wouter";

export default function TermsOfService() {
  return (
    <LegalLayout
      title="Terms of Service & User Agreement"
      subtitle="Please read these terms carefully before connecting. By clicking 'I Agree' or accessing Meetly, you enter into a binding agreement governing your anonymous use of this service."
      badge="User Agreement · India & Global"
      effectiveDate="October 29, 2026"
    >
      <div className="legal-prose" style={{ lineHeight: "1.7", color: "var(--ink)" }}>
        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            1. Operator Identification & Website Ownership
          </h2>
          <p>
            This website and service (<strong>"Meetly"</strong>, accessible at <code>meetly.evolix.studio</code>) is developed, maintained, and operated by <strong>Evolix Studio</strong> (the <strong>"Operator"</strong>, <strong>"we"</strong>, <strong>"us"</strong>, or <strong>"our"</strong>).
          </p>
          <p>
            Meetly provides an anonymous, real-time, stranger-to-stranger text and opt-in live WebRTC video communication platform. The Operator operates as an <strong>Intermediary</strong> within the meaning of Section 2(1)(w) of the <em>Information Technology Act, 2000</em> (India) and the <em>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</em>.
          </p>
          <p style={{ background: "var(--mint)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
            <strong>Operator Entity Notice:</strong> Formal corporate classification and registered office address in India are currently subject to operational finalization: <code>[Operator Registered Office & Entity Details Pending Formal Advocate Verification]</code>. Official communications may be directed to our designated <Link href="/grievance" style={{ color: "var(--teal)", fontWeight: 600 }}>Grievance Officer</Link>.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            2. Scope of Service & Eligibility (Adults Only: 18+)
          </h2>
          <p>
            <strong>Strict Age Requirement:</strong> Meetly is exclusively designed and intended for individuals who are at least <strong>18 years of age</strong> (or the age of legal majority in your jurisdiction).
          </p>
          <p>
            Under Section 9 of the <em>Digital Personal Data Protection Act, 2023</em> (India), processing personal data of children (defined as any individual under 18 years) requires verifiable parental consent and prohibits tracking, behavioral monitoring, or targeted advertising. Because Meetly is built on anonymous, ephemeral sessions without account registration or identity verification documents, <strong>minors under 18 years of age are strictly prohibited from accessing or using Meetly</strong>.
          </p>
          <p>
            By accessing Meetly, you represent, warrant, and affirm that you are at least 18 years of age and legally competent to enter into this contract under the <em>Indian Contract Act, 1872</em>.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            3. Anonymous Session Access & Technical Realities
          </h2>
          <p>
            Meetly provides anonymous session access. You are not required to provide a phone number, email address, username, or profile picture to begin chatting.
          </p>
          <p>
            <strong>What Anonymity Means on Meetly:</strong>
          </p>
          <ul>
            <li>Between chat participants, no profile, phone number, email address, or user account is shared or exposed.</li>
            <li>Sessions are identified internally by an unpredictable, cryptographically generated token (HMAC-SHA256) stored in your browser's temporary session storage.</li>
            <li>When you close your browser tab or click <strong>End Call</strong>, the session token is destroyed on your device.</li>
          </ul>
          <p>
            <strong>What Anonymity Does NOT Mean:</strong>
          </p>
          <ul>
            <li>Anonymity does not grant legal immunity or authorization for unlawful conduct, harassment, fraud, or abuse.</li>
            <li>In accordance with statutory directions under Section 70B of the <em>Information Technology Act, 2000</em> (CERT-In Directions, 2022), technical network logs (such as IP addresses, connection timestamps, and protocol headers) are processed and securely maintained for cybersecurity and legal compliance.</li>
            <li>In live video chat, your face, voice, background environment, and visual actions are directly transmitted to the other person and may identify you.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            4. Prohibited Content & Due Diligence (Rule 3(1)(b) IT Rules, 2021)
          </h2>
          <p>
            In compliance with Rule 3(1)(b) of the <em>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</em>, you agree and undertake that you shall not host, display, upload, modify, publish, transmit, store, update or share any information or live video/audio stream that:
          </p>
          <ol style={{ paddingLeft: "20px" }}>
            <li>belongs to another person and to which you do not have any right;</li>
            <li>is obscene, pornographic, paedophilic, invasive of another's privacy including bodily privacy, insulting or harassing on the basis of gender, racially or ethnically objectionable, relating or encouraging money laundering or gambling, or otherwise inconsistent with or contrary to the laws in force;</li>
            <li><strong>is harmful to child (including any child sexual abuse material [CSAM], grooming, or solicitation of minors) — ZERO TOLERANCE;</strong></li>
            <li>infringes any patent, trademark, copyright or other proprietary rights;</li>
            <li>deceives or misleads the addressee about the origin of the message or knowingly communicates any misinformation or information which is patently false or untrue;</li>
            <li>impersonates another person;</li>
            <li>threatens the unity, integrity, defence, security or sovereignty of India, friendly relations with foreign States, or public order, or causes incitement to the commission of any cognisable offence or prevents investigation of any offence;</li>
            <li>contains software virus, worms, or any computer code designed to interrupt, destroy or limit the functionality of any computer resource;</li>
            <li>depicts non-consensual sexual acts, nudity, intimate parts, or synthetic/deepfake sexual depictions of any individual;</li>
            <li>violates any law for the time being in force in India or any applicable jurisdiction.</li>
          </ol>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            5. User Conduct & Peer-to-Peer Video Communication
          </h2>
          <p>
            Meetly facilitates real-time communication between unvetted strangers. You agree to exercise sound personal judgement, caution, and discretion at all times:
          </p>
          <ul>
            <li><strong>No Screen Recording:</strong> You agree not to record, capture, photograph, screenshot, or redistribute audio, video, or chat messages of another participant without their explicit, prior consent.</li>
            <li><strong>External Recording Risk:</strong> You acknowledge that Meetly cannot technically prevent another participant from using third-party recording software, external cameras, or screenshot tools. You share camera video and messages entirely at your own risk.</li>
            <li><strong>Never Share Sensitive Data:</strong> Never disclose financial information, bank details, UPI PINs, passwords, home addresses, contact numbers, or real identities to strangers.</li>
            <li><strong>Direct WebRTC Transmission:</strong> In video mode, video and audio streams travel directly peer-to-peer using WebRTC and public STUN servers. Restrictive firewalls may prevent connection, and tech-savvy participants may detect your public IP address through network stream inspection.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            6. Moderation, Reporting & Enforcement Actions
          </h2>
          <p>
            Meetly provides built-in safety controls to protect participants:
          </p>
          <ul>
            <li><strong>In-Conversation Reporting:</strong> You can report a partner during any active conversation by clicking <strong>Report</strong> and selecting an applicable violation reason.</li>
            <li><strong>Immediate Block & Room Teardown:</strong> Submitting a report or clicking <strong>Block</strong> immediately terminates the conversation, revokes camera/audio access, and enforces a mutual 24-hour block between the two session identities.</li>
            <li><strong>Priority Triage:</strong> Reports involving suspected child exploitation (CSAM) or non-consensual sexual content are classified as critical statutory emergencies and routed for expedited operator triage and law enforcement reporting.</li>
            <li><strong>Right to Restrict or Ban:</strong> The Operator reserves the right to immediately sever connections, restrict IP addresses, or permanently block access for any user found or suspected of violating these Terms.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            7. Service Availability & "As-Is" Provision
          </h2>
          <p>
            Meetly is provided on an <strong>"AS-IS"</strong> and <strong>"AS-AVAILABLE"</strong> basis without warranties of any kind, whether express or implied.
          </p>
          <p>
            The Operator does not warrant that: (i) the service will meet your personal requirements or expectations; (ii) you will match with a compatible partner; (iii) the service will be uninterrupted, timely, secure, or error-free; or (iv) statements or video content delivered by random strangers will be accurate, lawful, or non-offensive.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            8. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by applicable law (including the <em>Consumer Protection Act, 2019</em> and the <em>Information Technology Act, 2000</em>), in no event shall Evolix Studio, its partners, developers, affiliates, or licensors be liable for:
          </p>
          <ul>
            <li>Any indirect, incidental, special, consequential, or punitive damages;</li>
            <li>Any loss of data, privacy, goodwill, or personal distress arising out of or related to your use of, or inability to use, Meetly;</li>
            <li>The conduct, statements, or content of any third-party stranger encountered through the service;</li>
            <li>Any unauthorized recording, screenshot, or redistribution of your video stream by another chat participant.</li>
          </ul>
          <p>
            Nothing in these Terms excludes or limits statutory liability that cannot be lawfully waived under applicable Indian law.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            9. Advertising & Third-Party Monetization
          </h2>
          <p>
            The Operator may display advertisements on eligible static informational pages (such as the Homepage, Safety Center, and Policy pages) through Google AdSense or other advertising networks.
          </p>
          <p>
            <strong>Chat Isolation Guarantee:</strong> Advertisements are strictly prohibited and disabled on active chat screens, live video calls, searching screens, and error views. Advertisers have no access to your live conversation content or WebRTC media. Third-party advertising technologies and cookie disclosures are governed by our <Link href="/cookies" style={{ color: "var(--teal)" }}>Cookie & Ad Disclosure</Link>.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            10. Intellectual Property Rights
          </h2>
          <p>
            All website software, source code, user interface designs, logos, graphics, and documentation associated with Meetly are the proprietary intellectual property of Evolix Studio.
          </p>
          <p>
            You are granted a limited, personal, revocable, non-exclusive, non-transferable license to access Meetly in accordance with these Terms. You may not reverse engineer, decompile, scrape, copy, automate, or commercially exploit Meetly without explicit written consent.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            11. Grievance Redressal Mechanism (Rule 3(2) IT Rules, 2021)
          </h2>
          <p>
            In accordance with the <em>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</em>, the Operator has appointed a designated Grievance Officer for redressing user grievances regarding content, terms violations, privacy concerns, or platform abuse:
          </p>
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", padding: "16px", borderRadius: "8px", margin: "12px 0", fontSize: "13px" }}>
            <div><strong>Designation:</strong> Grievance Officer, Meetly (Evolix Studio)</div>
            <div><strong>Email Address:</strong> <code>grievance@meetly.evolix.studio</code></div>
            <div><strong>Postal Address:</strong> <code>[Postal Address in India Pending Formal Verification by Operator]</code></div>
            <div><strong>Statutory Acknowledgment:</strong> Within 24 hours of receipt</div>
            <div><strong>Statutory Resolution:</strong> Within 15 days (or within 24 hours for non-consensual sexual depictions / CSAM)</div>
          </div>
          <p>
            You can also submit and track an official grievance directly via our online <Link href="/grievance" style={{ color: "var(--teal)", fontWeight: 600 }}>Grievance Redressal Portal</Link>.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            12. Governing Law & Dispute Resolution
          </h2>
          <p>
            These Terms, your access to Meetly, and any disputes arising out of or related to this agreement shall be governed by and construed in accordance with the <strong>laws of the Republic of India</strong>, without regard to conflict of law principles.
          </p>
          <p>
            Subject to statutory consumer rights that cannot be contracted out, any legal suit, action, or proceeding arising out of these Terms shall be instituted exclusively in the competent courts having jurisdiction in <strong>India</strong> <code>[Specific City / State Jurisdiction Pending Legal Counsel Review]</code>.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--ink)", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
            13. Amendments & Updates
          </h2>
          <p>
            We may revise and update these Terms from time to time to reflect technological improvements, security enhancements, or statutory requirements. When changes are made, the <strong>"Effective Date"</strong> at the top of this document will be updated accordingly. Continued use of Meetly following the posting of revised Terms signifies your acceptance of the changes.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}

