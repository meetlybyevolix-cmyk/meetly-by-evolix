import { beforeEach, describe, expect, it } from "vitest";
import {
  activePartnerId,
  assertReportLimit,
  assertSearchLimit,
  blockAndLeave,
  createAnonymousSession,
  disconnectAll,
  endChat,
  forwardVideoSignal,
  getOnlineStats,
  getSession,
  getState,
  markVideoReady,
  nextChat,
  onClientConnect,
  onClientDisconnect,
  sendChatMessage,
  startSearching,
  stopVideo,
  subscribe,
  type MediaMode,
  type VideoSignal,
} from "./chat/service";
import {
  getSafetyReportStats,
  insertSafetyReport,
  listSafetyReports,
  updateSafetyReportStatus,
} from "./db";

const basePreferences = {
  interests: ["Technology", "Gaming"],
  language: "English",
  mediaMode: "text" as MediaMode,
};

function createTestSession(overrides: Partial<typeof basePreferences> = {}) {
  const preferences = { ...basePreferences, ...overrides };
  const result = createAnonymousSession({
    ageConfirmed: true,
    termsAccepted: true,
    privacyAccepted: true,
    preferences,
  }, `client-ip-${crypto.randomUUID()}`);
  const session = getSession(result.token);
  if (!session) throw new Error("Failed to create test session");
  return session;
}

describe("Meetly End-to-End Core Integration Suite", () => {
  beforeEach(() => {
    disconnectAll();
  });

  describe("1. Anonymous Session Management", () => {
    it("creates unique session with cryptographic signature", () => {
      const s1 = createTestSession();
      const s2 = createTestSession();

      expect(s1.id).not.toBe(s2.id);
      expect(s1.token).toContain(".");
      expect(getSession(s1.token)).toBeDefined();
      expect(getSession("invalid.fake.token")).toBeUndefined();
    });

    it("enforces consent requirement and rejects without acceptance", () => {
      expect(() =>
        createAnonymousSession({
          ageConfirmed: false,
          termsAccepted: true,
          privacyAccepted: true,
          preferences: basePreferences,
        })
      ).toThrow("Confirm adult eligibility");
    });

    it("enforces session creation rate limits per client IP", () => {
      const ip = `fixed-ip-${crypto.randomUUID()}`;
      for (let i = 0; i < 20; i++) {
        createAnonymousSession({
          ageConfirmed: true,
          termsAccepted: true,
          privacyAccepted: true,
          preferences: basePreferences,
        }, ip);
      }
      expect(() =>
        createAnonymousSession({
          ageConfirmed: true,
          termsAccepted: true,
          privacyAccepted: true,
          preferences: basePreferences,
        }, ip)
      ).toThrow("Too many requests");
    });
  });

  describe("2. Matchmaking Engine & Queue Isolation", () => {
    it("keeps text and video queues isolated", () => {
      const textUser = createTestSession({ mediaMode: "text" });
      const videoUser = createTestSession({ mediaMode: "video" });

      startSearching(textUser);
      startSearching(videoUser);

      // They choose different media modes, so they must not be matched together
      expect(textUser.state).toBe("searching");
      expect(videoUser.state).toBe("searching");
      expect(textUser.roomId).toBeUndefined();
      expect(videoUser.roomId).toBeUndefined();
    });

    it("matches two compatible strangers and assigns private room", () => {
      const alice = createTestSession({ mediaMode: "text", language: "English" });
      const bob = createTestSession({ mediaMode: "text", language: "English" });

      startSearching(alice);
      expect(alice.state).toBe("searching");

      startSearching(bob);
      expect(alice.state).toBe("chat");
      expect(bob.state).toBe("chat");
      expect(alice.roomId).toBeDefined();
      expect(alice.roomId).toBe(bob.roomId);
      expect(activePartnerId(alice)).toBe(bob.id);
      expect(activePartnerId(bob)).toBe(alice.id);
    });

    it("prevents self-matching or duplicate queue entries", () => {
      const user = createTestSession();
      startSearching(user);
      expect(user.state).toBe("searching");

      // Attempting to search again while searching
      const repeat = startSearching(user);
      expect(repeat.state).toBe("searching");
      expect(user.roomId).toBeUndefined();
    });

    it("handles cancellation cleanly", () => {
      const user = createTestSession();
      startSearching(user);
      expect(user.state).toBe("searching");

      endChat(user);
      expect(user.state).toBe("idle");
    });
  });

  describe("3. Real-Time Messaging & Privacy Filters", () => {
    it("delivers messages strictly between matched participants", () => {
      const alice = createTestSession();
      const bob = createTestSession();
      const aliceEvents: any[] = [];
      const bobEvents: any[] = [];

      subscribe(alice.id, e => aliceEvents.push(e));
      subscribe(bob.id, e => bobEvents.push(e));

      startSearching(alice);
      startSearching(bob);

      sendChatMessage(alice, "Hello Bob!");

      const bobMsg = bobEvents.find(e => e.type === "message");
      expect(bobMsg).toBeDefined();
      expect(bobMsg.message.text).toBe("Hello Bob!");
      expect(bobMsg.message.fromMe).toBe(false);

      const aliceMsg = aliceEvents.find(e => e.type === "message");
      expect(aliceMsg).toBeDefined();
      expect(aliceMsg.message.fromMe).toBe(true);
    });

    it("blocks hyperlinks to prevent phishing and scam URLs", () => {
      const alice = createTestSession();
      const bob = createTestSession();
      startSearching(alice);
      startSearching(bob);

      expect(() => sendChatMessage(alice, "Visit http://evil.com")).toThrow("Links are disabled");
      expect(() => sendChatMessage(alice, "Check https://secure-bank.example/login")).toThrow("Links are disabled");
    });

    it("blocks phone numbers and email addresses to protect anonymity", () => {
      const alice = createTestSession();
      const bob = createTestSession();
      startSearching(alice);
      startSearching(bob);

      expect(() => sendChatMessage(alice, "My email is user@gmail.com")).toThrow("don’t share email addresses");
      expect(() => sendChatMessage(alice, "Call +1-800-555-0199")).toThrow("don’t share email addresses");
    });

    it("suppresses repeated duplicate spam messages", () => {
      const alice = createTestSession();
      const bob = createTestSession();
      startSearching(alice);
      startSearching(bob);

      sendChatMessage(alice, "Identical message");
      sendChatMessage(alice, "Identical message");
      expect(() => sendChatMessage(alice, "Identical message")).toThrow("Repeated messages are limited");
    });

    it("rejects messages when session is not in active chat room", () => {
      const alice = createTestSession();
      expect(() => sendChatMessage(alice, "Message without room")).toThrow("conversation has ended");
    });
  });

  describe("4. Next / Skip Partner & Reciprocal Blocking", () => {
    it("Next ends current room, excludes previous partner, and re-queues", () => {
      const alice = createTestSession();
      const bob = createTestSession();
      const charlie = createTestSession();

      startSearching(alice);
      startSearching(bob);
      expect(alice.state).toBe("chat");

      // Alice skips to next partner
      nextChat(alice);
      expect(bob.state).toBe("idle");
      expect(alice.state).toBe("searching");

      // Charlie enters queue -> Alice matches with Charlie, not Bob!
      startSearching(charlie);
      expect(alice.state).toBe("chat");
      expect(activePartnerId(alice)).toBe(charlie.id);
    });

    it("Block immediately severs room and prevents pairing for 24 hours", () => {
      const alice = createTestSession();
      const bob = createTestSession();
      startSearching(alice);
      startSearching(bob);

      blockAndLeave(alice);
      expect(alice.state).toBe("idle");
      expect(bob.state).toBe("idle");
      expect(alice.blocked.has(bob.id)).toBe(true);
      expect(bob.blocked.has(alice.id)).toBe(true);

      // Re-queuing both will not match them
      startSearching(alice);
      startSearching(bob);
      expect(alice.state).toBe("searching");
      expect(bob.state).toBe("searching");
    });
  });

  describe("5. Disconnect Grace Period & Reconnection Notices", () => {
    it("notifies partner of temporary disconnect and reconnection", () => {
      const alice = createTestSession();
      const bob = createTestSession();
      const bobEvents: any[] = [];
      subscribe(bob.id, e => bobEvents.push(e));

      startSearching(alice);
      startSearching(bob);

      // Alice drops connection
      onClientDisconnect(alice.id);
      expect(bobEvents.some(e => e.type === "notice" && e.message.includes("disconnected"))).toBe(true);

      // Alice reconnects within 45s
      onClientConnect(alice.id);
      expect(bobEvents.some(e => e.type === "notice" && e.message.includes("reconnected"))).toBe(true);
      expect(alice.state).toBe("chat");
    });
  });

  describe("6. Video Calling Mutual Opt-In & Signaling", () => {
    const offerSignal: VideoSignal = { kind: "description", descriptionType: "offer", sdp: "v=0\r\n" };

    it("strictly requires mutual consent before enabling video or signaling", () => {
      const alice = createTestSession({ mediaMode: "video" });
      const bob = createTestSession({ mediaMode: "video" });
      const aliceEvents: any[] = [];
      const bobEvents: any[] = [];

      subscribe(alice.id, e => aliceEvents.push(e));
      subscribe(bob.id, e => bobEvents.push(e));

      startSearching(alice);
      startSearching(bob);

      // Alice opts in
      expect(markVideoReady(alice)).toBe(true);
      expect(aliceEvents.some(e => e.type === "video-start")).toBe(false);
      // Signaling rejected because Bob hasn't consented
      expect(forwardVideoSignal(alice, offerSignal)).toBe(false);

      // Bob opts in -> mutual consent achieved
      expect(markVideoReady(bob)).toBe(true);
      expect(aliceEvents.some(e => e.type === "video-start")).toBe(true);
      expect(bobEvents.some(e => e.type === "video-start")).toBe(true);

      // Now signaling succeeds
      expect(forwardVideoSignal(alice, offerSignal)).toBe(true);

      // Stop video shuts down media for both
      stopVideo(alice);
      expect(forwardVideoSignal(alice, offerSignal)).toBe(false);
      expect(bobEvents.some(e => e.type === "video-stopped")).toBe(true);
    });
  });

  describe("7. Safety Reports & Moderation Workflow", () => {
    it("records safety reports with bounded excerpt and supports operator triage", async () => {
      const reportId = crypto.randomUUID();
      await insertSafetyReport({
        id: reportId,
        category: "harassment",
        reporterSessionHash: "hash-reporter-1234",
        reportedSessionHash: "hash-reported-5678",
        description: "Inappropriate language directed at me",
        selectedExcerpt: "Stranger: bad word",
        status: "open",
      });

      const list = await listSafetyReports({ limit: 10 });
      const found = list.find(r => r.id === reportId);
      expect(found).toBeDefined();
      expect(found?.category).toBe("harassment");
      expect(found?.status).toBe("open");

      // Moderator reviews and actions the report
      const updated = await updateSafetyReportStatus(reportId, "reviewed");
      expect(updated).toBe(true);

      const stats = await getSafetyReportStats();
      expect(stats.total).toBeGreaterThanOrEqual(1);
      expect(stats.reviewed).toBeGreaterThanOrEqual(1);
    });
  });

  describe("8. Live Online Statistics", () => {
    it("accurately tracks active sessions and rooms without fabricated numbers", () => {
      const initial = getOnlineStats();
      const alice = createTestSession();
      const bob = createTestSession();

      const during = getOnlineStats();
      expect(during.activeSessions).toBe(initial.activeSessions + 2);

      startSearching(alice);
      startSearching(bob);

      const inChat = getOnlineStats();
      expect(inChat.activeRooms).toBe(initial.activeRooms + 1);

      endChat(alice);
      endChat(bob);
    });
  });
});
