import { describe, expect, it } from "vitest";
import { indiaDate, publicationDecision, contentIssues } from "../scripts/blog-publishing-policy.mjs";

const schedule = {startDate:"2026-11-05",endDate:"2026-12-04",maxPostsPerDay:1};
describe("One-month blog publishing policy", () => {
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
