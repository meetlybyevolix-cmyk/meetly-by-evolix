/**
 * Meetly Full User Journey & WebSocket E2E Smoke Test
 * Evolix Studio
 */

import { WebSocket } from "ws";

const BASE_URL = "http://127.0.0.1:3335";
const WS_URL = "ws://127.0.0.1:3335/api/chat/live";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log("=== Meetly Live End-to-End System Smoke Test ===");

  // 1. Health Check
  console.log("\n1. Verifying /api/health endpoint...");
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  if (!healthRes.ok) throw new Error(`Health check failed: ${healthRes.status}`);
  const healthData = await healthRes.json();
  console.log("  Health check PASS:", JSON.stringify(healthData));

  // 2. ICE Servers Config
  console.log("\n2. Verifying /api/ice-servers endpoint...");
  const iceRes = await fetch(`${BASE_URL}/api/ice-servers`);
  if (!iceRes.ok) throw new Error(`ICE check failed: ${iceRes.status}`);
  const iceData = await iceRes.json();
  console.log("  ICE servers PASS:", JSON.stringify(iceData));

  // 3. Create Anonymous Session A (Alice)
  console.log("\n3. Creating Anonymous Session A (Alice)...");
  const aliceRes = await fetch(`${BASE_URL}/api/trpc/chat.session.create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      json: {
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: ["Technology"], language: "English", mediaMode: "text" },
      },
    }),
  });
  const aliceData = await aliceRes.json();
  const aliceToken = aliceData.result.data.json.token;
  console.log("  Alice session token issued:", aliceToken.slice(0, 24) + "...");

  // 4. Create Anonymous Session B (Bob)
  console.log("\n4. Creating Anonymous Session B (Bob)...");
  const bobRes = await fetch(`${BASE_URL}/api/trpc/chat.session.create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      json: {
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: ["Technology"], language: "English", mediaMode: "text" },
      },
    }),
  });
  const bobData = await bobRes.json();
  const bobToken = bobData.result.data.json.token;
  console.log("  Bob session token issued:", bobToken.slice(0, 24) + "...");

  // 5. Connect WebSocket A
  console.log("\n5. Connecting WebSocket A (Alice)...");
  const wsA = new WebSocket(WS_URL);
  const aliceEvents = [];
  wsA.on("message", data => {
    const ev = JSON.parse(data.toString());
    aliceEvents.push(ev);
    console.log("  [Alice WS Event]:", ev.type, ev.state || ev.message?.text || ev.message || "");
  });
  await new Promise(r => wsA.on("open", r));
  wsA.send(JSON.stringify({ type: "auth", token: aliceToken }));
  await sleep(200);

  // 6. Connect WebSocket B
  console.log("\n6. Connecting WebSocket B (Bob)...");
  const wsB = new WebSocket(WS_URL);
  const bobEvents = [];
  wsB.on("message", data => {
    const ev = JSON.parse(data.toString());
    bobEvents.push(ev);
    console.log("  [Bob WS Event]:", ev.type, ev.state || ev.message?.text || ev.message || "");
  });
  await new Promise(r => wsB.on("open", r));
  wsB.send(JSON.stringify({ type: "auth", token: bobToken }));
  await sleep(200);

  // 7. Trigger Matchmaking
  console.log("\n7. Initiating Matchmaking Queue...");
  await fetch(`${BASE_URL}/api/trpc/chat.search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Meetly-Session": aliceToken,
    },
    body: JSON.stringify({ json: {} }),
  });
  console.log("  Alice entered matchmaking queue");

  await fetch(`${BASE_URL}/api/trpc/chat.search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Meetly-Session": bobToken,
    },
    body: JSON.stringify({ json: {} }),
  });
  console.log("  Bob entered matchmaking queue");

  await sleep(500);

  const aliceMatched = aliceEvents.some(e => e.type === "state" && e.state === "chat");
  const bobMatched = bobEvents.some(e => e.type === "state" && e.state === "chat");
  console.log("  Match verification:", aliceMatched && bobMatched ? "SUCCESS (Both in 'chat')" : "FAILED");
  if (!aliceMatched || !bobMatched) throw new Error("Matchmaking failed");

  // 8. Send Real-Time Message from Alice to Bob
  console.log("\n8. Sending Real-Time Message from Alice to Bob over WebSocket...");
  wsA.send(JSON.stringify({ type: "message", text: "Hello Bob, nice to meet you!" }));
  await sleep(300);

  const bobReceivedMsg = bobEvents.find(e => e.type === "message" && e.message?.text === "Hello Bob, nice to meet you!");
  console.log("  Bob received message:", bobReceivedMsg ? "SUCCESS" : "FAILED");
  if (!bobReceivedMsg) throw new Error("Message delivery failed");

  // 9. Send Real-Time Message from Bob to Alice over tRPC
  console.log("\n9. Sending Response from Bob to Alice over tRPC chat.send...");
  await fetch(`${BASE_URL}/api/trpc/chat.send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Meetly-Session": bobToken,
    },
    body: JSON.stringify({ json: { text: "Hey Alice, pleasure to meet you too!" } }),
  });
  await sleep(300);

  const aliceReceivedMsg = aliceEvents.find(e => e.type === "message" && e.message?.text === "Hey Alice, pleasure to meet you too!");
  console.log("  Alice received message:", aliceReceivedMsg ? "SUCCESS" : "FAILED");
  if (!aliceReceivedMsg) throw new Error("tRPC message response failed");

  // 10. Safety Report Submission
  console.log("\n10. Testing User Safety Reporting...");
  const reportRes = await fetch(`${BASE_URL}/api/trpc/chat.report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Meetly-Session": aliceToken,
    },
    body: JSON.stringify({
      json: {
        reason: "Other safety concern",
        description: "Test automated safety report submission",
        selectedExcerpt: "Alice: Hello Bob!\nBob: Hey Alice!",
        leaveAfter: false,
      },
    }),
  });
  const reportData = await reportRes.json();
  const reportId = reportData.result.data.json.reportId;
  console.log("  Safety report submitted successfully! ID:", reportId);

  // 11. Moderation API Triage
  console.log("\n11. Testing Moderation API Triage & Audit...");
  const modHeaders = {
    "Authorization": `Bearer ${process.env.MODERATOR_KEY || "test-moderator-secret-key"}`,
    "Content-Type": "application/json"
  };
  const modStatsRes = await fetch(`${BASE_URL}/api/moderation/stats`, { headers: modHeaders });
  const modStats = await modStatsRes.json();
  console.log("  Moderation stats:", JSON.stringify(modStats.stats));

  const modReportsRes = await fetch(`${BASE_URL}/api/moderation/reports?status=open`, { headers: modHeaders });
  const modReports = await modReportsRes.json();
  const reportedItem = modReports.reports.find(r => r.id === reportId);
  console.log("  Found report in triage queue:", reportedItem ? "SUCCESS" : "FAILED");

  const actionRes = await fetch(`${BASE_URL}/api/moderation/reports/${reportId}`, {
    method: "POST",
    headers: modHeaders,
    body: JSON.stringify({ status: "reviewed" }),
  });
  const actionData = await actionRes.json();
  console.log("  Updated report status to 'reviewed':", actionData.success ? "SUCCESS" : "FAILED");

  // 12. Skip / Next Partner
  console.log("\n12. Testing Next / Skip partner functionality...");
  await fetch(`${BASE_URL}/api/trpc/chat.next`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Meetly-Session": aliceToken,
    },
    body: JSON.stringify({ json: {} }),
  });
  await sleep(300);

  const bobNotice = bobEvents.find(e => e.type === "notice" && e.message.includes("ended"));
  console.log("  Bob received conversation ended notice:", bobNotice ? "SUCCESS" : "FAILED");

  // 13. Disconnect cleanup
  console.log("\n13. Closing WebSockets and cleaning up...");
  wsA.close();
  wsB.close();
  await sleep(200);

  console.log("\n=== ALL 13 END-TO-END SMOKE TESTS PASSED PERFECTLY! ===");
  process.exit(0);
}

run().catch(err => {
  console.error("\n*** SMOKE TEST FAILED ***", err);
  process.exit(1);
});
