const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);

/** Publish prepared editorial content; no API calls, credentials or runtime AI. */
export function prepareBlogPost(topic, entry) {
  if (!entry) throw new Error(`No prepared article exists for ${topic.slug}. Add editorial content before scheduling it.`);
  const sections = entry.sections.map(section => `<h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map(text => `<p>${escapeHtml(text)}</p>`).join("")}`).join("");
  const footer = `<h2>Using Meetly thoughtfully</h2><p>Meetly offers adults one-to-one text and video conversations, with Google sign-in required before matching. Sign-in does not independently verify age. Availability affects matching, and no particular partner or interest is guaranteed. Keep personal details private and use Leave, Block or Report when appropriate. Read the <a href="/safety">Safety Center</a> and <a href="/privacy">privacy notice</a> before choosing how to chat.</p>${topic.category === "Wellbeing & Connection" ? '<p>Meetly is casual social conversation, not therapy, medical advice or emergency support. You can seek qualified support without first trying a stranger chat.</p>' : ''}`;
  const sources = entry.sources?.length ? `<h2>Further reading</h2><ul>${entry.sources.map(source => {
    if (!source.url.startsWith("https://")) throw new Error("Editorial references must use HTTPS.");
    return `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.label)}</a></li>`;
  }).join("")}</ul>` : "";
  const contentHtml = `<p>${escapeHtml(entry.answer)}</p>${sections}${footer}${sources}`;
  const count = contentHtml.replace(/<[^>]*>/g," ").trim().split(/\s+/).length;
  const title = entry.title || topic.title;
  const seoTitle = title.length <= 58 ? `${title} | Meetly` : `${title.slice(0,57).replace(/\s+\S*$/,"")} | Meetly`;
  return {title,seoTitle,description:entry.description,readTime:`${Math.max(3,Math.ceil(count/200))} min read`,contentHtml,keyTakeaways:entry.takeaways,faqs:entry.faqs};
}
