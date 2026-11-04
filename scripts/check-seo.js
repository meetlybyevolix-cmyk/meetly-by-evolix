// Run after pnpm build or pnpm build:static. Optional live local HTTP checks:
// node scripts/check-seo.js http://127.0.0.1:3100
import fs from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";

const dist = path.resolve("dist/public");
const sitemap = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert.equal(new Set(urls).size, urls.length, "Duplicate sitemap URLs");
assert(!urls.some(url => url.includes("/404")), "Errors must not be in sitemap");
const titles = new Set();
for (const url of urls) {
  const route = new URL(url).pathname;
  const html = fs.readFileSync(path.join(dist, route, "index.html"), "utf8");
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  assert(title && !titles.has(title), `Missing/duplicate title: ${url}`);
  titles.add(title);
  assert(html.includes(`rel="canonical" href="${url}"`), `Wrong canonical: ${url}`);
  assert(!/<meta name="robots" content="noindex/.test(html), `Unexpected noindex: ${url}`);
  assert(/<h1[\s>]/.test(html), `Missing H1: ${url}`);
  for (const match of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
  if (route.startsWith("/blog/")) {
    assert(html.includes('"@type":"BlogPosting"'), `Missing article schema: ${url}`);
    assert(html.includes('property="og:type" content="article"'), `Wrong article type: ${url}`);
  }
}
const content = JSON.parse(fs.readFileSync("content/discovery.json", "utf8"));
for (const [route, sections] of Object.entries(content)) {
  const html = fs.readFileSync(path.join(dist, route, "index.html"), "utf8");
  for (const section of sections) assert(html.includes(section.heading), `Shared discovery content missing: ${route}`);
}
assert(fs.readFileSync(path.join(dist, "404.html"), "utf8").includes('content="noindex, follow"'));
if (process.argv[2]) {
  const base = process.argv[2].replace(/\/$/, "");
  for (const url of urls) {
    const route = new URL(url).pathname;
    const response = await fetch(base + route);
    assert.equal(response.status, 200, `HTTP error on ${route}`);
    assert((await response.text()).includes(`rel="canonical" href="${url}"`));
  }
  assert.equal((await fetch(base + "/missing-seo-test-page")).status, 404);
  assert.equal((await fetch(base + "/blog/not-a-published-guide")).status, 404);
  const redirect = await fetch(base + "/guidelines", { redirect: "manual" });
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get("location"), "/community-guidelines");
}
console.log(`SEO checks passed: ${urls.length} canonical pages, unique titles, readable content, valid schema, sitemap and 404${process.argv[2] ? ", HTTP statuses and aliases" : ""}.`);
