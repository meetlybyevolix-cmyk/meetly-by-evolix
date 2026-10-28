#!/usr/bin/env node
/**
 * Meetly — Operator Moderation CLI
 * Evolix Studio
 *
 * Allows server operators and moderators to review, triage, and action
 * safety reports submitted by users.
 *
 * Usage:
 *   node scripts/moderation-cli.js list [status] [priority]
 *   node scripts/moderation-cli.js stats
 *   node scripts/moderation-cli.js action <reportId> <status>
 */

import "dotenv/config";

const PORT = process.env.PORT || 3000;
const MODERATOR_KEY = process.env.MODERATOR_KEY || process.env.ADMIN_KEY || "";
const BASE_URL = `http://127.0.0.1:${PORT}`;

const headers = {
  "Content-Type": "application/json",
};
if (MODERATOR_KEY) {
  headers["X-Moderator-Key"] = MODERATOR_KEY;
}

async function getStats() {
  try {
    const res = await fetch(`${BASE_URL}/api/moderation/stats`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    console.log("\n--- Meetly Moderation Overview ---");
    console.log(`Total Reports:         ${data.stats.total}`);
    console.log(`Open (Pending):        ${data.stats.open}`);
    console.log(`High Priority Open:    ${data.stats.highPriorityOpen ?? 0}`);
    console.log(`Reviewed:              ${data.stats.reviewed}`);
    console.log(`Actioned:              ${data.stats.actioned}`);
    console.log(`Closed:                ${data.stats.closed}`);
    console.log("----------------------------------\n");
  } catch (err) {
    console.error("Failed to fetch stats:", err.message);
  }
}

async function listReports(status = "", priority = "") {
  try {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);

    const url = `${BASE_URL}/api/moderation/reports?${params.toString()}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();

    console.log(`\n--- Meetly Safety Reports (${data.reports.length}) ---`);
    if (data.reports.length === 0) {
      console.log("No reports matching criteria.");
    }
    for (const r of data.reports) {
      const prioTag = r.priority === "high" ? "[HIGH PRIORITY]" : `[${(r.priority || "NORMAL").toUpperCase()}]`;
      console.log(`\nID:          ${r.id}`);
      console.log(`Category:    ${r.category} ${prioTag}`);
      console.log(`Status:      [${r.status.toUpperCase()}]`);
      console.log(`Created:     ${new Date(r.createdAt).toISOString()}`);
      console.log(`Reporter:    ${r.reporterSessionHash.slice(0, 16)}...`);
      console.log(`Reported:    ${r.reportedSessionHash.slice(0, 16)}...`);
      if (r.description) console.log(`Description: ${r.description}`);
      if (r.selectedExcerpt) {
        console.log("Excerpt Preview:");
        console.log(r.selectedExcerpt.split("\n").map(l => `  | ${l}`).join("\n"));
      }
    }
    console.log("\n-----------------------------------------------\n");
  } catch (err) {
    console.error("Failed to list reports:", err.message);
  }
}

async function updateStatus(reportId, newStatus) {
  try {
    const valid = ["open", "reviewed", "actioned", "closed"];
    if (!valid.includes(newStatus)) {
      console.error(`Invalid status: ${newStatus}. Valid: ${valid.join(", ")}`);
      return;
    }
    const res = await fetch(`${BASE_URL}/api/moderation/reports/${encodeURIComponent(reportId)}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    console.log(`Report ${reportId} successfully updated to '${newStatus}' (success: ${data.success})`);
  } catch (err) {
    console.error("Failed to update report:", err.message);
  }
}

const [cmd, arg1, arg2] = process.argv.slice(2);

switch (cmd) {
  case "stats":
    await getStats();
    break;
  case "list":
    await listReports(arg1, arg2);
    break;
  case "action":
    if (!arg1 || !arg2) {
      console.error("Usage: node scripts/moderation-cli.js action <reportId> <status>");
      process.exit(1);
    }
    await updateStatus(arg1, arg2);
    break;
  default:
    console.log(`
Meetly Operator Moderation CLI (Evolix Studio)

Commands:
  stats                         Display count of open, high-priority, and actioned safety reports
  list [status] [priority]      List safety reports (e.g. 'list open', 'list open high')
  action <reportId> <status>    Update report status (open, reviewed, actioned, closed)
`);
    break;
}
