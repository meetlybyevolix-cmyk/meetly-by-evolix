export function indiaDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
}

export function publicationDecision(schedule, articles, now = new Date()) {
  const date = indiaDate(now);
  if (date < schedule.startDate || date > schedule.endDate) return { allowed:false, date, reason:"Outside the one-month publishing window" };
  if (articles.filter(article => article.isPublished && article.publishedDate === date).length >= schedule.maxPostsPerDay) return {allowed:false,date,reason:"Daily publication limit already reached"};
  return {allowed:true,date,reason:"Scheduled publication is due"};
}

function shingles(html) {
  const words = html.replace(/<[^>]+>/g," ").toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  return new Set(words.slice(0,-4).map((_,index)=>words.slice(index,index+5).join(" ")));
}

export function contentIssues(article, existing) {
  const issues=[];
  if (!/^\s*<p[\s>]/i.test(article.contentHtml)) issues.push("Open with a short direct answer paragraph before the headings.");
  if (!Array.isArray(article.faqs) || article.faqs.length < 2 || article.faqs.some(f=>!f.question?.trim()||!f.answer?.trim())) issues.push("Include at least two complete, topic-specific questions and answers.");
  if (/<\/?(?:script|iframe|form|object|embed|style|input|button)\b|\son\w+\s*=|(?:javascript|data):/i.test(article.contentHtml)) issues.push("Unsafe embedded HTML or link content.");
  if (/\b(?:5x longer|verified adults|guaranteed saf\w*|guaranteed rank\w*|100% safe)\b/i.test(article.contentHtml)) issues.push("Unsupported safety, performance or ranking claim.");
  const candidate=shingles(article.contentHtml);
  for (const other of existing) {
    if (other.slug===article.slug) { issues.push("An article with this slug already exists."); continue; }
    const previous=shingles(other.contentHtml);
    const shared=[...candidate].filter(item=>previous.has(item)).length;
    if (candidate.size && previous.size && shared/Math.min(candidate.size,previous.size) > 0.55) issues.push(`Substantially repeats existing article: ${other.slug}`);
  }
  return issues;
}
