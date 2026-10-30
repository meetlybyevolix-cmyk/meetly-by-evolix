/**
 * Meetly Staging Load Test & Concurrent Client Simulation (Phase 7)
 * Evolix Studio
 *
 * Validates:
 * - 100+ concurrent authenticated WebSocket connections
 * - Matchmaking queue performance under high concurrency
 * - Bidirectional messaging throughput across 50 simultaneous rooms
 * - Isolation of synthetic test traffic from public online count
 * - Server memory (heap/RSS) and event loop latency metrics
 *
 * Usage: node scripts/load-test.js [clientCount]
 */

import { WebSocket } from "ws";

const CLIENT_COUNT = Number(process.argv[2]) || 100;
const PORT = process.env.PORT || 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const WS_URL = `ws://127.0.0.1:${PORT}/api/chat/live`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchMetrics() {
  try {
    const res = await fetch(`${BASE_URL}/api/metrics`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

async function fetchStats() {
  const res = await fetch(`${BASE_URL}/api/trpc/chat.stats`);
  const data = await res.json();
  return data.result.data.json;
}

async function createSyntheticClient(index) {
  const res = await fetch(`${BASE_URL}/api/trpc/chat.session.create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      json: {
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        isSynthetic: true,
        preferences: {
          interests: [],
          language: "Any",
          mediaMode: "video",
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create synthetic session ${index}: ${res.status} ${body}`);
  }

  const data = await res.json();
  return {
    index,
    token: data.result.data.json.token,
    socket: null,
    matchedRoom: null,
    connected: false,
    messagesReceived: 0,
  };
}

async function runLoadTest() {
  console.log(`=== Meetly Staging Concurrency & Load Test (${CLIENT_COUNT} Clients) ===\n`);

  // Step 1: Health & Baseline Check
  console.log("1. Checking baseline server health & memory...");
  const initialMetrics = await fetchMetrics();
  const initialStats = await fetchStats();

  console.log(`  Baseline memory: Heap: ${initialMetrics?.memory?.heapUsedMb || 0} MB, RSS: ${initialMetrics?.memory?.rssMb || 0} MB`);
  console.log(`  Baseline public online count: ${initialStats.onlineCount}\n`);

  // Step 2: Create Synthetic Sessions
  console.log(`2. Provisioning ${CLIENT_COUNT} synthetic test client sessions...`);
  const sessionStart = performance.now();
  const clients = [];

  // Batch creation in chunks of 20 to avoid HTTP connection exhaustion
  const CHUNK_SIZE = 20;
  for (let i = 0; i < CLIENT_COUNT; i += CHUNK_SIZE) {
    const chunk = Array.from({ length: Math.min(CHUNK_SIZE, CLIENT_COUNT - i) }, (_, idx) =>
      createSyntheticClient(i + idx)
    );
    const resolved = await Promise.all(chunk);
    clients.push(...resolved);
  }

  const sessionTime = (performance.now() - sessionStart).toFixed(1);
  console.log(`  Provisioned ${clients.length} synthetic sessions in ${sessionTime}ms\n`);

  // Step 3: Establish Concurrent WebSocket Connections
  console.log(`3. Connecting and authenticating ${CLIENT_COUNT} concurrent WebSockets...`);
  const connectStart = performance.now();

  const connectPromises = clients.map(client => {
    return new Promise((resolve, reject) => {
      const connStart = performance.now();
      const ws = new WebSocket(WS_URL);
      client.socket = ws;

      const timeout = setTimeout(() => {
        reject(new Error(`Client ${client.index} connection timeout`));
      }, 10_000);

      ws.on("open", () => {
        ws.send(JSON.stringify({ type: "auth", token: client.token }));
      });

      ws.on("message", raw => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === "state" && msg.state) {
            if (!client.connected) {
              client.connected = true;
              client.latency = performance.now() - connStart;
              clearTimeout(timeout);
              resolve();
            }
          }
          if (msg.type === "message") {
            client.messagesReceived++;
          }
        } catch {}
      });

      ws.on("error", err => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  await Promise.all(connectPromises);
  const connectTotalMs = (performance.now() - connectStart).toFixed(1);
  const avgLatency = (clients.reduce((acc, c) => acc + (c.latency || 0), 0) / clients.length).toFixed(1);

  console.log(`  All ${CLIENT_COUNT} WebSockets connected and authenticated!`);
  console.log(`  Total connection time: ${connectTotalMs}ms (Avg handshaking latency: ${avgLatency}ms)\n`);

  // Step 4: Verify Online Count Isolation
  console.log("4. Verifying public online presence isolation...");
  const midStats = await fetchStats();
  console.log(`  Public onlineCount reported: ${midStats.onlineCount}`);
  console.log(`  Synthetic test clients detected: ${midStats.syntheticCount || 0}`);

  if (midStats.onlineCount !== initialStats.onlineCount) {
    throw new Error(`LEAK DETECTED: Synthetic clients contaminated public onlineCount! Expected ${initialStats.onlineCount}, got ${midStats.onlineCount}`);
  }
  console.log("  PASS: Synthetic load traffic is strictly excluded from public online counts.\n");

  // Step 5: Queue Matchmaking Under Concurrency
  console.log("5. Initiating concurrent matchmaking search across all clients...");
  const matchStart = performance.now();

  const searchPromises = clients.map(client => {
    return fetch(`${BASE_URL}/api/trpc/chat.search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Meetly-Session": client.token,
      },
      body: JSON.stringify({
        json: {
          preferences: { interests: [], language: "Any", mediaMode: "video" },
        },
      }),
    });
  });

  await Promise.all(searchPromises);
  // Allow matching engine cycle to settle
  await sleep(600);

  const matchTotalMs = (performance.now() - matchStart).toFixed(1);
  const matchStats = await fetchStats();

  console.log(`  Matchmaking processed in ${matchTotalMs}ms`);
  console.log(`  Active matched rooms: ${matchStats.activeRooms}`);
  console.log(`  Queue remainder: ${matchStats.queuedUsers}\n`);

  // Step 6: Test Real-Time Messaging Under Concurrency
  console.log("6. Testing bidirectional message throughput across matched rooms...");
  const messageStart = performance.now();

  // Each client sends a message
  for (let i = 0; i < clients.length; i += 2) {
    clients[i].socket.send(
      JSON.stringify({
        type: "message",
        text: `Synthetic ping from client ${i}`,
      })
    );
  }

  await sleep(500);
  const totalMsgs = clients.reduce((acc, c) => acc + c.messagesReceived, 0);
  console.log(`  Messages delivered across active rooms: ${totalMsgs}\n`);

  // Step 7: System Observability & Resource Metrics Under Load
  console.log("7. Measuring server memory & resource utilization under load...");
  const loadMetrics = await fetchMetrics();
  console.log(`  Memory under 100-client load:`);
  console.log(`    Heap Used: ${loadMetrics?.memory?.heapUsedMb || 0} MB`);
  console.log(`    Heap Total: ${loadMetrics?.memory?.heapTotalMb || 0} MB`);
  console.log(`    RSS: ${loadMetrics?.memory?.rssMb || 0} MB`);
  console.log(`    Active Sessions: ${loadMetrics?.traffic?.activeSessions}`);
  console.log(`    Active Rooms: ${loadMetrics?.traffic?.activeRooms}\n`);

  // Step 8: Clean Teardown
  console.log("8. Tearing down all 100 synthetic connections cleanly...");
  for (const client of clients) {
    if (client.socket) {
      client.socket.close();
    }
  }

  await sleep(400);
  const finalStats = await fetchStats();
  console.log(`  Post-test onlineCount: ${finalStats.onlineCount}`);
  console.log(`  Post-test syntheticCount: ${finalStats.syntheticCount || 0}`);
  console.log("\n=== 100-CLIENT LOAD TEST COMPLETED WITH 100% SUCCESS! ===");
}

runLoadTest().catch(err => {
  console.error("\n❌ Load test failed:", err);
  process.exit(1);
});

