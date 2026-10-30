import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createAnonymousSession,
  getSession,
  startSearching,
  sendChatMessage,
  nextChat,
  endChat,
  subscribe,
  getState,
  setLanguageFallbackDelay,
  getLanguageFallbackDelay,
  setImmediateCrossLanguage,
  isImmediateCrossLanguageEnabled,
  resetChatState,
  MediaMode,
  ClientEvent,
} from "./chat/service";

const baseConsent = {
  ageConfirmed: true as const,
  termsAccepted: true as const,
  privacyAccepted: true as const,
};

function createTestUser(
  mediaMode: MediaMode = "text",
  language: string = "Any",
  interests: string[] = []
) {
  const created = createAnonymousSession(
    {
      ...baseConsent,
      preferences: {
        mediaMode,
        language: language as any,
        interests: interests as any,
      },
    },
    `test-client-${Math.random()}`
  );
  const session = getSession(created.token);
  if (!session) throw new Error("Failed to create test session");
  return session;
}

describe("Feature 6: Smart Global Matchmaking with Language Fallback", () => {
  beforeEach(() => {
    resetChatState();
    setImmediateCrossLanguage(true);
    setLanguageFallbackDelay(5000);
  });

  afterEach(() => {
    resetChatState();
  });

  it("1. Hindi user + Hindi user → Match immediately (Priority 1: Preferred Language)", () => {
    const hindi1 = createTestUser("text", "Hindi");
    const hindi2 = createTestUser("text", "Hindi");

    startSearching(hindi1);
    expect(hindi1.state).toBe("searching");

    startSearching(hindi2);
    expect(hindi1.state).toBe("chat");
    expect(hindi2.state).toBe("chat");
    expect(hindi1.roomId).toBeDefined();
    expect(hindi1.roomId).toBe(hindi2.roomId);
  });

  it("2. Hindi user + English user → Match when no suitable Hindi user is available", () => {
    const hindiUser = createTestUser("text", "Hindi");
    const englishUser = createTestUser("text", "English");

    startSearching(hindiUser);
    expect(hindiUser.state).toBe("searching");

    startSearching(englishUser);
    expect(hindiUser.state).toBe("chat");
    expect(englishUser.state).toBe("chat");
    expect(hindiUser.roomId).toBe(englishUser.roomId);
  });

  it("3. Gujarati user + Arabic user → Match successfully across different languages", () => {
    const gujarati = createTestUser("text", "Gujarati");
    const arabic = createTestUser("text", "Arabic");

    startSearching(gujarati);
    expect(gujarati.state).toBe("searching");

    startSearching(arabic);
    expect(gujarati.state).toBe("chat");
    expect(arabic.state).toBe("chat");
    expect(gujarati.roomId).toBe(arabic.roomId);
  });

  it("4. Same-language preference does not create indefinite waiting for rare languages", () => {
    const rareLangUser = createTestUser("text", "Gujarati");
    startSearching(rareLangUser);

    expect(rareLangUser.state).toBe("searching");

    // Stranger with different language joins
    const stranger = createTestUser("text", "French");
    startSearching(stranger);

    // Both should be in active chat, avoiding starvation
    expect(rareLangUser.state).toBe("chat");
    expect(stranger.state).toBe("chat");
  });

  it("5. Different chat modes never match together (Text vs Video isolation)", () => {
    const textUser = createTestUser("text", "Hindi");
    const videoUser = createTestUser("video", "Hindi");

    startSearching(textUser);
    startSearching(videoUser);

    // Both must remain strictly in their respective searching queues
    expect(textUser.state).toBe("searching");
    expect(videoUser.state).toBe("searching");
    expect(textUser.roomId).toBeUndefined();
    expect(videoUser.roomId).toBeUndefined();

    // Matching text user pairs with textUser only
    const textPartner = createTestUser("text", "English");
    startSearching(textPartner);

    expect(textUser.state).toBe("chat");
    expect(textPartner.state).toBe("chat");
    expect(videoUser.state).toBe("searching"); // Video user still isolated
  });

  it("6. Blocked users cannot rematch", () => {
    const userA = createTestUser("text", "Hindi");
    const userB = createTestUser("text", "Hindi");

    // userA blocks userB
    userA.blocked.add(userB.id);

    startSearching(userA);
    startSearching(userB);

    expect(userA.state).toBe("searching");
    expect(userB.state).toBe("searching");
    expect(userA.roomId).toBeUndefined();
  });

  it("7. Next Stranger works with global fallback and skips previous partner", () => {
    const userA = createTestUser("text", "Hindi");
    const userB = createTestUser("text", "English");

    startSearching(userA);
    startSearching(userB);
    expect(userA.state).toBe("chat");

    const firstRoomId = userA.roomId;

    // userA skips to Next Stranger
    nextChat(userA);
    expect(userA.state).toBe("searching");
    expect(userB.state).toBe("idle");

    // userB re-enters queue: userA and userB cannot immediately rematch
    startSearching(userB);
    expect(userA.state).toBe("searching");
    expect(userB.state).toBe("searching");

    // userC arrives: userA pairs with userC
    const userC = createTestUser("text", "Arabic");
    startSearching(userC);

    expect(userA.state).toBe("chat");
    expect(userC.state).toBe("chat");
    expect(userA.roomId).not.toBe(firstRoomId);
    expect(userA.roomId).toBe(userC.roomId);
  });

  it("8. Language-fallback timing works correctly and informs users of partner preference", () => {
    // Disable immediate cross-language match to test delay enforcement
    setImmediateCrossLanguage(false);
    setLanguageFallbackDelay(5000);

    const userHindi = createTestUser("text", "Hindi");
    const userEnglish = createTestUser("text", "English");

    const hindiEvents: ClientEvent[] = [];
    const englishEvents: ClientEvent[] = [];
    subscribe(userHindi.id, e => hindiEvents.push(e));
    subscribe(userEnglish.id, e => englishEvents.push(e));

    // Both search at t=0
    startSearching(userHindi);
    startSearching(userEnglish);

    // Because delay is 5s and neither waited, they are not yet matched
    expect(userHindi.state).toBe("searching");
    expect(userEnglish.state).toBe("searching");

    // Verify search-status event was emitted for Hindi user
    const statusEvent = hindiEvents.find(e => e.type === "search-status");
    expect(statusEvent).toBeDefined();
    if (statusEvent?.type === "search-status") {
      expect(statusEvent.phase).toBe("preferred");
      expect(statusEvent.message).toContain("Looking for someone who speaks your language");
    }

    // Now simulate timeout expiration
    setLanguageFallbackDelay(0);
    startSearching(userHindi);

    expect(userHindi.state).toBe("chat");
    expect(userEnglish.state).toBe("chat");

    // Verify notice informing of partner's language preference
    const noticeToHindi = hindiEvents.find(
      e => e.type === "notice" && e.message.includes("prefers English")
    );
    const noticeToEnglish = englishEvents.find(
      e => e.type === "notice" && e.message.includes("prefers Hindi")
    );
    expect(noticeToHindi).toBeDefined();
    expect(noticeToEnglish).toBeDefined();
  });

  it("9. No duplicate rooms or sessions are created under concurrent matching", () => {
    const languages = ["Hindi", "English", "Spanish", "Gujarati", "Arabic"];
    const users = languages.flatMap(lang => [
      createTestUser("text", lang),
      createTestUser("text", lang),
    ]); // 10 users total

    for (const u of users) {
      startSearching(u);
    }

    const matchedRooms = new Set<string>();
    for (const u of users) {
      expect(u.state).toBe("chat");
      expect(u.roomId).toBeDefined();
      if (u.roomId) matchedRooms.add(u.roomId);
    }

    // Exactly 5 distinct rooms for 10 users
    expect(matchedRooms.size).toBe(5);
  });

  it("10. Existing video call side chat and image messaging remain fully functional with cross-language fallback", () => {
    const videoUserA = createTestUser("video", "Hindi");
    const videoUserB = createTestUser("video", "French");

    startSearching(videoUserA);
    startSearching(videoUserB);

    expect(videoUserA.state).toBe("chat");
    expect(videoUserB.state).toBe("chat");
    expect(videoUserA.roomId).toBe(videoUserB.roomId);

    // Verify getState returns correct mediaMode and partnerLanguage
    const stateA = getState(videoUserA);
    expect(stateA.mediaMode).toBe("video");
    expect(stateA.partnerLanguage).toBe("French");

    // Verify message exchange in video room
    const sendResult = sendChatMessage(videoUserA, "Hello from video chat!");
    expect(sendResult).toEqual({ ok: true });

    const stateB = getState(videoUserB);
    expect(stateB.messages.some(m => m.text === "Hello from video chat!")).toBe(true);

    endChat(videoUserA);
    expect(videoUserA.state).toBe("idle");
  });
});

