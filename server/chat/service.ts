import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config";
import { registerRoomParticipants, getAuthorizedMediaSync } from "./media";

export const INTERESTS = [
  "Music",
  "Gaming",
  "Movies",
  "Technology",
  "Travel",
  "Business",
  "Language learning",
  "Sports",
  "Art & design",
  "General conversation",
] as const;
export const LANGUAGES = [
  "English",
  "Hindi",
  "Spanish",
  "French",
  "Portuguese",
  "Arabic",
  "Japanese",
  "Gujarati",
  "Other",
] as const;
export const REPORT_REASONS = [
  "Child exploitation or CSAM",
  "Non-consensual sexual content",
  "Harassment or bullying",
  "Sexual or explicit content",
  "Suspected minor",
  "Threats or violent behavior",
  "Spam or scams",
  "Hate or abusive language",
  "Privacy violation or doxxing",
  "Impersonation",
  "Other safety concern",
] as const;

export type ChatState = "idle" | "searching" | "chat";
export type MessageMedia = {
  id: string;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
  isFlagged?: boolean;
};
export type ChatMessage = {
  id: string;
  text: string;
  sentAt: number;
  fromMe: boolean;
  media?: MessageMedia;
};
export type MediaMode = "text" | "video";
export type VideoSignal =
  | {
      kind: "description";
      descriptionType: "offer" | "answer" | "pranswer" | "rollback";
      sdp: string;
    }
  | {
      kind: "candidate";
      candidate: {
        candidate: string | null;
        sdpMid?: string | null;
        sdpMLineIndex?: number | null;
        usernameFragment?: string | null;
        [key: string]: unknown;
      };
    };
export type Preferences = {
  interests: string[];
  language: string;
  mediaMode: MediaMode;
};
export type Session = {
  id: string;
  token: string;
  createdAt: number;
  preferences: Preferences;
  acceptedAt: number;
  state: ChatState;
  roomId?: string;
  blocked: Set<string>;
  rateWindow: number[];
  searchRequests: number[];
  reportRequests: number[];
  videoRequests: number[];
  recentMessages: { text: string; at: number }[];
  clientKey?: string;
  isSynthetic?: boolean;
};
type RoomMessage = {
  id: string;
  text: string;
  sentAt: number;
  senderId: string;
  mediaId?: string;
  mediaMimeType?: string;
  mediaWidth?: number;
  mediaHeight?: number;
  mediaIsFlagged?: boolean;
};
type Room = {
  id: string;
  participants: [string, string];
  messages: RoomMessage[];
  createdAt: number;
  mediaMode: MediaMode;
  videoReady: Set<string>;
};
export type ClientEvent =
  | {
      type: "state";
      state: ChatState;
      messages?: ChatMessage[];
      mediaMode: MediaMode;
      partnerLanguage?: string;
    }
  | { type: "message"; message: ChatMessage }
  | { type: "notice"; message: string }
  | {
      type: "search-status";
      phase: "preferred" | "fallback" | "connecting";
      message: string;
    }
  | {
      type: "stats";
      onlineCount: number;
      activeSessions: number;
      activeRooms: number;
      queuedUsers: number;
      syntheticCount?: number;
    }
  | { type: "video-status"; readyCount: number; active: boolean }
  | { type: "video-start"; offerer: boolean; polite?: boolean }
  | { type: "video-signal"; signal: VideoSignal }
  | { type: "video-stopped"; message: string }
  | { type: "video-error"; message: string };

type Listener = (event: ClientEvent) => void;

const signingKey = config.sessionSecret;
const sessions = new Map<string, Session>();
const queue = new Map<string, number>();
const rooms = new Map<string, Room>();
const listeners = new Map<string, Set<Listener>>();
const blockedPairs = new Map<string, number>();
const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
const requestRates = new Map<string, number[]>();
const SESSION_TTL = 3 * 60 * 60 * 1000;
const ROOM_TTL = 2 * 60 * 60 * 1000;
const BLOCK_TTL = 24 * 60 * 60 * 1000;

let languageFallbackDelayMs = Number(
  process.env.LANGUAGE_FALLBACK_DELAY_MS || 5_000
);
let immediateCrossLanguageEnabled = true;

export function getLanguageFallbackDelay(): number {
  return languageFallbackDelayMs;
}

export function setLanguageFallbackDelay(ms: number): void {
  languageFallbackDelayMs = Math.max(0, ms);
}

export function isImmediateCrossLanguageEnabled(): boolean {
  return immediateCrossLanguageEnabled;
}

export function setImmediateCrossLanguage(enabled: boolean): void {
  immediateCrossLanguageEnabled = enabled;
}

function signature(id: string) {
  return createHmac("sha256", signingKey).update(id).digest("base64url");
}
function pairKey(a: string, b: string) {
  return [a, b].sort().join(":");
}
function emit(sessionId: string, event: ClientEvent) {
  listeners.get(sessionId)?.forEach(listener => listener(event));
}
function roomFor(session: Session) {
  return session.roomId ? rooms.get(session.roomId) : undefined;
}
function clientMessages(room: Room, viewerId: string, viewerToken?: string): ChatMessage[] {
  return room.messages.map(message => ({
    id: message.id,
    text: message.text,
    sentAt: message.sentAt,
    fromMe: message.senderId === viewerId,
    media: message.mediaId
      ? {
          id: message.mediaId,
          url: `/api/chat/media/${message.mediaId}${viewerToken ? `?token=${encodeURIComponent(viewerToken)}` : ""}`,
          mimeType: message.mediaMimeType || "image/jpeg",
          width: message.mediaWidth,
          height: message.mediaHeight,
          isFlagged: message.mediaIsFlagged,
        }
      : undefined,
  }));
}
function sendState(session: Session) {
  const room = roomFor(session);
  const partnerId = room?.participants.find(id => id !== session.id);
  const partner = partnerId ? sessions.get(partnerId) : undefined;
  const partnerLanguage = partner?.preferences.language;

  emit(
    session.id,
    room
      ? {
          type: "state",
          state: "chat",
          messages: clientMessages(room, session.id, session.token),
          mediaMode: room.mediaMode,
          partnerLanguage,
        }
      : {
          type: "state",
          state: session.state,
          mediaMode: session.preferences.mediaMode,
        }
  );
}
function eligible(session: Session) {
  return Date.now() - session.createdAt < SESSION_TTL;
}

function limitRequest(
  action: string,
  clientKey: string,
  maximum: number,
  windowMs: number
) {
  const now = Date.now();
  const key = createHmac("sha256", signingKey)
    .update(`${action}:${clientKey}`)
    .digest("hex");
  const recent = (requestRates.get(key) ?? []).filter(
    time => now - time < windowMs
  );
  if (recent.length >= maximum)
    throw new Error("Too many requests. Wait a little before trying again.");
  requestRates.set(key, [...recent, now]);
  if (requestRates.size > 5_000) {
    for (const [entry, times] of requestRates) {
      if (times.every(time => now - time > windowMs))
        requestRates.delete(entry);
      if (requestRates.size <= 4_000) break;
    }
  }
}

function limitSessionWindow(
  session: Session,
  key: "searchRequests" | "reportRequests" | "videoRequests",
  maximum: number,
  windowMs: number
) {
  const now = Date.now();
  const recent = session[key].filter(time => now - time < windowMs);
  if (recent.length >= maximum)
    throw new Error("Too many requests. Wait a little before trying again.");
  session[key] = [...recent, now];
}

export function assertSearchLimit(session: Session) {
  if (session.isSynthetic) return;
  limitSessionWindow(session, "searchRequests", 20, 60_000);
}

export function assertReportLimit(session: Session) {
  limitSessionWindow(session, "reportRequests", 3, 60 * 60_000);
}

export function createAnonymousSession(
  input: {
    ageConfirmed: boolean;
    termsAccepted: boolean;
    privacyAccepted: boolean;
    preferences: Preferences;
    isSynthetic?: boolean;
  },
  clientKey = "unknown"
) {
  if (input.isSynthetic && config.isProduction) {
    throw new Error("Synthetic test traffic is strictly disabled in production.");
  }
  if (!input.isSynthetic) {
    limitRequest("session-create", clientKey, 20, 60_000);
  }
  if (!input.ageConfirmed || !input.termsAccepted || !input.privacyAccepted) {
    throw new Error(
      "Confirm adult eligibility and accept the Terms and Privacy Notice to continue."
    );
  }
  const id = randomBytes(32).toString("base64url");
  const token = `${id}.${signature(id)}`;
  const allowedInterests = new Set<string>(INTERESTS);
  const session: Session = {
    id,
    token,
    createdAt: Date.now(),
    acceptedAt: Date.now(),
    preferences: {
      interests: (input.preferences?.interests ?? [])
        .filter(value => allowedInterests.has(value))
        .slice(0, 5),
      language: LANGUAGES.includes(
        input.preferences?.language as (typeof LANGUAGES)[number]
      )
        ? input.preferences!.language
        : "Any",
      mediaMode: input.preferences.mediaMode === "video" ? "video" : "text",
    },
    state: "idle",
    blocked: new Set(),
    rateWindow: [],
    searchRequests: [],
    reportRequests: [],
    videoRequests: [],
    recentMessages: [],
    clientKey,
    isSynthetic: Boolean(input.isSynthetic),
  };
  sessions.set(id, session);
  return { token, expiresAt: session.createdAt + SESSION_TTL };
}

export function createSyntheticSession(tag = "loadtest") {
  if (config.isProduction) {
    throw new Error("Synthetic test traffic is strictly disabled in production.");
  }
  return createAnonymousSession(
    {
      ageConfirmed: true,
      termsAccepted: true,
      privacyAccepted: true,
      preferences: {
        interests: [],
        language: "Any",
        mediaMode: "text",
      },
      isSynthetic: true,
    },
    `synthetic-${tag}-${randomBytes(6).toString("hex")}`
  );
}

export function getSession(token: string | undefined): Session | undefined {
  if (!token) return undefined;
  const separator = token.lastIndexOf(".");
  if (separator < 0) return undefined;
  const id = token.slice(0, separator);
  const supplied = Buffer.from(token.slice(separator + 1));
  const expected = Buffer.from(signature(id));
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  )
    return undefined;
  const session = sessions.get(id);
  if (!session || session.token !== token || !eligible(session)) {
    if (session) removeSession(session);
    return undefined;
  }
  return session;
}

export function subscribe(sessionId: string, listener: Listener) {
  const group = listeners.get(sessionId) ?? new Set<Listener>();
  group.add(listener);
  listeners.set(sessionId, group);
  return () => {
    group.delete(listener);
    if (group.size === 0) listeners.delete(sessionId);
  };
}

export function onClientConnect(sessionId: string) {
  const timer = disconnectTimers.get(sessionId);
  const wasDisconnected = Boolean(timer);
  if (timer) clearTimeout(timer);
  disconnectTimers.delete(sessionId);
  const session = sessions.get(sessionId);
  if (session?.state === "searching" && !session.roomId)
    queue.set(sessionId, queue.get(sessionId) ?? Date.now());
  if (session && wasDisconnected) {
    const partnerId = activePartnerId(session);
    if (partnerId) {
      emit(partnerId, { type: "notice", message: "Your chat partner reconnected." });
    }
  }
  broadcastStats();
}

export function onClientDisconnect(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) return;
  if (roomFor(session)?.mediaMode === "video")
    stopVideo(
      session,
      "The video connection ended. Your camera and microphone are off."
    );
  queue.delete(sessionId);
  const prior = disconnectTimers.get(sessionId);
  if (prior) clearTimeout(prior);

  // Notify active partner of temporary disconnect
  const partnerId = activePartnerId(session);
  if (partnerId) {
    emit(partnerId, { type: "notice", message: "Your chat partner disconnected. Waiting up to 45s for reconnect..." });
  }

  broadcastStats();

  disconnectTimers.set(
    sessionId,
    setTimeout(() => {
      disconnectTimers.delete(sessionId);
      const current = sessions.get(sessionId);
      if (current) {
        removeSession(current);
        broadcastStats();
      }
    }, 45_000)
  );
}

function closeRoom(room: Room, message: string, excludedPair = false) {
  const [first, second] = room.participants;
  const a = sessions.get(first);
  const b = sessions.get(second);
  if (excludedPair)
    blockedPairs.set(pairKey(first, second), Date.now() + BLOCK_TTL);
  if (room.mediaMode === "video") {
    for (const participantId of room.participants)
      emit(participantId, {
        type: "video-stopped",
        message: "The room ended. Your camera and microphone are off.",
      });
  }
  if (a) {
    a.roomId = undefined;
    if (a.state === "chat") a.state = "idle";
    emit(a.id, { type: "notice", message });
    sendState(a);
  }
  if (b) {
    b.roomId = undefined;
    if (b.state === "chat") b.state = "idle";
    emit(b.id, { type: "notice", message });
    sendState(b);
  }
  rooms.delete(room.id);
  broadcastStats();
}

function removeSession(session: Session) {
  queue.delete(session.id);
  const room = roomFor(session);
  if (room) closeRoom(room, "The other person disconnected.");
  sessions.delete(session.id);
  listeners.delete(session.id);
  const timer = disconnectTimers.get(session.id);
  if (timer) clearTimeout(timer);
  disconnectTimers.delete(session.id);
}

export function isLanguageCompatible(a: Session, b: Session): boolean {
  return (
    a.preferences.language === "Any" ||
    b.preferences.language === "Any" ||
    a.preferences.language === b.preferences.language
  );
}

export function score(a: Session, b: Session, isFallback = false): number {
  const shared = a.preferences.interests.filter(interest =>
    b.preferences.interests.includes(interest)
  ).length;

  const exactMatch =
    a.preferences.language !== "Any" &&
    a.preferences.language === b.preferences.language;
  const anyMatch =
    a.preferences.language === "Any" || b.preferences.language === "Any";

  let langScore = 0;
  if (exactMatch) {
    langScore = 150; // Priority 1: Exact preferred language match
  } else if (anyMatch) {
    langScore = 100; // Open to any language
  } else if (isFallback) {
    langScore = 20; // Fallback cross-language match
  }

  return langScore + shared * 10;
}

export function startSearching(session: Session, preferences?: Preferences) {
  if (session.roomId) {
    const previousRoom = roomFor(session);
    if (previousRoom) closeRoom(previousRoom, "The conversation ended.", true);
    session.roomId = undefined;
  }
  if (preferences) {
    const allowedInterests = new Set<string>(INTERESTS);
    session.preferences = {
      interests: preferences.interests
        .filter(value => allowedInterests.has(value))
        .slice(0, 5),
      language: LANGUAGES.includes(
        preferences.language as (typeof LANGUAGES)[number]
      )
        ? preferences.language
        : "Any",
      mediaMode: preferences.mediaMode === "video" ? "video" : "text",
    };
  }
  session.state = "searching";
  const now = Date.now();
  queue.set(session.id, queue.get(session.id) ?? now);
  const myQueuedAt = queue.get(session.id) ?? now;

  // 1. Gather all valid candidates from the queue
  const validCandidates = [...queue.entries()]
    .filter(([id]) => id !== session.id)
    .map(([id, queuedAt]) => ({ candidate: sessions.get(id), queuedAt }))
    .filter((entry): entry is { candidate: Session; queuedAt: number } =>
      Boolean(entry.candidate && eligible(entry.candidate))
    )
    .filter(
      ({ candidate }) => !candidate.roomId && candidate.state === "searching"
    )
    .filter(
      ({ candidate }) =>
        candidate.preferences.mediaMode === session.preferences.mediaMode
    )
    .filter(
      ({ candidate }) =>
        !session.blocked.has(candidate.id) && !candidate.blocked.has(session.id)
    )
    .filter(
      ({ candidate }) => !blockedPairs.has(pairKey(session.id, candidate.id))
    );

  // 2. Partition candidates into preferred same-language vs cross-language
  const sameLanguage = validCandidates.filter(({ candidate }) =>
    isLanguageCompatible(session, candidate)
  );

  let selected: Session | undefined = undefined;

  // Priority 1 — Preferred Language
  if (sameLanguage.length > 0) {
    sameLanguage.sort(
      (left, right) =>
        score(right.candidate, session, false) -
          score(left.candidate, session, false) ||
        left.queuedAt - right.queuedAt
    );
    selected = sameLanguage[0]?.candidate;
  }

  // Priority 2 & 3 — Automatic Global Fallback & Fastest Available Match
  if (!selected) {
    const crossLanguage = validCandidates.filter(
      ({ candidate }) => !isLanguageCompatible(session, candidate)
    );

    const eligibleCross = crossLanguage.filter(({ queuedAt }) => {
      if (immediateCrossLanguageEnabled || languageFallbackDelayMs === 0) {
        return true;
      }
      const myElapsed = now - myQueuedAt;
      const candidateElapsed = now - queuedAt;
      return (
        myElapsed >= languageFallbackDelayMs ||
        candidateElapsed >= languageFallbackDelayMs
      );
    });

    if (eligibleCross.length > 0) {
      eligibleCross.sort(
        (left, right) =>
          score(right.candidate, session, true) -
            score(left.candidate, session, true) ||
          left.queuedAt - right.queuedAt
      );
      selected = eligibleCross[0]?.candidate;
    }
  }

  // No match found — remain in queue with informative search status
  if (!selected) {
    const myElapsed = now - myQueuedAt;
    const isFallbackPhase =
      session.preferences.language !== "Any" &&
      myElapsed >= languageFallbackDelayMs;
    const phase =
      session.preferences.language === "Any"
        ? "connecting"
        : isFallbackPhase
        ? "fallback"
        : "preferred";
    const message =
      phase === "connecting"
        ? "Connecting you with someone new..."
        : phase === "fallback"
        ? "Expanding your search worldwide..."
        : "Looking for someone who speaks your language...";

    emit(session.id, {
      type: "search-status",
      phase,
      message,
    });

    sendState(session);
    broadcastStats();
    return { state: "searching" as const };
  }

  // Match found — create room and notify both participants
  queue.delete(session.id);
  queue.delete(selected.id);

  const room: Room = {
    id: randomBytes(24).toString("base64url"),
    participants: [session.id, selected.id],
    messages: [],
    createdAt: now,
    mediaMode: session.preferences.mediaMode,
    videoReady: new Set(),
  };

  rooms.set(room.id, room);
  registerRoomParticipants(room.id, room.participants);

  session.roomId = room.id;
  selected.roomId = room.id;
  session.state = "chat";
  selected.state = "chat";

  // If cross-language match, inform users of their partner's preference
  if (
    selected.preferences.language !== "Any" &&
    selected.preferences.language !== session.preferences.language
  ) {
    emit(session.id, {
      type: "notice",
      message: `You're connected with someone who prefers ${selected.preferences.language}.`,
    });
  }
  if (
    session.preferences.language !== "Any" &&
    session.preferences.language !== selected.preferences.language
  ) {
    emit(selected.id, {
      type: "notice",
      message: `You're connected with someone who prefers ${session.preferences.language}.`,
    });
  }

  sendState(session);
  sendState(selected);
  broadcastStats();
  return { state: "chat" as const };
}

export function getState(session: Session) {
  const room = roomFor(session);
  const partnerId = room?.participants.find(id => id !== session.id);
  const partner = partnerId ? sessions.get(partnerId) : undefined;
  return room
    ? {
        state: "chat" as const,
        messages: clientMessages(room, session.id, session.token),
        mediaMode: room.mediaMode,
        partnerLanguage: partner?.preferences.language,
      }
    : { state: session.state, mediaMode: session.preferences.mediaMode };
}

function sendVideoStatus(room: Room) {
  const active = room.videoReady.size === room.participants.length;
  for (const participantId of room.participants)
    emit(participantId, {
      type: "video-status",
      readyCount: room.videoReady.size,
      active,
    });
}

export function assertVideoRequestLimit(session: Session) {
  limitSessionWindow(session, "videoRequests", 180, 60_000);
}

export function markVideoReady(session: Session) {
  const room = roomFor(session);
  if (!room || room.mediaMode !== "video" || session.state !== "chat")
    return false;
  const wasReady = room.videoReady.has(session.id);
  room.videoReady.add(session.id);
  sendVideoStatus(room);
  if (!wasReady && room.videoReady.size === room.participants.length) {
    for (const participantId of room.participants) {
      const isOfferer = participantId === session.id;
      emit(participantId, {
        type: "video-start",
        offerer: isOfferer,
        polite: !isOfferer,
      });
    }
  }
  return true;
}

export function stopVideo(
  session: Session,
  message = "Video was stopped. Both people can opt in again at any time."
) {
  const room = roomFor(session);
  if (!room || room.mediaMode !== "video") return false;
  room.videoReady.clear();
  sendVideoStatus(room);
  for (const participantId of room.participants)
    emit(participantId, { type: "video-stopped", message });
  return true;
}

export function forwardVideoSignal(session: Session, signal: VideoSignal) {
  const room = roomFor(session);
  if (
    !room ||
    room.mediaMode !== "video" ||
    room.videoReady.size !== room.participants.length ||
    !room.participants.includes(session.id)
  )
    return false;
  const partnerId = room.participants.find(
    participantId => participantId !== session.id
  );
  if (!partnerId) return false;
  emit(partnerId, { type: "video-signal", signal });
  return true;
}

export function sendChatMessage(
  session: Session,
  text: string,
  mediaId?: string
) {
  const value = (text || "").trim();
  if (!mediaId && (!value || value.length > 500))
    throw new Error("Messages must be between 1 and 500 characters.");
  if (value.length > 500)
    throw new Error("Messages must be 500 characters or fewer.");
  const room = roomFor(session);
  if (!room || session.state !== "chat")
    throw new Error("This conversation has ended. Start a new search.");
  const now = Date.now();
  session.rateWindow = session.rateWindow.filter(time => now - time < 10_000);
  if (session.rateWindow.length >= 8)
    throw new Error("Slow down for a moment before sending another message.");
  session.rateWindow.push(now);

  if (value) {
    const recent = session.recentMessages.filter(item => now - item.at < 30_000);
    const normalized = value.toLowerCase();
    if (
      recent.filter(item => item.text.toLowerCase() === normalized).length >= 2
    ) {
      throw new Error("Repeated messages are limited to help prevent spam.");
    }
    if (
      /(?:[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i.test(value) ||
      /(?:\+?\d[\d\s().-]{7,}\d)/.test(value)
    ) {
      throw new Error(
        "For your privacy, don’t share email addresses or phone numbers in chat."
      );
    }
    if (/https?:\/\//i.test(value))
      throw new Error(
        "Links are disabled in this MVP to help protect you from scams and unsafe sites."
      );
    session.recentMessages = [...recent, { text: value, at: now }].slice(-10);
  }

  let mediaItem = undefined;
  if (mediaId) {
    mediaItem = getAuthorizedMediaSync(mediaId, session.id);
    if (!mediaItem || mediaItem.roomId !== room.id) {
      throw new Error("Unauthorized or invalid image attachment.");
    }
  }

  const message: RoomMessage = {
    id: randomBytes(12).toString("hex"),
    text: value,
    sentAt: now,
    senderId: session.id,
    mediaId: mediaItem ? mediaItem.id : undefined,
    mediaMimeType: mediaItem ? mediaItem.mimeType : undefined,
    mediaWidth: mediaItem ? mediaItem.width : undefined,
    mediaHeight: mediaItem ? mediaItem.height : undefined,
    mediaIsFlagged: mediaItem ? mediaItem.isFlagged : undefined,
  };
  room.messages.push(message);
  if (room.messages.length > 120)
    room.messages.splice(0, room.messages.length - 120);
  for (const participantId of room.participants) {
    const recipient = sessions.get(participantId);
    if (recipient)
      emit(participantId, {
        type: "message",
        message: {
          id: message.id,
          text: message.text,
          sentAt: message.sentAt,
          fromMe: participantId === session.id,
          media: message.mediaId
            ? {
                id: message.mediaId,
                url: `/api/chat/media/${message.mediaId}?token=${encodeURIComponent(recipient.token)}`,
                mimeType: message.mediaMimeType || "image/jpeg",
                width: message.mediaWidth,
                height: message.mediaHeight,
                isFlagged: message.mediaIsFlagged,
              }
            : undefined,
        },
      });
  }
  return { ok: true };
}

export function nextChat(session: Session) {
  const previousRoom = roomFor(session);
  if (previousRoom) closeRoom(previousRoom, "The conversation ended.", true);
  session.state = "idle";
  return startSearching(session);
}

export function endChat(session: Session) {
  queue.delete(session.id);
  const room = roomFor(session);
  if (room) closeRoom(room, "The conversation ended.");
  session.state = "idle";
  sendState(session);
  return { state: "idle" as const };
}

export function blockAndLeave(session: Session) {
  const room = roomFor(session);
  if (!room) return { state: "idle" as const };
  const otherId = room.participants.find(id => id !== session.id);
  if (otherId) {
    session.blocked.add(otherId);
    sessions.get(otherId)?.blocked.add(session.id);
    blockedPairs.set(pairKey(session.id, otherId), Date.now() + BLOCK_TTL);
  }
  closeRoom(room, "The conversation ended.");
  session.state = "idle";
  sendState(session);
  return { state: "idle" as const };
}

export function activePartnerId(session: Session) {
  const room = roomFor(session);
  return room?.participants.find(id => id !== session.id);
}

let broadcastTimer: ReturnType<typeof setTimeout> | null = null;
export function broadcastStats() {
  if (broadcastTimer) return;
  broadcastTimer = setTimeout(() => {
    broadcastTimer = null;
    const stats = getOnlineStats();
    for (const [sessionId, group] of listeners.entries()) {
      if (group.size > 0) {
        emit(sessionId, { type: "stats", ...stats });
      }
    }
  }, 250);
}

export function getOnlineStats() {
  let realOnlineCount = 0;
  let syntheticCount = 0;
  const seenClientKeys = new Set<string>();

  for (const session of sessions.values()) {
    const hasListener = (listeners.get(session.id)?.size ?? 0) > 0;
    const isEngaged = Boolean(session.roomId) || session.state === "searching";
    const isRecentlyActive = Date.now() - session.createdAt < 60_000;
    const isOnline = hasListener || isEngaged || isRecentlyActive;

    if (!isOnline) continue;

    if (session.isSynthetic) {
      syntheticCount++;
      continue;
    }

    const key = session.clientKey && session.clientKey !== "unknown" ? session.clientKey : session.id;
    if (!seenClientKeys.has(key)) {
      seenClientKeys.add(key);
      realOnlineCount++;
    }
  }

  return {
    activeSessions: realOnlineCount,
    activeRooms: rooms.size,
    queuedUsers: queue.size,
    onlineCount: realOnlineCount,
    syntheticCount,
  };
}

export function disconnectAll() {
  for (const timer of disconnectTimers.values()) clearTimeout(timer);
  disconnectTimers.clear();
  sessions.clear();
  queue.clear();
  rooms.clear();
  listeners.clear();
  blockedPairs.clear();
  requestRates.clear();
}

export function resetChatState() {
  disconnectAll();
  languageFallbackDelayMs = Number(
    process.env.LANGUAGE_FALLBACK_DELAY_MS || 5_000
  );
  immediateCrossLanguageEnabled = true;
}

setInterval(() => {
  const now = Date.now();
  for (const session of sessions.values())
    if (!eligible(session)) removeSession(session);
  for (const [key, expiresAt] of blockedPairs)
    if (expiresAt < now) blockedPairs.delete(key);
  for (const [id, room] of rooms)
    if (now - room.createdAt > ROOM_TTL)
      closeRoom(room, "This conversation expired.");

  if (queue.size > 0) {
    for (const [sessionId, queuedAt] of [...queue.entries()]) {
      const session = sessions.get(sessionId);
      if (!session || session.state !== "searching" || session.roomId) continue;

      const elapsed = now - queuedAt;
      if (
        session.preferences.language !== "Any" &&
        elapsed >= languageFallbackDelayMs
      ) {
        emit(session.id, {
          type: "search-status",
          phase: "fallback",
          message: "Expanding your search worldwide...",
        });
      }

      if (queue.size > 1) {
        startSearching(session);
      }
    }
  }
}, 1_000).unref();
