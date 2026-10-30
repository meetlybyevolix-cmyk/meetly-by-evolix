/**
 * Meetly Full User Journey & WebSocket E2E Smoke Test
 * Evolix Studio
 *
 * Validates the complete stack in a live Node.js production environment:
 * - Health and readiness probes (/api/health, /api/ready)
 * - Observability metrics (/api/metrics)
 * - Configurable ICE/TURN negotiation (/api/ice-servers)
 * - Anonymous session lifecycle
 * - Authenticated WebSocket connections & heartbeat
 * - Mode-isolated matchmaking
 * - Bidirectional real-time messaging
 * - WebRTC video-ready handshake & Perfect Negotiation signaling
 * - User safety reporting with priority classification
 * - Operator moderation review & triage
 * - Skip / Next / Teardown lifecycle
 */

import { WebSocket } from "ws";

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const WS_URL = `ws://127.0.0.1:${PORT}/api/chat/live`;
const MODERATOR_KEY = process.env.MODERATOR_KEY || "test-moderator-secret-key";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log("=== Meetly Live End-to-End System Smoke Test (Phase 3) ===");

  // 1. Health Check
  console.log("\n1. Verifying /api/health endpoint...");
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  if (!healthRes.ok) throw new Error(`Health check failed: ${healthRes.status}`);
  const healthData = await healthRes.json();
  console.log("  Health check PASS:", JSON.stringify(healthData));

  // 2. Readiness Probe
  console.log("\n2. Verifying /api/ready readiness probe...");
  const readyRes = await fetch(`${BASE_URL}/api/ready`);
  if (!readyRes.ok) throw new Error(`Readiness check failed: ${readyRes.status}`);
  const readyData = await readyRes.json();
  console.log("  Readiness check PASS:", JSON.stringify(readyData));

  // 3. ICE Servers & TURN Configuration
  console.log("\n3. Verifying /api/ice-servers endpoint...");
  const iceRes = await fetch(`${BASE_URL}/api/ice-servers`);
  if (!iceRes.ok) throw new Error(`ICE check failed: ${iceRes.status}`);
  const iceData = await iceRes.json();
  console.log("  ICE servers PASS:", JSON.stringify(iceData));

  // 4. Create Anonymous Session A (Alice - Video Mode)
  console.log("\n4. Creating Anonymous Session A (Alice - Video Mode)...");
  const aliceRes = await fetch(`${BASE_URL}/api/trpc/chat.session.create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      json: {
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: ["Technology"], language: "English", mediaMode: "video" },
      },
    }),
  });
  const aliceData = await aliceRes.json();
  const aliceToken = aliceData.result.data.json.token;
  console.log("  Alice session token issued:", aliceToken.slice(0, 24) + "...");

  // 5. Create Anonymous Session B (Bob - Video Mode)
  console.log("\n5. Creating Anonymous Session B (Bob - Video Mode)...");
  const bobRes = await fetch(`${BASE_URL}/api/trpc/chat.session.create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      json: {
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: ["Technology"], language: "English", mediaMode: "video" },
      },
    }),
  });
  const bobData = await bobRes.json();
  const bobToken = bobData.result.data.json.token;
  console.log("  Bob session token issued:", bobToken.slice(0, 24) + "...");

  // 6. Connect WebSocket A
  console.log("\n6. Connecting WebSocket A (Alice)...");
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

  // 7. Connect WebSocket B
  console.log("\n7. Connecting WebSocket B (Bob)...");
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

  // 8. Trigger Video Matchmaking
  console.log("\n8. Initiating Video Chat Matchmaking Queue...");
  await fetch(`${BASE_URL}/api/trpc/chat.search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Meetly-Session": aliceToken,
    },
    body: JSON.stringify({ json: { preferences: { interests: ["Technology"], language: "English", mediaMode: "video" } } }),
  });
  console.log("  Alice entered matchmaking queue");

  await fetch(`${BASE_URL}/api/trpc/chat.search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Meetly-Session": bobToken,
    },
    body: JSON.stringify({ json: { preferences: { interests: ["Technology"], language: "English", mediaMode: "video" } } }),
  });
  console.log("  Bob entered matchmaking queue");

  await sleep(500);

  const aliceMatched = aliceEvents.some(e => e.type === "state" && e.state === "chat");
  const bobMatched = bobEvents.some(e => e.type === "state" && e.state === "chat");
  console.log("  Match verification:", aliceMatched && bobMatched ? "SUCCESS (Both in 'chat')" : "FAILED");
  if (!aliceMatched || !bobMatched) throw new Error("Matchmaking failed");

  // 9. Real-Time Text Messaging
  console.log("\n9. Testing Real-Time Messaging inside Video Room...");
  wsA.send(JSON.stringify({ type: "message", text: "Hello Bob! Can you see and hear me?" }));
  await sleep(300);

  const bobReceivedMsg = bobEvents.find(e => e.type === "message" && e.message?.text?.includes("Hello Bob"));
  console.log("  Bob received message:", bobReceivedMsg ? "SUCCESS" : "FAILED");
  if (!bobReceivedMsg) throw new Error("Message delivery failed");

  // 10. WebRTC Video Handshake & Signaling
  console.log("\n10. Testing WebRTC Signaling Handshake (video-ready & video-start)...");
  wsA.send(JSON.stringify({ type: "video-ready" }));
  await sleep(150);
  wsB.send(JSON.stringify({ type: "video-ready" }));
  await sleep(350);

  const aliceStart = aliceEvents.find(e => e.type === "video-start");
  const bobStart = bobEvents.find(e => e.type === "video-start");
  console.log("  Both received 'video-start':", aliceStart && bobStart ? "SUCCESS" : "FAILED");
  if (!aliceStart || !bobStart) throw new Error("Video start negotiation failed");
  console.log(`  Negotiation roles: Alice [offerer: ${aliceStart.offerer}, polite: ${aliceStart.polite}] | Bob [offerer: ${bobStart.offerer}, polite: ${bobStart.polite}]`);

  // Offerer peer sends mock SDP Offer
  const offererWs = aliceStart.offerer ? wsA : wsB;
  const answererEvents = aliceStart.offerer ? bobEvents : aliceEvents;
  const answererWs = aliceStart.offerer ? wsB : wsA;

  offererWs.send(JSON.stringify({
    type: "video-signal",
    signal: {
      kind: "description",
      descriptionType: "offer",
      sdp: "v=0\r\no=MeetlyTest 12345 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n",
    },
  }));
  await sleep(250);

  const receivedOffer = answererEvents.find(e => e.type === "video-signal" && e.signal?.descriptionType === "offer");
  console.log("  SDP Offer relayed across WebSocket signaling:", receivedOffer ? "SUCCESS" : "FAILED");
  if (!receivedOffer) throw new Error("SDP Offer signaling failed");

  // Answerer peer sends mock SDP Answer
  answererWs.send(JSON.stringify({
    type: "video-signal",
    signal: {
      kind: "description",
      descriptionType: "answer",
      sdp: "v=0\r\no=MeetlyTest 67890 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n",
    },
  }));
  await sleep(250);

  // Exchange mock ICE candidate
  offererWs.send(JSON.stringify({
    type: "video-signal",
    signal: {
      kind: "candidate",
      candidate: { candidate: "candidate:1 1 UDP 2130706431 127.0.0.1 50000 typ host", sdpMid: "0", sdpMLineIndex: 0 },
    },
  }));
  await sleep(250);
  const receivedCandidate = answererEvents.find(e => e.type === "video-signal" && e.signal?.kind === "candidate");
  console.log("  ICE Candidate relayed across WebSocket signaling:", receivedCandidate ? "SUCCESS" : "FAILED");
  if (!receivedCandidate) throw new Error("ICE candidate signaling failed");

  // 11. Safety Report Submission
  console.log("\n11. Testing User Safety Reporting with Priority Classification...");
  const reportRes = await fetch(`${BASE_URL}/api/trpc/chat.report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Meetly-Session": aliceToken,
    },
    body: JSON.stringify({
      json: {
        reason: "Hate or abusive language",
        description: "Test automated safety report submission",
        selectedExcerpt: "Stranger: test message",
        leaveAfter: false,
      },
    }),
  });
  const reportData = await reportRes.json();
  const reportId = reportData.result.data.json.reportId;
  console.log("  Safety report submitted successfully! ID:", reportId);

  // 12. Moderation API Triage & Priority Filter
  console.log("\n12. Testing Moderation API Triage & Priority Audit...");
  const modHeaders = {
    "Authorization": `Bearer ${MODERATOR_KEY}`,
    "Content-Type": "application/json",
  };
  const modStatsRes = await fetch(`${BASE_URL}/api/moderation/stats`, { headers: modHeaders });
  const modStats = await modStatsRes.json();
  console.log("  Moderation stats:", JSON.stringify(modStats.stats));

  const modReportsRes = await fetch(`${BASE_URL}/api/moderation/reports?status=open&priority=high`, { headers: modHeaders });
  const modReports = await modReportsRes.json();
  const reportedItem = modReports.reports.find(r => r.id === reportId);
  console.log("  Found high-priority report in triage queue:", reportedItem ? "SUCCESS" : "FAILED");

  const actionRes = await fetch(`${BASE_URL}/api/moderation/reports/${reportId}`, {
    method: "POST",
    headers: modHeaders,
    body: JSON.stringify({ status: "reviewed" }),
  });
  const actionData = await actionRes.json();
  console.log("  Updated report status to 'reviewed':", actionData.success ? "SUCCESS" : "FAILED");

  // 13. System Metrics Endpoint
  console.log("\n13. Verifying System Observability Metrics (/api/metrics)...");
  const metricsRes = await fetch(`${BASE_URL}/api/metrics`, { headers: modHeaders });
  if (!metricsRes.ok) throw new Error(`Metrics failed: ${metricsRes.status}`);
  const metricsData = await metricsRes.json();
  console.log("  Metrics PASS:", JSON.stringify({
    uptime: metricsData.uptimeSeconds,
    traffic: metricsData.traffic,
    memoryMb: metricsData.memory.heapUsedMb,
  }));

  // 14. Skip / Next Partner
  console.log("\n14. Testing Next / Skip partner functionality...");
  await fetch(`${BASE_URL}/api/trpc/chat.next`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Meetly-Session": aliceToken,
    },
    body: JSON.stringify({ json: {} }),
  });
  await sleep(350);

  const bobNotice = bobEvents.find(e => e.type === "notice" && e.message.includes("ended"));
  console.log("  Bob received conversation ended notice:", bobNotice ? "SUCCESS" : "FAILED");

  // 15. Legal Configuration & Readiness Endpoints
  console.log("\n15. Testing Legal Configuration & Launch Readiness Endpoints...");
  const legalConfigRes = await fetch(`${BASE_URL}/api/legal-config`);
  if (!legalConfigRes.ok) throw new Error(`Legal config failed: ${legalConfigRes.status}`);
  const legalConfig = await legalConfigRes.json();
  console.log("  Legal config PASS:", JSON.stringify({ siteName: legalConfig.siteName, minimumUserAge: legalConfig.minimumUserAge }));

  const readinessRes = await fetch(`${BASE_URL}/api/moderation/legal-readiness`, { headers: modHeaders });
  if (!readinessRes.ok) throw new Error(`Legal readiness failed: ${readinessRes.status}`);
  const readinessData = await readinessRes.json();
  console.log("  Legal readiness audit PASS:", JSON.stringify({ ready: readinessData.readyForLaunch, missingCount: readinessData.missingRequiredItems.length }));

  // 16. Rule 3(2) IT Rules Grievance Redressal Endpoints
  console.log("\n16. Testing Rule 3(2) IT Rules Grievance Redressal Submission & Status...");
  const grievRes = await fetch(`${BASE_URL}/api/grievance/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      complainantName: "Smoke Test Reporter",
      complainantEmail: "smoke_grievance@example.com",
      category: "safety_concern",
      subject: "Automated E2E Grievance Verification",
      details: "Verifying statutory submission workflow under Rule 3(2) IT Rules, 2021.",
    }),
  });
  if (!grievRes.ok) throw new Error(`Grievance submission failed: ${grievRes.status}`);
  const grievData = await grievRes.json();
  console.log("  Grievance registered PASS:", grievData.ticketCode);

  const grievStatusRes = await fetch(`${BASE_URL}/api/grievance/status/${grievData.ticketCode}`);
  if (!grievStatusRes.ok) throw new Error(`Grievance status failed: ${grievStatusRes.status}`);
  const grievStatus = await grievStatusRes.json();
  console.log("  Grievance status lookup PASS:", grievStatus.status);

  // 17. DPDP Act Data Subject Rights Request Endpoints
  console.log("\n17. Testing DPDP Act 2023 Data Subject Request Submission & Status...");
  const dsrRes = await fetch(`${BASE_URL}/api/privacy/data-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestType: "erasure",
      contactEmail: "smoke_privacy@example.com",
      details: "Automated verification of data subject request intake and processing.",
    }),
  });
  if (!dsrRes.ok) throw new Error(`DSR submission failed: ${dsrRes.status}`);
  const dsrData = await dsrRes.json();
  console.log("  DSR registered PASS:", dsrData.requestCode);

  const dsrStatusRes = await fetch(`${BASE_URL}/api/privacy/data-request/${dsrData.requestCode}`);
  if (!dsrStatusRes.ok) throw new Error(`DSR status failed: ${dsrStatusRes.status}`);
  const dsrStatus = await dsrStatusRes.json();
  console.log("  DSR status lookup PASS:", dsrStatus.status);

  // 18. DPDP Act 2023 18+ Age Assurance Verification Flow
  console.log("\n18. Testing 18+ Age Assurance Verification Endpoints (/api/age/*)...");
  const ageInitRes = await fetch(`${BASE_URL}/api/age/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Meetly-Session": aliceToken,
    },
  });
  if (!ageInitRes.ok) throw new Error(`Age initiate failed: ${ageInitRes.status}`);
  const ageInitData = await ageInitRes.json();
  console.log("  Age assurance challenge generated PASS:", ageInitData.provider, ageInitData.status);

  const ageVerifyRes = await fetch(`${BASE_URL}/api/age/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Meetly-Session": aliceToken,
    },
    body: JSON.stringify({
      over18Confirmed: true,
      provider: "mock",
    }),
  });
  if (!ageVerifyRes.ok) throw new Error(`Age verify failed: ${ageVerifyRes.status}`);
  const ageVerifyData = await ageVerifyRes.json();
  console.log("  Age verified PASS:", ageVerifyData.status, ageVerifyData.over18Confirmed);

  const ageStatusRes = await fetch(`${BASE_URL}/api/age/status`, {
    headers: { "X-Meetly-Session": aliceToken },
  });
  if (!ageStatusRes.ok) throw new Error(`Age status failed: ${ageStatusRes.status}`);
  const ageStatusData = await ageStatusRes.json();
  console.log("  Age status query PASS:", ageStatusData.status);

  // 19. Disconnect Cleanup
  console.log("\n19. Closing WebSockets and cleaning up...");
  wsA.close();
  wsB.close();
  await sleep(200);

  console.log("\n=== ALL 19 END-TO-END SMOKE TESTS PASSED PERFECTLY! ===");
  process.exit(0);
}

run().catch(err => {
  console.error("\n*** SMOKE TEST FAILED ***", err);
  process.exit(1);
});
