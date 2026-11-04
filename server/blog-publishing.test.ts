import { describe, expect, it } from "vitest";
import { indiaDate, publicationDecision, contentIssues } from "../scripts/blog-publishing-policy.mjs";
import { prepareBlogPost } from "../scripts/prepared-blog-post.mjs";
import fs from "node:fs";

const schedule = {startDate:"2026-11-05",endDate:"2026-12-04",maxPostsPerDay:1};
describe("One-month blog publishing policy", () => {
  it("has a distinct prepared article for every date without an API dependency", () => {
    const calendar=JSON.parse(fs.readFileSync("content/blog/calendar.json","utf8"));
    const queue=fs.readdirSync("content/editorial").filter(file=>/^monthly-queue.*\.json$/.test(file)).flatMap(file=>JSON.parse(fs.readFileSync("content/editorial/"+file,"utf8")));
    const topics=calendar.filter(topic=>queue.some(entry=>entry.slug===topic.slug)&&topic.scheduledDate>=schedule.startDate&&topic.scheduledDate<=schedule.endDate);
    expect(topics).toHaveLength(30);
    expect(queue).toHaveLength(30);
    expect(new Set(topics.map(topic=>topic.scheduledDate)).size).toBe(30);
    const previous=[];
    for(const topic of topics){
      const article={...prepareBlogPost(topic,queue.find(entry=>entry.slug===topic.slug)),slug:topic.slug};
      expect(article.contentHtml.replace(/<[^>]+>/g," ").trim().split(/\s+/).length).toBeGreaterThanOrEqual(450);
      expect(contentIssues(article,previous)).toEqual([]);
      previous.push(article);
    }
  });
  it("uses the India calendar date, including across UTC midnight", () => {
    expect(indiaDate(new Date("2026-11-04T19:00:00Z"))).toBe("2026-11-05");
  });
  it("runs from November 5 through December 4 and stops outside the window", () => {
    expect(publicationDecision(schedule,[],new Date("2026-11-04T03:30:00Z")).allowed).toBe(false);
    expect(publicationDecision(schedule,[],new Date("2026-11-05T03:30:00Z")).allowed).toBe(true);
    expect(publicationDecision(schedule,[],new Date("2026-12-04T03:30:00Z")).allowed).toBe(true);
    expect(publicationDecision(schedule,[],new Date("2026-12-05T03:30:00Z")).allowed).toBe(false);
  });
  it("prevents duplicate daily publication while ignoring unpublished drafts", () => {
    const now=new Date("2026-11-05T03:30:00Z");
    expect(publicationDecision(schedule,[{isPublished:true,publishedDate:"2026-11-05"}],now).allowed).toBe(false);
    expect(publicationDecision(schedule,[{isPublished:false,publishedDate:"2026-11-05"}],now).allowed).toBe(true);
  });
  it("holds near-duplicate, unsafe and incomplete content for editorial review", () => {
    const article={slug:"new",contentHtml:"<p>A specific answer about interests and choosing a conversation topic with curiosity.</p>",faqs:[{question:"Which topic?",answer:"A hobby."},{question:"What next?",answer:"A question."}]};
    expect(contentIssues(article,[])).toEqual([]);
    expect(contentIssues(article,[{...article,slug:"previous"}]).join(" ")).toContain("repeats");
    expect(contentIssues({...article,contentHtml:article.contentHtml+'<script>alert(1)</script>'},[]).join(" ")).toContain("Unsafe");
    expect(contentIssues({...article,faqs:[]},[]).join(" ")).toContain("questions");
  });
});
