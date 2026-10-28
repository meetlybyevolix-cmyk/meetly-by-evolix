import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { config, generateIceServers } from "../config";
import { registerChatSocket, closeChatSocket } from "../chat/live";
import { getSession, getOnlineStats } from "../chat/service";
import { appRouter } from "../routers";
import {
  listSafetyReports,
  updateSafetyReportStatus,
  getSafetyReportStats,
  ReportPriority,
} from "../db";
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

  // Readiness Probe Endpoint
  app.get("/api/ready", (_req, res) => {
    const memory = process.memoryUsage();
    const heapRatio = memory.heapUsed / memory.heapTotal;
    if (heapRatio > 0.95) {
      return res.status(503).json({
        status: "overloaded",
        reason: "Heap memory usage exceeded 95%",
        uptime: process.uptime(),
      });
    }
    res.set("Cache-Control", "no-store").json({
      status: "ready",
      service: "Meetly",
      uptime: process.uptime(),
      heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
    });
  });

  // ICE Servers Configuration Endpoint (Configurable STUN/TURN with Ephemeral Credential Generation)
  app.get("/api/ice-servers", (req, res) => {
    const sessionToken =
      (req.headers["x-meetly-session"] as string) ||
      (req.query.token as string);
    const session = getSession(sessionToken);
    res.set("Cache-Control", "no-store").json({
      iceServers: generateIceServers(session?.id),
    });
  });

  // Moderation Authentication Middleware
  const requireModerationAuth = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const configuredKey = process.env.MODERATOR_KEY || process.env.ADMIN_KEY;
    if (!configuredKey) {
      if (config.nodeEnv === "development") {
        return next();
      }
      return res
        .status(401)
        .json({ error: "Moderation API key is not configured on server" });
    }
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : req.headers["x-moderator-key"];
    if (token === configuredKey) {
      return next();
    }
    return res.status(403).json({ error: "Unauthorized moderation access" });
  };

  // Moderation API Endpoints
  app.get("/api/moderation/reports", requireModerationAuth, async (req, res) => {
    try {
      const reports = await listSafetyReports({
        status: req.query.status as string,
        priority: req.query.priority as ReportPriority,
        limit: Number(req.query.limit) || 50,
      });
      res.json({ reports });
    } catch {
      res.status(500).json({ error: "Failed to list safety reports" });
    }
  });

  app.post("/api/moderation/reports/:id", requireModerationAuth, async (req, res) => {
    try {
      const { status } = req.body;
      if (!["open", "reviewed", "actioned", "closed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      const updated = await updateSafetyReportStatus(req.params.id, status);
      res.json({ success: updated });
    } catch {
      res.status(500).json({ error: "Failed to update report status" });
    }
  });

  app.get("/api/moderation/stats", requireModerationAuth, async (_req, res) => {
    try {
      const stats = await getSafetyReportStats();
      res.json({ stats });
    } catch {
      res.status(500).json({ error: "Failed to fetch moderation stats" });
    }
  });

  // Metrics Endpoint (Operator & Observability)
  app.get("/api/metrics", requireModerationAuth, async (_req, res) => {
    try {
      const memory = process.memoryUsage();
      const online = getOnlineStats();
      const safety = await getSafetyReportStats();
      res.json({
        service: "Meetly",
        timestamp: Date.now(),
        uptimeSeconds: Math.floor(process.uptime()),
        memory: {
          heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
          rssMb: Math.round(memory.rss / 1024 / 1024),
        },
        traffic: {
          activeSessions: online.activeSessions,
          activeRooms: online.activeRooms,
          queuedUsers: online.queuedUsers,
        },
        safety,
      });
    } catch {
      res.status(500).json({ error: "Failed to generate metrics" });
    }
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
