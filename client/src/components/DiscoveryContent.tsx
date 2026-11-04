import { Link } from "wouter";
import content from "../../../content/discovery.json";

export default function DiscoveryContent({ path }: { path: keyof typeof content }) {
  return <>
    {content[path].map(section => <section key={section.heading} style={{ marginBottom: "36px" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "14px" }}>{section.heading}</h2>
      {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    </section>)}
    <p style={{ marginBottom: "36px" }}>Read our <Link href="/blog/how-to-start-a-conversation-with-someone-new">conversation starters</Link> and <Link href="/blog/how-to-chat-safely-with-strangers-online">guide to chatting safely</Link>, or explore <Link href={path === "/make-friends-online" ? "/chat-with-strangers" : "/make-friends-online"}>{path === "/make-friends-online" ? "talking to strangers online" : "making friends online"}</Link>.</p>
  </>;
}
