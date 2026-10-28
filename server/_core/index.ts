import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { config } from "../config";
import { registerChatSocket, closeChatSocket } from "../chat/live";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust proxy in production behind reverse proxies (Nginx, Traefik, Cloudflare, etc.)
  if (config.isProduction) {
    app.set("trust proxy", 1);
  }

  // Security Headers
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    if (config.isProduction) {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains"
      );
    }
    next();
  });

  // CORS Middleware
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (config.corsOrigin === "*") {
      res.setHeader("Access-Control-Allow-Origin", "*");
    } else if (origin) {
      const allowed = config.corsOrigin.split(",").map(o => o.trim());
      if (allowed.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      }
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Meetly-Session"
    );
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // WebSocket Server for Real-Time Chat & WebRTC Signaling
  registerChatSocket(server, config.nodeEnv === "development");

  // Body parsers
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  // Health check endpoints
  const healthHandler = (_req: express.Request, res: express.Response) => {
    res.set("Cache-Control", "no-store").json({
      status: "ok",
      service: "Meetly",
      timestamp: Date.now(),
      uptime: process.uptime(),
    });
  };
  app.get("/api/health", healthHandler);
  app.get("/healthz", healthHandler);

  // ICE Servers Configuration Endpoint (Configurable STUN/TURN for WebRTC)
  app.get("/api/ice-servers", (_req, res) => {
    res.set("Cache-Control", "no-store").json({
      iceServers: config.iceServers,
    });
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Client serving: development uses Vite HMR (when running source), production serves static dist
  const isRunningFromDist = import.meta.dirname.endsWith("dist");
  if (config.nodeEnv === "development" && !isRunningFromDist) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = config.port;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT configuration: ${port}`);
  }

  server.on("error", error => {
    console.error("[Server Error]", error.message);
    process.exit(1);
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(
      `[Meetly] Server listening on port ${port} (mode: ${config.nodeEnv})`
    );
  });

  // Graceful shutdown
  const gracefulShutdown = (signal: string) => {
    console.log(`[Meetly] Received ${signal}. Starting graceful shutdown...`);
    closeChatSocket();
    server.close(() => {
      console.log("[Meetly] HTTP and WebSocket server closed cleanly.");
      process.exit(0);
    });
    setTimeout(() => {
      console.error("[Meetly] Forced shutdown after timeout.");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

startServer().catch(error => {
  console.error("[Server Startup Error]", error);
  process.exit(1);
});
