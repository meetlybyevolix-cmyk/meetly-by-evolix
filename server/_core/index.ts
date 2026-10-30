import "dotenv/config";
import express from "express";
import { createServer } from "http";
import fs from "node:fs";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { z } from "zod";
import { config, generateIceServers } from "../config";
import {
  checkLegalLaunchReadiness,
  getLegalConfig,
} from "../legalConfig";
import { registerChatSocket, closeChatSocket } from "../chat/live";
import { getSession, getOnlineStats } from "../chat/service";
import { saveUploadedImage, getAuthorizedMedia, reportMedia } from "../chat/media";
import { appRouter } from "../routers";
import {
  listSafetyReports,
  updateSafetyReportStatus,
  getSafetyReportStats,
  insertGrievanceTicket,
  listGrievanceTickets,
  getGrievanceTicketByCode,
  updateGrievanceTicketStatus,
  getGrievanceStats,
  insertDataSubjectRequest,
  listDataSubjectRequests,
  getDataSubjectRequestByCode,
  updateDataSubjectRequestStatus,
  ReportPriority,
  checkDatabaseHealth,
  DatabaseDurabilityError,
  upsertUser,
  getUserByOpenId,
  getInternalUserId,
} from "../db";
import { COOKIE_NAME } from "@shared/const";
import { verifyGoogleIdToken, assertGoogleAuthRateLimit } from "../googleAuth";
import {
  syncUserRegistration,
  syncUserDeletion,
  isGoogleSheetsConfigured,
  getPendingSyncQueueLength,
} from "../googleSheets";
import {
  createAuthSessionToken,
  verifyAuthSessionToken,
  setAuthCookie,
  clearAuthCookie,
  parseCookies,
} from "../authSession";
import {
  initiateAgeAssurance,
  verifyAgeAssurance,
  checkAgeAssurance,
} from "../ageAssurance";
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

  // In-Memory IP Rate Limiter Middleware Factory
  const createIpRateLimiter = (options: {
    windowMs: number;
    max: number;
    message?: string;
  }) => {
    const hits = new Map<string, number[]>();
    const windowMs = options.windowMs;
    const max = options.max;
    const message =
      options.message || "Too many requests. Please slow down and try again later.";

    return (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      const now = Date.now();
      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.ip ||
        req.socket.remoteAddress ||
        "unknown-ip";
      const timestamps = hits.get(ip) || [];
      const valid = timestamps.filter(t => now - t < windowMs);

      if (valid.length >= max) {
        const retryAfter = Math.max(1, Math.ceil(windowMs / 1000));
        res.setHeader("Retry-After", retryAfter);
        return res.status(429).json({
          error: message,
          retryAfterSeconds: retryAfter,
        });
      }

      valid.push(now);
      hits.set(ip, valid);

      if (hits.size > 5000) {
        for (const [k, times] of hits) {
          if (times.every(t => now - t >= windowMs)) {
            hits.delete(k);
          }
          if (hits.size <= 3000) break;
        }
      }

      next();
    };
  };

  // CORS Middleware (Cross-Origin Support for Cloudflare Pages & Render)
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      const allowedOrigins = config.corsOrigin === "*"
        ? [origin]
        : config.corsOrigin.split(",").map(o => o.trim());

      if (config.corsOrigin === "*" || allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Vary", "Origin");
      }
    } else if (config.corsOrigin === "*") {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Meetly-Session, X-Moderator-Key"
    );
    res.setHeader("Access-Control-Max-Age", "86400");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Global HTTP API Rate Limiter (Max 120 reqs/min per IP in production; relaxed in dev/test for staging benchmarks)
  const isDevOrTest = config.nodeEnv !== "production";
  const apiLimiter = createIpRateLimiter({
    windowMs: 60_000,
    max: isDevOrTest ? 2_000 : 120,
    message: "Too many API requests from this network address.",
  });
  app.use("/api", apiLimiter);

  // WebSocket Server for Real-Time Chat & WebRTC Signaling
  registerChatSocket(server, config.nodeEnv === "development");

  // Body parsers with strict size limits
  app.use(express.json({ limit: "256kb" }));
  app.use(express.urlencoded({ limit: "256kb", extended: true }));

  // Health check endpoints
  const healthHandler = (_req: express.Request, res: express.Response) => {
    res.set("Cache-Control", "no-store").json({
      status: "ok",
      service: "Meetly",
      timestamp: Date.now(),
    });
  };
  app.get("/api/health", healthHandler);
  app.get("/healthz", healthHandler);

  // Legal & Compliance Public Configuration Endpoint
  app.get("/api/legal-config", (_req, res) => {
    res.set("Cache-Control", "public, max-age=3600").json(getLegalConfig());
  });

  // Grievance Redressal Schemas & Endpoints (IT Rules, 2021 Rule 3(2))
  const grievanceInputSchema = z.object({
    complainantName: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
    complainantEmail: z.string().trim().email("Invalid email address").max(320),
    category: z.enum([
      "content_removal",
      "privacy_complaint",
      "safety_concern",
      "user_conduct",
      "other",
    ]),
    subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(256),
    details: z.string().trim().min(10, "Details must be at least 10 characters").max(5000),
    evidence: z.string().trim().max(5000).optional(),
  });

  const grievanceLimiter = createIpRateLimiter({
    windowMs: 60_000,
    max: 10,
    message: "Too many grievance submissions from this network. Please wait a moment.",
  });

  app.post("/api/grievance/submit", grievanceLimiter, async (req, res) => {
    try {
      const parsed = grievanceInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: parsed.error.issues.map(i => i.message),
        });
      }

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomSuffix = randomBytes(4).toString("hex").toUpperCase();
      const ticketCode = `GRV-${dateStr}-${randomSuffix}`;
      const ticketId = randomUUID();

      const record = await insertGrievanceTicket({
        id: ticketId,
        ticketCode,
        complainantName: parsed.data.complainantName,
        complainantEmail: parsed.data.complainantEmail,
        category: parsed.data.category,
        subject: parsed.data.subject,
        details: parsed.data.details,
        evidence: parsed.data.evidence,
        status: "received",
      });

      return res.status(201).json({
        success: true,
        ticketCode: record.ticketCode,
        acknowledgedAt: record.acknowledgedAt,
        message:
          "Your grievance has been officially registered under Rule 3(2) of the Information Technology (Intermediary Guidelines) Rules, 2021. You will receive an acknowledgment receipt and response within statutory timelines.",
      });
    } catch (error) {
      if (error instanceof DatabaseDurabilityError) {
        return res.status(503).json({
          error: "Service Temporarily Unavailable",
          message: "Durable database write failed. Your grievance could not be persisted at this time.",
        });
      }
      console.error("[Grievance API] Submission failed:", error);
      return res.status(500).json({ error: "Failed to register grievance" });
    }
  });

  app.get("/api/grievance/status/:ticketCode", async (req, res) => {
    try {
      const ticket = await getGrievanceTicketByCode(req.params.ticketCode);
      if (!ticket) {
        return res.status(404).json({ error: "Grievance ticket not found" });
      }
      return res.json({
        ticketCode: ticket.ticketCode,
        category: ticket.category,
        status: ticket.status,
        acknowledgedAt: ticket.acknowledgedAt,
        resolvedAt: ticket.resolvedAt,
        resolutionSummary: ticket.status === "closed" || ticket.status === "actioned"
          ? (ticket.resolutionNotes || "This matter has been reviewed and actioned in accordance with our terms.")
          : "Under formal review by the Grievance Officer.",
      });
    } catch (error) {
      console.error("[Grievance API] Status check failed:", error);
      return res.status(500).json({ error: "Failed to fetch grievance status" });
    }
  });

  // Data Subject Rights Request Schemas & Endpoints (DPDP Act, 2023)
  const dataRequestInputSchema = z.object({
    requestType: z.enum([
      "access_summary",
      "erasure",
      "correction",
      "consent_withdrawal",
      "inquiry",
    ]),
    contactEmail: z.string().trim().email("Invalid email address").max(320),
    sessionIdentifierHash: z.string().trim().max(64).optional(),
    details: z.string().trim().min(10, "Details must be at least 10 characters").max(5000),
  });

  app.post("/api/privacy/data-request", grievanceLimiter, async (req, res) => {
    try {
      const parsed = dataRequestInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: parsed.error.issues.map(i => i.message),
        });
      }

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomSuffix = randomBytes(4).toString("hex").toUpperCase();
      const requestCode = `DSR-${dateStr}-${randomSuffix}`;
      const requestId = randomUUID();

      const record = await insertDataSubjectRequest({
        id: requestId,
        requestCode,
        requestType: parsed.data.requestType,
        contactEmail: parsed.data.contactEmail,
        sessionIdentifierHash: parsed.data.sessionIdentifierHash,
        details: parsed.data.details,
        status: "received",
      });

      return res.status(201).json({
        success: true,
        requestCode: record.requestCode,
        message:
          "Your data principal rights request has been registered in accordance with the Digital Personal Data Protection Act, 2023. Our privacy team will review and respond to your verified request.",
      });
    } catch (error) {
      if (error instanceof DatabaseDurabilityError) {
        return res.status(503).json({
          error: "Service Temporarily Unavailable",
          message: "Durable database write failed. Your privacy request could not be persisted at this time.",
        });
      }
      console.error("[Data Rights API] Submission failed:", error);
      return res.status(500).json({ error: "Failed to register data request" });
    }
  });

  app.get("/api/privacy/data-request/:requestCode", async (req, res) => {
    try {
      const record = await getDataSubjectRequestByCode(req.params.requestCode);
      if (!record) {
        return res.status(404).json({ error: "Data request record not found" });
      }
      return res.json({
        requestCode: record.requestCode,
        requestType: record.requestType,
        status: record.status,
        createdAt: record.createdAt,
        resolvedAt: record.resolvedAt,
        summary: record.status === "completed"
          ? (record.responseNotes || "Your request has been processed.")
          : "Under review by the Privacy Officer.",
      });
    } catch (error) {
      console.error("[Data Rights API] Status check failed:", error);
      return res.status(500).json({ error: "Failed to fetch data request status" });
    }
  });

  // Google OAuth Login & Registration Endpoint (Phase 8)
  app.post("/api/auth/google", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      assertGoogleAuthRateLimit(clientIp);

      const idToken =
        req.body?.idToken || req.headers.authorization?.replace(/^Bearer\s+/i, "");
      if (!idToken) {
        return res
          .status(400)
          .json({ error: "idToken is required in request body or Authorization header" });
      }

      const verified = await verifyGoogleIdToken(idToken);
      const existing = await getUserByOpenId(verified.sub);
      const isNewUser = !existing;
      const now = new Date();

      await upsertUser({
        openId: verified.sub,
        name: verified.name,
        email: verified.email,
        loginMethod: "google",
        role: existing?.role || "user",
        lastSignedIn: now,
        createdAt: existing?.createdAt || now,
      });

      const user = await getUserByOpenId(verified.sub);
      if (!user) {
        return res.status(500).json({ error: "Failed to persist user profile" });
      }

      const internalUserId = getInternalUserId(user);

      // Async Google Sheets Administrative Sync
      let sheetsSyncStatus = { synced: false, action: "queued" };
      try {
        const syncRes = await syncUserRegistration({
          userId: internalUserId,
          customerName: verified.name,
          registrationDate: user.createdAt || now,
          lastLogin: now,
          status: "Active",
        });
        sheetsSyncStatus = { synced: syncRes.synced, action: syncRes.action };
      } catch (sheetsErr) {
        console.warn("[Google Sheets Sync] Non-fatal sync warning:", sheetsErr);
      }

      const sessionToken = createAuthSessionToken(user);
      setAuthCookie(res, req, sessionToken);

      return res.status(200).json({
        success: true,
        isNewUser,
        sessionToken,
        sheetsSync: sheetsSyncStatus,
        user: {
          id: user.id,
          userId: internalUserId,
          name: user.name,
          email: user.email,
          role: user.role,
          lastSignedIn: user.lastSignedIn,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Authentication failed";
      const status = msg.includes("Too many") ? 429 : 400;
      return res.status(status).json({ error: msg });
    }
  });

  // Current User Profile Endpoint
  app.get("/api/auth/me", async (req, res) => {
    try {
      const rawCookie = req.headers.cookie || "";
      const parsedCookies = parseCookies(rawCookie);
      const token =
        parsedCookies[COOKIE_NAME] ||
        req.headers.authorization?.replace(/^Bearer\s+/i, "");

      if (!token) {
        return res.status(200).json({ authenticated: false, user: null });
      }

      const payload = verifyAuthSessionToken(token);
      if (!payload?.openId) {
        return res.status(200).json({ authenticated: false, user: null });
      }

      const user = await getUserByOpenId(payload.openId);
      if (!user) {
        return res.status(200).json({ authenticated: false, user: null });
      }

      return res.status(200).json({
        authenticated: true,
        user: {
          id: user.id,
          userId: getInternalUserId(user),
          name: user.name,
          email: user.email,
          role: user.role,
          lastSignedIn: user.lastSignedIn,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch user session" });
    }
  });

  // Logout Endpoint
  app.post("/api/auth/logout", (req, res) => {
    clearAuthCookie(res, req);
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  });

  // Google Sheets Administrative Status Endpoint
  app.get("/api/sheets/status", (req, res) => {
    return res.json({
      configured: isGoogleSheetsConfigured(),
      spreadsheetId: config.googleSheetsSpreadsheetId
        ? `${config.googleSheetsSpreadsheetId.slice(0, 6)}...`
        : null,
      serviceAccount: config.googleServiceAccountEmail
        ? config.googleServiceAccountEmail
        : null,
      pendingSyncCount: getPendingSyncQueueLength(),
    });
  });

  // Age Assurance Schemas & Endpoints (DPDP Act, 2023 18+ Verification)
  const ageVerifyInputSchema = z.object({
    over18Confirmed: z.boolean(),
    provider: z.string().trim().max(32).optional(),
    auditToken: z.string().trim().max(256).optional(),
  });

  app.post("/api/age/initiate", grievanceLimiter, async (req, res) => {
    try {
      const sessionToken =
        (req.headers["x-meetly-session"] as string) || req.body?.token;
      const session = getSession(sessionToken);
      if (!session) {
        return res.status(401).json({ error: "Valid session required to initiate age verification" });
      }

      const challenge = await initiateAgeAssurance(session.id);
      return res.status(200).json(challenge);
    } catch (error) {
      console.error("[Age Assurance API] Initiate failed:", error);
      return res.status(500).json({ error: "Failed to initiate age assurance challenge" });
    }
  });

  app.post("/api/age/verify", grievanceLimiter, async (req, res) => {
    try {
      const sessionToken =
        (req.headers["x-meetly-session"] as string) || req.body?.token;
      const session = getSession(sessionToken);
      if (!session) {
        return res.status(401).json({ error: "Valid session required to verify age" });
      }

      const parsed = ageVerifyInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: parsed.error.issues.map(i => i.message),
        });
      }

      const result = await verifyAgeAssurance(session.id, parsed.data);
      return res.status(result.status === "verified" ? 200 : 403).json(result);
    } catch (error) {
      if (error instanceof DatabaseDurabilityError) {
        return res.status(503).json({
          error: "Service Temporarily Unavailable",
          message: "Durable database write failed during age verification.",
        });
      }
      console.error("[Age Assurance API] Verification failed:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Age assurance verification failed",
      });
    }
  });

  app.get("/api/age/status", async (req, res) => {
    try {
      const sessionToken =
        (req.headers["x-meetly-session"] as string) || (req.query?.token as string);
      const session = getSession(sessionToken);
      if (!session) {
        return res.status(401).json({ error: "Valid session required" });
      }

      const status = await checkAgeAssurance(session.id);
      return res.json(status);
    } catch (error) {
      console.error("[Age Assurance API] Status check failed:", error);
      return res.status(500).json({ error: "Failed to check age assurance status" });
    }
  });

  // Readiness Probe Endpoint (Sanitized: verifies memory usage and durable database connectivity)
  app.get("/api/ready", async (_req, res) => {
    const memory = process.memoryUsage();
    const heapRatio = memory.heapUsed / memory.heapTotal;
    if (heapRatio > 0.95) {
      return res.status(503).json({
        status: "overloaded",
      });
    }

    const dbHealth = await checkDatabaseHealth();
    if (!dbHealth.healthy) {
      return res.status(503).json({
        status: "degraded",
        reason: "database_unreachable",
        error: dbHealth.error,
      });
    }

    res.set("Cache-Control", "no-store").json({
      status: "ready",
      service: "Meetly",
      dbLatencyMs: dbHealth.latencyMs,
    });
  });

  // ICE Servers Configuration Endpoint (Max 30 reqs/min per IP)
  const iceServersLimiter = createIpRateLimiter({
    windowMs: 60_000,
    max: 30,
    message: "Too many ICE configuration requests.",
  });
  app.get("/api/ice-servers", iceServersLimiter, (req, res) => {
    const sessionToken =
      (req.headers["x-meetly-session"] as string) ||
      (req.query.token as string);
    const session = getSession(sessionToken);
    res.set("Cache-Control", "no-store").json({
      iceServers: generateIceServers(session?.id),
    });
  });

  // Media Upload & Serving Endpoints (Feature 5 - Photo Sending)
  const imageUploadLimiter = createIpRateLimiter({
    windowMs: 60_000,
    max: 20,
    message: "Too many image upload requests. Please wait a moment.",
  });

  // POST /api/chat/upload-image
  app.post(
    "/api/chat/upload-image",
    imageUploadLimiter,
    express.raw({ type: ["image/*", "application/octet-stream"], limit: "6mb" }),
    async (req, res) => {
      try {
        const sessionToken =
          (req.headers["x-meetly-session"] as string) ||
          (req.query.token as string);
        const session = getSession(sessionToken);
        if (!session) {
          return res.status(401).json({ error: "Valid session required to upload photos." });
        }
        if (session.state !== "chat" || !session.roomId) {
          return res.status(400).json({ error: "Photos can only be shared during an active conversation." });
        }

        let buffer: Buffer;
        let mimeType = req.headers["content-type"]?.split(";")[0]?.trim();
        let isFlagged = false;
        let flagReason: string | undefined;

        if (Buffer.isBuffer(req.body) && req.body.length > 0) {
          buffer = req.body;
        } else if (req.body && typeof req.body === "object") {
          // Fallback if client posted JSON with base64
          if (typeof req.body.imageBase64 === "string") {
            buffer = Buffer.from(req.body.imageBase64, "base64");
            if (typeof req.body.mimeType === "string") {
              mimeType = req.body.mimeType;
            }
            isFlagged = Boolean(req.body.isFlagged);
            flagReason = typeof req.body.flagReason === "string" ? req.body.flagReason : undefined;
          } else {
            return res.status(400).json({ error: "No image payload received." });
          }
        } else {
          return res.status(400).json({ error: "No image payload received." });
        }

        const mediaItem = await saveUploadedImage(session, buffer, mimeType, {
          isFlagged,
          flagReason,
        });

        return res.status(201).json({
          success: true,
          mediaId: mediaItem.id,
          url: `/api/chat/media/${mediaItem.id}?token=${encodeURIComponent(session.token)}`,
          mimeType: mediaItem.mimeType,
          width: mediaItem.width,
          height: mediaItem.height,
          fileSizeBytes: mediaItem.fileSizeBytes,
          isFlagged: mediaItem.isFlagged,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Image upload failed.";
        const status = message.includes("rate limit") ? 429 : 400;
        return res.status(status).json({ error: message });
      }
    }
  );

  // GET /api/chat/media/:mediaId
  app.get("/api/chat/media/:mediaId", async (req, res) => {
    try {
      const sessionToken =
        (req.headers["x-meetly-session"] as string) ||
        (req.query.token as string);
      const session = getSession(sessionToken);

      // Check moderator authorization if header present
      const configuredKey = process.env.MODERATOR_KEY || process.env.ADMIN_KEY;
      const authHeader = req.headers.authorization;
      const modToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : (req.headers["x-moderator-key"] as string);
      let isModerator = false;
      if (configuredKey && modToken) {
        const tokenBuf = Buffer.from(modToken, "utf-8");
        const confBuf = Buffer.from(configuredKey, "utf-8");
        if (tokenBuf.length === confBuf.length && timingSafeEqual(tokenBuf, confBuf)) {
          isModerator = true;
        }
      }

      const media = await getAuthorizedMedia(req.params.mediaId, session?.id, isModerator);
      if (!media) {
        return res.status(session || isModerator ? 404 : 401).json({
          error: "Media not found or unauthorized.",
        });
      }

      if (!fs.existsSync(media.filePath)) {
        return res.status(404).json({ error: "Media file expired or unavailable." });
      }

      res.setHeader("Content-Type", media.mimeType);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
      res.setHeader("Content-Disposition", "inline; filename=\"meetly-image\"");
      res.setHeader("Cache-Control", "private, max-age=3600");

      const stream = fs.createReadStream(media.filePath);
      stream.on("error", () => {
        if (!res.headersSent) res.status(500).end();
      });
      stream.pipe(res);
    } catch (error) {
      console.error("[Media Serving] Error:", error);
      return res.status(500).json({ error: "Failed to serve media." });
    }
  });

  // Moderation Rate Limiter (Max 30 reqs/min per IP to prevent brute-forcing keys)
  const moderationLimiter = createIpRateLimiter({
    windowMs: 60_000,
    max: 30,
    message: "Too many moderation requests. Rate limit active.",
  });

  // Moderation Authentication Middleware (Timing-safe token check)
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
      : (req.headers["x-moderator-key"] as string);

    if (!token || typeof token !== "string") {
      return res
        .status(401)
        .json({ error: "Missing moderation authorization token" });
    }

    const tokenBuf = Buffer.from(token, "utf-8");
    const configuredBuf = Buffer.from(configuredKey, "utf-8");

    if (
      tokenBuf.length === configuredBuf.length &&
      timingSafeEqual(tokenBuf, configuredBuf)
    ) {
      return next();
    }
    return res.status(403).json({ error: "Unauthorized moderation access" });
  };

  // Moderation API Endpoints
  app.get("/api/moderation/reports", moderationLimiter, requireModerationAuth, async (req, res) => {
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
      const grievanceStats = await getGrievanceStats();
      res.json({
        stats,
        grievances: grievanceStats,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch moderation stats" });
    }
  });

  // Moderation Grievance Triage Endpoints (Rule 3(2) IT Rules, 2021)
  app.get("/api/moderation/grievances", moderationLimiter, requireModerationAuth, async (req, res) => {
    try {
      const list = await listGrievanceTickets({
        status: req.query.status as string,
        limit: Number(req.query.limit) || 50,
      });
      res.json({ grievances: list });
    } catch {
      res.status(500).json({ error: "Failed to list grievances" });
    }
  });

  app.post("/api/moderation/grievances/:id", moderationLimiter, requireModerationAuth, async (req, res) => {
    try {
      const { status, resolutionNotes } = req.body;
      if (!["received", "under_review", "actioned", "rejected", "closed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      const updated = await updateGrievanceTicketStatus(req.params.id, status, resolutionNotes);
      res.json({ success: updated });
    } catch {
      res.status(500).json({ error: "Failed to update grievance status" });
    }
  });

  // Moderation Data Subject Requests Triage Endpoints (DPDP Act, 2023)
  app.get("/api/moderation/data-requests", moderationLimiter, requireModerationAuth, async (req, res) => {
    try {
      const list = await listDataSubjectRequests({
        status: req.query.status as string,
        limit: Number(req.query.limit) || 50,
      });
      res.json({ dataRequests: list });
    } catch {
      res.status(500).json({ error: "Failed to list data requests" });
    }
  });

  app.post("/api/moderation/data-requests/:id", moderationLimiter, requireModerationAuth, async (req, res) => {
    try {
      const { status, responseNotes } = req.body;
      if (!["received", "under_review", "completed", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      const updated = await updateDataSubjectRequestStatus(req.params.id, status, responseNotes);
      res.json({ success: updated });
    } catch {
      res.status(500).json({ error: "Failed to update data request status" });
    }
  });

  // Moderation Legal Launch Readiness Verification Endpoint
  app.get("/api/moderation/legal-readiness", moderationLimiter, requireModerationAuth, (_req, res) => {
    res.json(checkLegalLaunchReadiness());
  });

  // Moderation Media Inspection Endpoint (Secure access to reported/flagged media)
  app.get("/api/moderation/media/:mediaId", moderationLimiter, requireModerationAuth, async (req, res) => {
    try {
      const media = await getAuthorizedMedia(req.params.mediaId, undefined, true);
      if (!media || !fs.existsSync(media.filePath)) {
        return res.status(404).json({ error: "Media not found." });
      }

      res.setHeader("Content-Type", media.mimeType);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
      res.setHeader("Cache-Control", "no-store");

      fs.createReadStream(media.filePath).pipe(res);
    } catch {
      return res.status(500).json({ error: "Failed to serve moderation media." });
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
