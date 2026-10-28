import { describe, expect, it, vi } from "vitest";
import { assertReportLimit, assertSearchLimit, createAnonymousSession, endChat, forwardVideoSignal, getSession, markVideoReady, startSearching, stopVideo, subscribe, type MediaMode, type VideoSignal } from "./service";

const accepted = {
  ageConfirmed: true,
  termsAccepted: true,
  privacyAccepted: true,
  preferences: { interests: [], language: "Any", mediaMode: "text" as MediaMode },
};

function makeSession(mediaMode: MediaMode) {
  const created = createAnonymousSession({ ...accepted, preferences: { ...accepted.preferences, mediaMode } }, `video-test-${crypto.randomUUID()}`);
  const session = getSession(created.token);
  if (!session) throw new Error("Test session was not issued");
  return session;
}

const offer: VideoSignal = { kind: "description", descriptionType: "offer", sdp: "v=0\r\n" };

describe("anonymous chat sessions and temporary abuse controls", () => {
  it("requires adult eligibility and both notice acknowledgements", () => {
    expect(() => createAnonymousSession({ ...accepted, ageConfirmed: false }, "consent-test")).toThrow("Confirm adult eligibility");
    expect(() => createAnonymousSession({ ...accepted, termsAccepted: false }, "consent-test")).toThrow("Confirm adult eligibility");
    expect(() => createAnonymousSession({ ...accepted, privacyAccepted: false }, "consent-test")).toThrow("Confirm adult eligibility");
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
    for (let index = 0; index < 20; index += 1) createAnonymousSession(accepted, key);
    expect(() => createAnonymousSession(accepted, key)).toThrow("Too many requests");
  });

  it("limits rapid searching/skipping and report submissions per temporary session", () => {
    const session = getSession(createAnonymousSession(accepted, `session-window-test-${crypto.randomUUID()}`).token);
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
    const unsubscribeFirst = subscribe(first.id, event => firstEvents.push(event));
    const unsubscribeSecond = subscribe(second.id, event => secondEvents.push(event));
    startSearching(first);
    startSearching(second);

    expect(markVideoReady(first)).toBe(true);
    expect(firstEvents.some(event => (event as { type?: string }).type === "video-start")).toBe(false);
    expect(forwardVideoSignal(first, offer)).toBe(false);

    expect(markVideoReady(second)).toBe(true);
    expect(firstEvents.some(event => (event as { type?: string }).type === "video-start")).toBe(true);
    expect(secondEvents.some(event => (event as { type?: string }).type === "video-start")).toBe(true);
    expect(forwardVideoSignal(first, offer)).toBe(true);
    expect(secondEvents.some(event => (event as { type?: string; signal?: VideoSignal }).type === "video-signal")).toBe(true);

    expect(stopVideo(first)).toBe(true);
    expect(forwardVideoSignal(first, offer)).toBe(false);
    expect(secondEvents.some(event => (event as { type?: string }).type === "video-stopped")).toBe(true);
    endChat(first);
    unsubscribeFirst();
    unsubscribeSecond();
  });
});
