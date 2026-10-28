import type { Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { z } from "zod";
import { config } from "../config";
import {
  assertVideoRequestLimit,
  forwardVideoSignal,
  getOnlineStats,
  getSession,
  getState,
  markVideoReady,
  onClientConnect,
  onClientDisconnect,
  sendChatMessage,
  stopVideo,
  subscribe,
  type VideoSignal,
} from "./service";

const videoSignalSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("description"),
      descriptionType: z.enum(["offer", "answer", "pranswer", "rollback"]),
      sdp: z.string().min(1).max(100_000),
    })
    .passthrough(),
  z
    .object({
      kind: z.literal("candidate"),
      candidate: z
        .object({
          candidate: z.string().max(4_096).nullable().optional().default(""),
          sdpMid: z.string().max(256).nullable().optional(),
          sdpMLineIndex: z.number().int().min(0).max(1024).nullable().optional(),
          usernameFragment: z.string().max(256).nullable().optional(),
        })
        .passthrough(),
    })
    .passthrough(),
]);

let chatWss: WebSocketServer | null = null;

export function registerChatSocket(
  server: Server,
  passThroughOtherUpgrades = false
) {
  const sockets = new WebSocketServer({
    noServer: true,
    maxPayload: 512 * 1024,
  });
  chatWss = sockets;

  server.on("upgrade", (request, socket, head) => {
    let pathname = "";
    try {
      pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    } catch {
      socket.destroy();
      return;
    }
    if (pathname !== "/api/chat/live") {
      if (!passThroughOtherUpgrades) socket.destroy();
      return;
    }

    // Origin validation if CORS_ORIGIN is configured to specific domains
    const origin = request.headers.origin;
    if (config.corsOrigin !== "*" && origin) {
      const allowed = config.corsOrigin.split(",").map(o => o.trim());
      if (!allowed.includes(origin)) {
        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        socket.destroy();
        return;
      }
    }

    sockets.handleUpgrade(request, socket, head, webSocket => {
      sockets.emit("connection", webSocket, request);
    });
  });

  sockets.on("connection", (webSocket: WebSocket) => {
    let unsubscribe: (() => void) | undefined;
    let authenticatedSessionId: string | undefined;
    let authenticatedToken: string | undefined;
    let authed = false;
    let isAlive = true;

    webSocket.on("pong", () => {
      isAlive = true;
    });

    const pingInterval = setInterval(() => {
      if (!isAlive) {
        webSocket.terminate();
        return;
      }
      isAlive = false;
      webSocket.ping();
    }, 30_000);

    const authTimeout = setTimeout(() => {
      if (!authed) webSocket.close(4401, "Authorization required");
    }, 5_000);

    webSocket.on("message", raw => {
      let payload: { type?: string; token?: string; signal?: unknown };
      try {
        payload = JSON.parse(raw.toString());
      } catch {
        webSocket.close(4400, "Invalid message");
        return;
      }
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        webSocket.close(4400, "Invalid message");
        return;
      }
      if (!authed) {
        if (payload.type !== "auth" || typeof payload.token !== "string") {
          webSocket.close(4401, "Authorization required");
          return;
        }
        const session = getSession(payload.token);
        if (!session) {
          webSocket.close(4401, "Session expired");
          return;
        }
        authed = true;
        authenticatedSessionId = session.id;
        authenticatedToken = session.token;
        clearTimeout(authTimeout);
        onClientConnect(session.id);
        unsubscribe = subscribe(session.id, event => {
          if (webSocket.readyState === WebSocket.OPEN)
            webSocket.send(JSON.stringify(event));
        });
        webSocket.send(JSON.stringify({ type: "state", ...getState(session) }));
        webSocket.send(JSON.stringify({ type: "stats", ...getOnlineStats() }));
        return;
      }

      const session = getSession(authenticatedToken);
      if (!session) {
        webSocket.close(4401, "Session expired");
        return;
      }
      if (payload.type === "message" && typeof (payload as any).text === "string") {
        try {
          sendChatMessage(session, (payload as any).text);
        } catch (error) {
          webSocket.send(JSON.stringify({ type: "notice", message: error instanceof Error ? error.message : "Message failed" }));
        }
        return;
      }
      if (payload.type === "video-ready") {
        try {
          assertVideoRequestLimit(session);
          if (!markVideoReady(session)) {
            webSocket.send(
              JSON.stringify({
                type: "video-error",
                message:
                  "Video is available only inside an active video-mode room.",
              })
            );
          }
        } catch (error) {
          webSocket.send(
            JSON.stringify({
              type: "video-error",
              message:
                error instanceof Error
                  ? error.message
                  : "Video could not be started.",
            })
          );
        }
        return;
      }
      if (payload.type === "video-stop" || payload.type === "video-decline") {
        try {
          assertVideoRequestLimit(session);
          if (!stopVideo(session)) {
            webSocket.send(
              JSON.stringify({
                type: "video-error",
                message: "There is no active video room to stop.",
              })
            );
          }
        } catch (error) {
          webSocket.send(
            JSON.stringify({
              type: "video-error",
              message:
                error instanceof Error
                  ? error.message
                  : "Video could not be stopped.",
            })
          );
        }
        return;
      }
      if (payload.type === "video-signal") {
        const parsedSignal = videoSignalSchema.safeParse(payload.signal);
        if (!parsedSignal.success) {
          console.warn("[WebRTC] Ignored malformed video signal:", parsedSignal.error.issues);
          return;
        }
        try {
          assertVideoRequestLimit(session);
          if (!forwardVideoSignal(session, parsedSignal.data as VideoSignal)) {
            webSocket.send(
              JSON.stringify({
                type: "video-error",
                message:
                  "Video signaling is not authorized for this room or until both people opt in.",
              })
            );
          }
        } catch (error) {
          webSocket.send(
            JSON.stringify({
              type: "video-error",
              message:
                error instanceof Error
                  ? error.message
                  : "Video signaling was limited.",
            })
          );
        }
        return;
      }
    });

    const cleanup = () => {
      clearInterval(pingInterval);
      clearTimeout(authTimeout);
      unsubscribe?.();
      if (authed && authenticatedSessionId) {
        onClientDisconnect(authenticatedSessionId);
      }
    };

    webSocket.on("close", cleanup);
    webSocket.on("error", cleanup);
  });

  return sockets;
}

export function closeChatSocket() {
  if (chatWss) {
    for (const client of chatWss.clients) {
      try {
        client.close(1001, "Server shutting down");
      } catch {
        client.terminate();
      }
    }
    chatWss.close();
    chatWss = null;
  }
}
