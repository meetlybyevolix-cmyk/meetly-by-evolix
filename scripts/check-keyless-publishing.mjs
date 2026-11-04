// Exercise a full month in an isolated fixture with all network fetches blocked.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const source = process.cwd();
fs.mkdirSync(path.join(source,"output"),{recursive:true});
const fixture = fs.mkdtempSync(path.join(source,"output/blog-keyless-"));
for (const folder of ["scripts","content/blog","content/editorial","client/public"]) fs.mkdirSync(path.join(fixture,folder),{recursive:true});
fs.writeFileSync(path.join(fixture,"package.json"),'{"type":"module"}');
const files = ["scripts/daily-blog-engine.js","scripts/blog-publishing-policy.mjs","scripts/prepared-blog-post.mjs","content/blog/articles.json","content/blog/calendar.json","content/blog/publishing-schedule.json","client/public/sitemap.xml"];
for (const name of fs.readdirSync(path.join(source,"content/editorial")).filter(name=>/^monthly-queue.*\.json$/.test(name))) files.push("content/editorial/"+name);
for (const file of files) fs.copyFileSync(path.join(source,file),path.join(fixture,file));
const clock = path.join(fixture,"clock.mjs");
fs.writeFileSync(clock,`const RealDate=Date;const stamp=RealDate.parse(process.env.MEETLY_TEST_DATE+'T03:30:00Z');globalThis.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[stamp]));}static now(){return stamp;}};globalThis.fetch=()=>{throw new Error('Network access is forbidden in keyless publishing tests');};`);
const read = () => JSON.parse(fs.readFileSync(path.join(fixture,"content/blog/articles.json"),"utf8"));
const original = read();
const schedule = JSON.parse(fs.readFileSync(path.join(fixture,"content/blog/publishing-schedule.json"),"utf8"));
const env = {...process.env};
delete env.GEMINI_API_KEY; delete env.GOOGLE_AI_API_KEY; delete env.GEMINI_MODEL; delete env.BLOG_AUTOMATION_PAUSED;
const run = date => {
  const result = spawnSync(process.execPath,["--import",pathToFileURL(clock).href,"scripts/daily-blog-engine.js"],{cwd:fixture,env:{...env,MEETLY_TEST_DATE:date},encoding:"utf8"});
  assert.equal(result.status,0,`Publisher failed on ${date}: ${result.stderr}\n${result.stdout}`);
  return result.stdout;
};
let newlyPublished = 0;
for (let date=new Date(schedule.startDate+"T00:00:00Z");date.toISOString().slice(0,10)<=schedule.endDate;date.setUTCDate(date.getUTCDate()+1)) {
  const day=date.toISOString().slice(0,10);
  const before=read();
  const already=before.some(article=>article.isPublished&&article.publishedDate===day);
  const calendar=JSON.parse(fs.readFileSync(path.join(fixture,"content/blog/calendar.json"),"utf8"));
  const hasDueTopic=calendar.some(topic=>topic.status==="scheduled"&&topic.scheduledDate<=day);
  run(day);
  const after=read();
  const shouldPublish=!already&&hasDueTopic;
  assert.equal(after.length,before.length+(shouldPublish?1:0));
  if(shouldPublish){assert.equal(after.at(-1).publishedDate,day);newlyPublished++;}
  const snapshot=JSON.stringify(after);
  run(day);
  assert.equal(JSON.stringify(read()),snapshot,"Rerun published a duplicate on "+day);
}
const snapshot=JSON.stringify(read());
assert(run("2026-12-05").includes("Outside the one-month publishing window"));
assert.equal(JSON.stringify(read()),snapshot);
for(const article of original) assert.deepEqual(read().find(item=>item.slug===article.slug),article);
assert.equal(new Set(read().map(article=>article.slug)).size,read().length);
console.log(`Keyless publisher passed: ${newlyPublished} upcoming posts, daily rerun protection, stop date, unchanged existing posts and no network access. Fixture: ${fixture}`);
