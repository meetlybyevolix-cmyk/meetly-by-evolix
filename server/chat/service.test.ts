import { describe, expect, it, vi } from "vitest";
import {
  assertReportLimit,
  assertSearchLimit,
  blockAndLeave,
  createAnonymousSession,
  endChat,
  forwardVideoSignal,
  getOnlineStats,
  getSession,
  markVideoReady,
  nextChat,
  sendChatMessage,
  startSearching,
  stopVideo,
  subscribe,
  type MediaMode,
  type VideoSignal,
} from "./service";
import { config } from "../config";

const accepted = {
  ageConfirmed: true,
  termsAccepted: true,
  privacyAccepted: true,
  preferences: {
    interests: [],
    language: "Any",
    mediaMode: "text" as MediaMode,
  },
};

function makeSession(
  mediaMode: MediaMode,
  extraPreferences: Partial<typeof accepted.preferences> = {}
) {
  const created = createAnonymousSession(
    {
      ...accepted,
      preferences: { ...accepted.preferences, mediaMode, ...extraPreferences },
    },
    `test-key-${crypto.randomUUID()}`
  );
  const session = getSession(created.token);
  if (!session) throw new Error("Test session was not issued");
  return session;
}

const offer: VideoSignal = {
  kind: "description",
  descriptionType: "offer",
  sdp: "v=0\r\n",
};

describe("anonymous chat sessions and temporary abuse controls", () => {
  it("requires adult eligibility and both notice acknowledgements", () => {
    expect(() =>
      createAnonymousSession(
        { ...accepted, ageConfirmed: false },
        "consent-test"
      )
    ).toThrow("Confirm adult eligibility");
    expect(() =>
      createAnonymousSession(
        { ...accepted, termsAccepted: false },
        "consent-test"
      )
    ).toThrow("Confirm adult eligibility");
    expect(() =>
      createAnonymousSession(
        { ...accepted, privacyAccepted: false },
        "consent-test"
      )
    ).toThrow("Confirm adult eligibility");
  });

  it("issues an unpredictable signed credential and rejects altered credentials", () => {
    const first = createAnonymousSession(accepted, "credential-test-1");
    const second = createAnonymousSession(accepted, "credential-test-2");
    expect(first.token).not.toBe(second.token);
    expect(getSession(first.token)).toBeDefined();
    expect(getSession(`${first.token}x`)).toBeUndefined();
  });

  it("limits anonymous session creation by an ephemeral client key", () => {
    const key = `create-rate-test-${crypto.randomUUID()}`;
    for (let index = 0; index < 20; index += 1)
      createAnonymousSession(accepted, key);
    expect(() => createAnonymousSession(accepted, key)).toThrow(
      "Too many requests"
    );
  });

  it("limits rapid searching/skipping and report submissions per temporary session", () => {
    const session = getSession(
      createAnonymousSession(
        accepted,
        `session-window-test-${crypto.randomUUID()}`
      ).token
    );
    if (!session) throw new Error("Test session was not issued");
    for (let index = 0; index < 20; index += 1) assertSearchLimit(session);
    expect(() => assertSearchLimit(session)).toThrow("Too many requests");
    for (let index = 0; index < 3; index += 1) assertReportLimit(session);
    expect(() => assertReportLimit(session)).toThrow("Too many requests");
  });

  it("keeps text and video matchmaking in separate queues", () => {
    const textSession = makeSession("text");
    const videoSession = makeSession("video");
    startSearching(textSession);
    startSearching(videoSession);
    expect(textSession.state).toBe("searching");
    expect(videoSession.state).toBe("searching");
    endChat(textSession);
    endChat(videoSession);
  });

  it("matches two compatible strangers and delivers messages", () => {
    const userA = makeSession("text");
    const userB = makeSession("text");
    const aEvents: unknown[] = [];
    const bEvents: unknown[] = [];
    const unsubA = subscribe(userA.id, e => aEvents.push(e));
    const unsubB = subscribe(userB.id, e => bEvents.push(e));

    startSearching(userA);
    startSearching(userB);

    expect(userA.state).toBe("chat");
    expect(userB.state).toBe("chat");

    const sendRes = sendChatMessage(userA, "Hello from Stranger A!");
    expect(sendRes).toEqual({ ok: true });
    expect(
      bEvents.some(
        e =>
          (e as { type?: string; message?: { text: string } }).message?.text ===
          "Hello from Stranger A!"
      )
    ).toBe(true);

    endChat(userA);
    unsubA();
    unsubB();
  });

  it("enforces safety filters against links, phone numbers, and emails in chat", () => {
    const userA = makeSession("text");
    const userB = makeSession("text");
    startSearching(userA);
    startSearching(userB);

    expect(() =>
      sendChatMessage(userA, "Check this link https://example.com/scam")
    ).toThrow("Links are disabled");
    expect(() =>
      sendChatMessage(userA, "Reach me at test@example.com")
    ).toThrow("don’t share email addresses or phone numbers");
    expect(() => sendChatMessage(userA, "Call +1 555 123 4567")).toThrow(
      "don’t share email addresses or phone numbers"
    );
    expect(() => sendChatMessage(userA, "")).toThrow(
      "Messages must be between 1 and 500 characters"
    );

    endChat(userA);
  });

  it("detects and prevents repeated duplicate spam messages", () => {
    const userA = makeSession("text");
    const userB = makeSession("text");
    startSearching(userA);
    startSearching(userB);

    sendChatMessage(userA, "Spam message test");
    sendChatMessage(userA, "Spam message test");
    expect(() => sendChatMessage(userA, "Spam message test")).toThrow(
      "Repeated messages are limited"
    );

    endChat(userA);
  });

  it("handles skipping to the next partner and reciprocal blocking", () => {
    const userA = makeSession("text");
    const userB = makeSession("text");
    startSearching(userA);
    startSearching(userB);
    expect(userA.state).toBe("chat");

    blockAndLeave(userA);
    expect(userA.state).toBe("idle");
    expect(userB.state).toBe("idle");
    expect(userA.blocked.has(userB.id)).toBe(true);
    expect(userB.blocked.has(userA.id)).toBe(true);

    // After blocking, they must not match again
    startSearching(userA);
    startSearching(userB);
    expect(userA.state).toBe("searching");
    expect(userB.state).toBe("searching");

    endChat(userA);
    endChat(userB);
  });

  it("tracks online user and room statistics correctly", () => {
    const stats = getOnlineStats();
    expect(typeof stats.activeSessions).toBe("number");
    expect(typeof stats.activeRooms).toBe("number");
    expect(typeof stats.queuedUsers).toBe("number");
    expect(stats.activeSessions).toBeGreaterThanOrEqual(0);
  });

  it("parses ICE servers and STUN/TURN configurations properly", () => {
    expect(Array.isArray(config.iceServers)).toBe(true);
    expect(config.iceServers.length).toBeGreaterThan(0);
    expect(config.iceServers[0]).toHaveProperty("urls");
  });

  it("allows public video sessions, mutual consent and signaling in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    let first: ReturnType<typeof makeSession> | undefined;
    try {
      first = makeSession("video");
      const second = makeSession("video");
      startSearching(first);
      startSearching(second);
      expect(first.state).toBe("chat");
      expect(markVideoReady(first)).toBe(true);
      expect(markVideoReady(second)).toBe(true);
      expect(forwardVideoSignal(first, offer)).toBe(true);
    } finally {
      if (first) endChat(first);
      vi.unstubAllEnvs();
    }
  });

  it("requires both video-room participants to opt in before forwarding signals", () => {
    const first = makeSession("video");
    const second = makeSession("video");
    const firstEvents: unknown[] = [];
    const secondEvents: unknown[] = [];
    const unsubscribeFirst = subscribe(first.id, event =>
      firstEvents.push(event)
    );
    const unsubscribeSecond = subscribe(second.id, event =>
      secondEvents.push(event)
    );
    startSearching(first);
    startSearching(second);

    expect(markVideoReady(first)).toBe(true);
    expect(
      firstEvents.some(
        event => (event as { type?: string }).type === "video-start"
      )
    ).toBe(false);
    expect(forwardVideoSignal(first, offer)).toBe(false);

    expect(markVideoReady(second)).toBe(true);
    expect(
      firstEvents.some(
        event => (event as { type?: string }).type === "video-start"
      )
    ).toBe(true);
    expect(
      secondEvents.some(
        event => (event as { type?: string }).type === "video-start"
      )
    ).toBe(true);
    expect(forwardVideoSignal(first, offer)).toBe(true);
    expect(
      secondEvents.some(
        event =>
          (event as { type?: string; signal?: VideoSignal }).type ===
          "video-signal"
      )
    ).toBe(true);

    expect(stopVideo(first)).toBe(true);
    expect(forwardVideoSignal(first, offer)).toBe(false);
    expect(
      secondEvents.some(
        event => (event as { type?: string }).type === "video-stopped"
      )
    ).toBe(true);
    endChat(first);
    unsubscribeFirst();
    unsubscribeSecond();
  });
});
