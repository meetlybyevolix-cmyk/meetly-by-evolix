import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config";

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
  "Other",
] as const;
export const REPORT_REASONS = [
  "Harassment or bullying",
  "Sexual or explicit content",
  "Suspected minor",
  "Threats or violent behavior",
  "Spam or scams",
  "Hate or abusive language",
  "Impersonation",
  "Other safety concern",
] as const;

export type ChatState = "idle" | "searching" | "chat";
export type ChatMessage = {
  id: string;
  text: string;
  sentAt: number;
  fromMe: boolean;
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
type Preferences = {
  interests: string[];
  language: string;
  mediaMode: MediaMode;
};
type Session = {
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
};
type RoomMessage = {
  id: string;
  text: string;
  sentAt: number;
  senderId: string;
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
    }
  | { type: "message"; message: ChatMessage }
  | { type: "notice"; message: string }
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
const FALLBACK_AFTER = 8_000;

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
function clientMessages(room: Room, viewerId: string): ChatMessage[] {
  return room.messages.map(message => ({
    id: message.id,
    text: message.text,
    sentAt: message.sentAt,
    fromMe: message.senderId === viewerId,
  }));
}
function sendState(session: Session) {
  const room = roomFor(session);
  emit(
    session.id,
    room
      ? {
          type: "state",
          state: "chat",
          messages: clientMessages(room, session.id),
          mediaMode: room.mediaMode,
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
  },
  clientKey = "unknown"
) {
  limitRequest("session-create", clientKey, 20, 60_000);
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
  };
  sessions.set(id, session);
  return { token, expiresAt: session.createdAt + SESSION_TTL };
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

  disconnectTimers.set(
    sessionId,
    setTimeout(() => {
      disconnectTimers.delete(sessionId);
      const current = sessions.get(sessionId);
      if (current) removeSession(current);
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

function score(a: Session, b: Session) {
  const shared = a.preferences.interests.filter(interest =>
    b.preferences.interests.includes(interest)
  ).length;
  const languageMatch =
    a.preferences.language === "Any" ||
    b.preferences.language === "Any" ||
    a.preferences.language === b.preferences.language;
  return (languageMatch ? 100 : 0) + shared * 10;
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
  queue.set(session.id, queue.get(session.id) ?? Date.now());
  const now = Date.now();
  const candidates = [...queue.entries()]
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
    )
    .filter(
      ({ candidate }) =>
        score(session, candidate) > 0 ||
        (now - (queue.get(session.id) ?? now) >= FALLBACK_AFTER &&
          now - (queue.get(candidate.id) ?? now) >= FALLBACK_AFTER)
    )
    .sort(
      (left, right) =>
        score(right.candidate, session) - score(left.candidate, session) ||
        left.queuedAt - right.queuedAt
    );

  const selected = candidates[0]?.candidate;
  if (!selected) {
    sendState(session);
    return { state: "searching" as const };
  }
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
  session.roomId = room.id;
  selected.roomId = room.id;
  session.state = "chat";
  selected.state = "chat";
  sendState(session);
  sendState(selected);
  return { state: "chat" as const };
}

export function getState(session: Session) {
  const room = roomFor(session);
  return room
    ? {
        state: "chat" as const,
        messages: clientMessages(room, session.id),
        mediaMode: room.mediaMode,
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

export function sendChatMessage(session: Session, text: string) {
  const value = text.trim();
  if (!value || value.length > 500)
    throw new Error("Messages must be between 1 and 500 characters.");
  const room = roomFor(session);
  if (!room || session.state !== "chat")
    throw new Error("This conversation has ended. Start a new search.");
  const now = Date.now();
  session.rateWindow = session.rateWindow.filter(time => now - time < 10_000);
  if (session.rateWindow.length >= 8)
    throw new Error("Slow down for a moment before sending another message.");
  session.rateWindow.push(now);
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
  const message: RoomMessage = {
    id: randomBytes(12).toString("hex"),
    text: value,
    sentAt: now,
    senderId: session.id,
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

export function getOnlineStats() {
  return {
    activeSessions: sessions.size,
    activeRooms: rooms.size,
    queuedUsers: queue.size,
    onlineCount: sessions.size,
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

setInterval(() => {
  const now = Date.now();
  for (const session of sessions.values())
    if (!eligible(session)) removeSession(session);
  for (const [key, expiresAt] of blockedPairs)
    if (expiresAt < now) blockedPairs.delete(key);
  for (const [id, room] of rooms)
    if (now - room.createdAt > ROOM_TTL)
      closeRoom(room, "This conversation expired.");
  if (queue.size > 1) {
    for (const sessionId of queue.keys()) {
      const session = sessions.get(sessionId);
      if (session && now - (queue.get(sessionId) ?? now) >= FALLBACK_AFTER)
        startSearching(session);
    }
  }
}, 1_000).unref();
