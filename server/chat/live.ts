import type { Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { z } from "zod";
import { assertVideoRequestLimit, forwardVideoSignal, getSession, getState, markVideoReady, onClientConnect, onClientDisconnect, stopVideo, subscribe } from "./service";

const videoSignalSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("description"), descriptionType: z.enum(["offer", "answer"]), sdp: z.string().min(1).max(20_000) }).strict(),
  z.object({ kind: z.literal("candidate"), candidate: z.object({
    candidate: z.string().max(2_048),
    sdpMid: z.string().max(256).nullable().optional(),
    sdpMLineIndex: z.number().int().min(0).max(256).nullable().optional(),
    usernameFragment: z.string().max(256).nullable().optional(),
  }).strict() }).strict(),
]);

export function registerChatSocket(server: Server, passThroughOtherUpgrades = false) {
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 32 * 1024 });

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
    sockets.handleUpgrade(request, socket, head, webSocket => sockets.emit("connection", webSocket, request));
  });

  sockets.on("connection", (webSocket: WebSocket) => {
    let unsubscribe: (() => void) | undefined;
    let authenticatedSessionId: string | undefined;
    let authenticatedToken: string | undefined;
    let authed = false;
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
          if (webSocket.readyState === WebSocket.OPEN) webSocket.send(JSON.stringify(event));
        });
        webSocket.send(JSON.stringify({ type: "state", ...getState(session) }));
        return;
      }

      const session = getSession(authenticatedToken);
      if (!session) {
        webSocket.close(4401, "Session expired");
        return;
      }
      if (payload.type === "video-ready") {
        try {
          assertVideoRequestLimit(session);
          if (!markVideoReady(session)) webSocket.send(JSON.stringify({ type: "video-error", message: "Video is available only inside an active video-mode room." }));
        } catch (error) {
          webSocket.send(JSON.stringify({ type: "video-error", message: error instanceof Error ? error.message : "Video could not be started." }));
        }
        return;
      }
      if (payload.type === "video-stop" || payload.type === "video-decline") {
        try {
          assertVideoRequestLimit(session);
          if (!stopVideo(session)) webSocket.send(JSON.stringify({ type: "video-error", message: "There is no active video room to stop." }));
        } catch (error) {
          webSocket.send(JSON.stringify({ type: "video-error", message: error instanceof Error ? error.message : "Video could not be stopped." }));
        }
        return;
      }
      if (payload.type === "video-signal") {
        const parsedSignal = videoSignalSchema.safeParse(payload.signal);
        if (!parsedSignal.success) {
          webSocket.close(4400, "Invalid video signal");
          return;
        }
        try {
          assertVideoRequestLimit(session);
          if (!forwardVideoSignal(session, parsedSignal.data)) webSocket.send(JSON.stringify({ type: "video-error", message: "Video signaling is not authorized for this room or until both people opt in." }));
        } catch (error) {
          webSocket.send(JSON.stringify({ type: "video-error", message: error instanceof Error ? error.message : "Video signaling was limited." }));
        }
      }
    });

    webSocket.on("close", () => {
      clearTimeout(authTimeout);
      unsubscribe?.();
      if (authed) {
        if (authenticatedSessionId) onClientDisconnect(authenticatedSessionId);
      }
    });
    webSocket.on("error", () => {
      clearTimeout(authTimeout);
      unsubscribe?.();
      if (authed && authenticatedSessionId) onClientDisconnect(authenticatedSessionId);
    });
  });
}
