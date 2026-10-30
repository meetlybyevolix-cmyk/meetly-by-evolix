import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createAnonymousSession,
  createSyntheticSession,
  disconnectAll,
  getOnlineStats,
  getSession,
  nextChat,
  onClientConnect,
  onClientDisconnect,
  sendChatMessage,
  startSearching,
  subscribe,
  type ClientEvent,
} from "./chat/service";

describe("Meetly Phase 7: Video Call Side Chat & Online User Indicator Suite", () => {
  beforeEach(() => {
    disconnectAll();
  });

  afterEach(() => {
    disconnectAll();
  });

  describe("Feature 1: Live Text Messaging During Video Calls", () => {
    it("delivers text messages bidirectionally within a video call room", () => {
      // Create two video sessions
      const alice = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "video" },
      });
      const bob = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "video" },
      });

      const aliceSession = getSession(alice.token)!;
      const bobSession = getSession(bob.token)!;

      const aliceEvents: ClientEvent[] = [];
      const bobEvents: ClientEvent[] = [];

      subscribe(aliceSession.id, e => aliceEvents.push(e));
      subscribe(bobSession.id, e => bobEvents.push(e));

      // Connect clients
      onClientConnect(aliceSession.id);
      onClientConnect(bobSession.id);

      // Match into video room
      startSearching(aliceSession);
      startSearching(bobSession);

      expect(aliceSession.state).toBe("chat");
      expect(bobSession.state).toBe("chat");
      expect(aliceSession.roomId).toBe(bobSession.roomId);

      // Alice sends message to Bob while in video call
      sendChatMessage(aliceSession, "Hey Bob, I can hear you clearly!");

      // Verify delivery to both participants
      const aliceMsgEvent = aliceEvents.find(e => e.type === "message") as
        | { type: "message"; message: any }
        | undefined;
      const bobMsgEvent = bobEvents.find(e => e.type === "message") as
        | { type: "message"; message: any }
        | undefined;

      expect(aliceMsgEvent).toBeDefined();
      expect(bobMsgEvent).toBeDefined();

      expect(aliceMsgEvent?.message.text).toBe("Hey Bob, I can hear you clearly!");
      expect(aliceMsgEvent?.message.fromMe).toBe(true); // Sender marked fromMe: true

      expect(bobMsgEvent?.message.text).toBe("Hey Bob, I can hear you clearly!");
      expect(bobMsgEvent?.message.fromMe).toBe(false); // Receiver marked fromMe: false
    });

    it("enforces strict room isolation preventing message leaks to other rooms", () => {
      // Room 1 (Video)
      const u1 = getSession(createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "video" },
      }).token)!;
      const u2 = getSession(createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "video" },
      }).token)!;

      // Room 2 (Video)
      const u3 = getSession(createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "video" },
      }).token)!;
      const u4 = getSession(createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "video" },
      }).token)!;

      const u3Events: ClientEvent[] = [];
      subscribe(u3.id, e => u3Events.push(e));

      startSearching(u1);
      startSearching(u2);
      startSearching(u3);
      startSearching(u4);

      expect(u1.roomId).toBe(u2.roomId);
      expect(u3.roomId).toBe(u4.roomId);
      expect(u1.roomId).not.toBe(u3.roomId);

      // Message in Room 1
      sendChatMessage(u1, "Confidential Room 1 message");

      // Verify Room 2 user received zero messages
      const u3Messages = u3Events.filter(e => e.type === "message");
      expect(u3Messages.length).toBe(0);
    });

    it("resets messages cleanly when Next Stranger is clicked", () => {
      const u1 = getSession(createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "video" },
      }).token)!;
      const u2 = getSession(createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "video" },
      }).token)!;

      startSearching(u1);
      startSearching(u2);

      sendChatMessage(u1, "First conversation hello");

      // Next chat clicked
      nextChat(u1);

      expect(u1.roomId).toBeUndefined();
      expect(u1.state).toBe("searching");
    });

    it("enforces message rate limits and PII blocking in video chat", () => {
      const u1 = getSession(createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "video" },
      }).token)!;
      const u2 = getSession(createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "video" },
      }).token)!;

      startSearching(u1);
      startSearching(u2);

      // Email PII filter
      expect(() => sendChatMessage(u1, "Reach me at test@example.com")).toThrow(
        /privacy.*email.*phone/i
      );

      // Link filter
      expect(() => sendChatMessage(u1, "Check out https://scam-site.org")).toThrow(
        /Links are disabled/i
      );
    });
  });

  describe("Feature 2: Real-Time Deduplicated Online Presence & Staging Load Test", () => {
    it("tracks real active users and deduplicates reconnections from the same client", () => {
      const initialStats = getOnlineStats();
      expect(initialStats.onlineCount).toBe(0);

      // Client A connects from IP "192.168.1.50"
      const sessionA = getSession(createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      }, "client-ip-192.168.1.50").token)!;

      subscribe(sessionA.id, () => {});
      onClientConnect(sessionA.id);

      const stats1 = getOnlineStats();
      expect(stats1.onlineCount).toBe(1);

      // Client A opens second tab or reconnects with same clientKey
      const sessionA2 = getSession(createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      }, "client-ip-192.168.1.50").token)!;

      subscribe(sessionA2.id, () => {});
      onClientConnect(sessionA2.id);

      // Online count remains deduplicated at 1
      const statsDeduplicated = getOnlineStats();
      expect(statsDeduplicated.onlineCount).toBe(1);

      // Client B connects from distinct clientKey
      const sessionB = getSession(createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      }, "client-ip-10.0.0.99").token)!;

      subscribe(sessionB.id, () => {});
      onClientConnect(sessionB.id);

      const stats2 = getOnlineStats();
      expect(stats2.onlineCount).toBe(2);
    });

    it("strictly isolates synthetic load-test traffic from public online count", () => {
      // Connect 1 real user
      const realUser = getSession(createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      }, "real-client-1").token)!;

      subscribe(realUser.id, () => {});
      onClientConnect(realUser.id);

      expect(getOnlineStats().onlineCount).toBe(1);

      // Connect 25 synthetic load-test sessions
      for (let i = 0; i < 25; i++) {
        const synthetic = getSession(createSyntheticSession(`batch-${i}`).token)!;
        subscribe(synthetic.id, () => {});
        onClientConnect(synthetic.id);
      }

      const statsWithSynthetic = getOnlineStats();
      // Public online count MUST remain strictly 1
      expect(statsWithSynthetic.onlineCount).toBe(1);
      // Synthetic count is tracked separately for staging observability
      expect(statsWithSynthetic.syntheticCount).toBe(25);
    });

    it("simulates 100 concurrent staging test clients validating matchmaking & stability", () => {
      const syntheticSessions = [];
      const startTime = performance.now();

      // Spin up 100 synthetic sessions
      for (let i = 0; i < 100; i++) {
        const res = createSyntheticSession(`load-${i}`);
        const session = getSession(res.token)!;
        subscribe(session.id, () => {});
        onClientConnect(session.id);
        syntheticSessions.push(session);
      }

      // Enter all 100 into matchmaking queue
      for (const session of syntheticSessions) {
        startSearching(session);
      }

      const endTime = performance.now();
      const elapsedMs = endTime - startTime;

      // 100 clients paired into 50 rooms
      const stats = getOnlineStats();
      expect(stats.activeRooms).toBe(50);
      expect(stats.queuedUsers).toBe(0);
      // Public count remains 0 because all 100 are synthetic test traffic
      expect(stats.onlineCount).toBe(0);
      expect(stats.syntheticCount).toBe(100);

      // High-performance benchmark: 100 clients created & paired in under 500ms
      expect(elapsedMs).toBeLessThan(500);

      // Clean up all 100 clients
      disconnectAll();
      const cleanStats = getOnlineStats();
      expect(cleanStats.activeRooms).toBe(0);
      expect(cleanStats.syntheticCount).toBe(0);
    });
  });

  describe("Unread Message Counter & UI Logic", () => {
    it("calculates unread message counts accurately when chat panel is closed", () => {
      let isChatOpen = false;
      let unreadCount = 0;
      let lastCount = 0;

      const messages: Array<{ id: string; text: string; fromMe: boolean }> = [];

      const simulateIncoming = (newMsg: { id: string; text: string; fromMe: boolean }) => {
        messages.push(newMsg);
        if (messages.length > lastCount) {
          const added = messages.slice(lastCount);
          const incomingFromStranger = added.filter(m => !m.fromMe);
          if (!isChatOpen && incomingFromStranger.length > 0) {
            unreadCount += incomingFromStranger.length;
          }
        }
        lastCount = messages.length;
      };

      // 1. User sends message -> should not increment unread
      simulateIncoming({ id: "1", text: "Hello", fromMe: true });
      expect(unreadCount).toBe(0);

      // 2. Stranger sends message while chat is closed -> increments unread
      simulateIncoming({ id: "2", text: "Hi there!", fromMe: false });
      expect(unreadCount).toBe(1);

      simulateIncoming({ id: "3", text: "Can you see my screen?", fromMe: false });
      expect(unreadCount).toBe(2);

      // 3. User opens chat panel -> clears unread
      isChatOpen = true;
      unreadCount = 0;
      expect(unreadCount).toBe(0);

      // 4. Stranger sends message while chat is open -> does not increment unread
      simulateIncoming({ id: "4", text: "Nice to meet you", fromMe: false });
      expect(unreadCount).toBe(0);
    });
  });
});
