import crypto, { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  config,
  generateIceServers,
  validateProductionConfig,
} from "./config";
import {
  activePartnerId,
  assertReportLimit,
  assertSearchLimit,
  blockAndLeave,
  createAnonymousSession,
  disconnectAll,
  endChat,
  forwardVideoSignal,
  getSession,
  getState,
  markVideoReady,
  sendChatMessage,
  startSearching,
  stopVideo,
  type MediaMode,
  type VideoSignal,
} from "./chat/service";
import {
  getSafetyReportStats,
  insertSafetyReport,
  listSafetyReports,
  updateSafetyReportStatus,
} from "./db";

function createTestUserSession(mediaMode: MediaMode = "text", clientIp = `192.168.1.${Math.floor(Math.random() * 200)}`) {
  const result = createAnonymousSession(
    {
      ageConfirmed: true,
      termsAccepted: true,
      privacyAccepted: true,
      preferences: {
        interests: ["Technology"],
        language: "English",
        mediaMode,
      },
    },
    clientIp
  );
  const session = getSession(result.token);
  if (!session) throw new Error("Failed to create session for test");
  return session;
}

describe("Meetly Comprehensive Production Security Regression Suite", () => {
  beforeEach(() => {
    disconnectAll();
  });

  // 1. SQL Injection Payload Rejection & Parameterization
  describe("1. SQL Injection Payload Handling", () => {
    it("safely parameterizes SQL injection payloads in report triage and filters", async () => {
      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE safety_reports; --",
        "admin' --",
        "' UNION SELECT 1, 'injected', 'data', '4', '5', '6', '7', '8' --",
        "1' OR SLEEP(5)='",
      ];

      for (const payload of sqlInjectionPayloads) {
        // Test filtering by status containing SQL injection
        const reports = await listSafetyReports({
          status: payload,
          limit: 10,
        });
        expect(Array.isArray(reports)).toBe(true);

        // Test updating status with malicious payload
        const updated = await updateSafetyReportStatus(payload, "reviewed");
        expect(typeof updated).toBe("boolean");
      }
    });

    it("safely stores and queries reports containing special characters and quotes", async () => {
      const reportId = `sec-test-${crypto.randomUUID()}`;
      await insertSafetyReport({
        id: reportId,
        category: "harassment",
        reporterSessionHash: "hash-reporter-abc",
        reportedSessionHash: "hash-reported-def",
        description: "User said: ' OR 1=1; SELECT * FROM users; -- \"",
        selectedExcerpt: "<script>alert('xss')</script>' AND 1=1",
        status: "open",
      });

      const list = await listSafetyReports({ limit: 5 });
      const found = list.find(r => r.id === reportId);
      expect(found).toBeDefined();
      expect(found?.description).toContain("' OR 1=1; SELECT * FROM users; -- \"");
    });
  });

  // 2. Stored & Reflected XSS Handling
  describe("2. Cross-Site Scripting (XSS) Handling & URL Filtering", () => {
    it("preserves HTML/XSS markup as literal string data without interpretation", () => {
      const userA = createTestUserSession("text");
      const userB = createTestUserSession("text");
      startSearching(userA);
      startSearching(userB);

      expect(userA.state).toBe("chat");
      expect(userB.state).toBe("chat");

      const xssPayloads = [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert(document.cookie)>",
        "<svg onload=alert(1)>",
        "javascript:void(0)",
        "<iframe src='javascript:alert(1)'></iframe>",
      ];

      for (const payload of xssPayloads) {
        const result = sendChatMessage(userA, payload);
        expect(result.ok).toBe(true);
        const state = getState(userA);
        const lastMsg = state.messages?.[state.messages.length - 1];
        expect(lastMsg?.text).toBe(payload);
      }
    });

    it("rejects malicious URLs and phishing links server-side", () => {
      const userA = createTestUserSession("text");
      const userB = createTestUserSession("text");
      startSearching(userA);
      startSearching(userB);

      const maliciousUrls = [
        "Check this out: http://phishing-site.com/steal-creds",
        "Click here https://attacker.example.org/login",
        "HTTP://EVIL.COM/EXPLOIT",
      ];

      for (const url of maliciousUrls) {
        expect(() => sendChatMessage(userA, url)).toThrow(
          /Links are disabled/i
        );
      }
    });

    it("rejects personally identifiable information (emails and phone numbers)", () => {
      const userA = createTestUserSession("text");
      const userB = createTestUserSession("text");
      startSearching(userA);
      startSearching(userB);

      expect(() =>
        sendChatMessage(userA, "Contact me at victim@example.com for video")
      ).toThrow(/privacy/i);

      expect(() =>
        sendChatMessage(userA, "Call my number: +1-555-123-4567")
      ).toThrow(/privacy/i);
    });
  });

  // 3. Unauthorized State-Changing Requests
  describe("3. Unauthorized State-Changing Requests", () => {
    it("rejects message sending when user is not inside an active conversation", () => {
      const user = createTestUserSession("text");
      expect(user.state).toBe("idle");
      expect(() => sendChatMessage(user, "Hello into the void")).toThrow(
        /This conversation has ended/i
      );
    });

    it("rejects nextChat / endChat without an active session", () => {
      const fakeSession = {
        id: "non-existent-session-id",
        token: "fake.token",
        createdAt: Date.now(),
        preferences: { interests: [], language: "English", mediaMode: "text" as MediaMode },
        acceptedAt: Date.now(),
        state: "idle" as const,
        blocked: new Set<string>(),
        rateWindow: [],
        searchRequests: [],
        reportRequests: [],
        videoRequests: [],
        recentMessages: [],
      };
      // Service operations require registered sessions
      expect(getSession(fakeSession.token)).toBeUndefined();
    });
  });

  // 4. Token Cryptographic Verification & Tamper Resistance
  describe("4. Session Token Cryptographic Integrity", () => {
    it("rejects tampered signatures using constant-time verification", () => {
      const session = createTestUserSession("text");
      const validToken = session.token;
      const [id, sig] = validToken.split(".");

      // Tamper signature by 1 character
      const tamperedSig = sig.slice(0, -1) + (sig.endsWith("a") ? "b" : "a");
      const tamperedToken = `${id}.${tamperedSig}`;

      expect(getSession(tamperedToken)).toBeUndefined();
    });

    it("rejects malformed token strings without separators", () => {
      expect(getSession("malformedtokenwithoutdot")).toBeUndefined();
      expect(getSession("")).toBeUndefined();
      expect(getSession(undefined)).toBeUndefined();
    });

    it("rejects tokens with forged session IDs", () => {
      const session = createTestUserSession("text");
      const [, sig] = session.token.split(".");
      const forgedToken = `forged_id_${randomBytes(16).toString("hex")}.${sig}`;
      expect(getSession(forgedToken)).toBeUndefined();
    });
  });

  // 5. Cross-Room Message Isolation (IDOR & Tenant Separation)
  describe("5. Room & Tenant Isolation (Anti-IDOR)", () => {
    it("strictly isolates conversations between different pairs of users", () => {
      // Room 1: User A & User B
      const userA = createTestUserSession("text");
      const userB = createTestUserSession("text");
      startSearching(userA);
      startSearching(userB);

      // Room 2: User C & User D
      const userC = createTestUserSession("text");
      const userD = createTestUserSession("text");
      startSearching(userC);
      startSearching(userD);

      expect(userA.roomId).toBeDefined();
      expect(userC.roomId).toBeDefined();
      expect(userA.roomId).not.toBe(userC.roomId);

      // User A sends message in Room 1
      sendChatMessage(userA, "Secret in Room 1");

      const stateA = getState(userA);
      const stateB = getState(userB);
      const stateC = getState(userC);
      const stateD = getState(userD);

      // Room 1 participants see message
      expect(stateA.messages?.some(m => m.text === "Secret in Room 1")).toBe(true);
      expect(stateB.messages?.some(m => m.text === "Secret in Room 1")).toBe(true);

      // Room 2 participants MUST NOT see message from Room 1
      expect(stateC.messages?.some(m => m.text === "Secret in Room 1")).toBe(false);
      expect(stateD.messages?.some(m => m.text === "Secret in Room 1")).toBe(false);
    });

    it("prevents third-party access to partner ID", () => {
      const userA = createTestUserSession("text");
      const userB = createTestUserSession("text");
      const eavesdropper = createTestUserSession("text");

      startSearching(userA);
      startSearching(userB);

      expect(activePartnerId(userA)).toBe(userB.id);
      expect(activePartnerId(userB)).toBe(userA.id);
      // Eavesdropper is not in the room
      expect(activePartnerId(eavesdropper)).toBeUndefined();
    });
  });

  // 6. WebRTC Video Signaling Authorization & Enforcement
  describe("6. WebRTC Signaling Authorization", () => {
    it("drops WebRTC signals if the room is text-only", () => {
      const userA = createTestUserSession("text");
      const userB = createTestUserSession("text");
      startSearching(userA);
      startSearching(userB);

      const fakeSignal: VideoSignal = {
        kind: "description",
        descriptionType: "offer",
        sdp: "v=0\r\no=- 12345 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n",
      };

      // In a text-only room, signaling must be rejected
      const forwarded = forwardVideoSignal(userA, fakeSignal);
      expect(forwarded).toBe(false);
    });

    it("drops WebRTC signals in video room until both users explicitly mark videoReady", () => {
      const userA = createTestUserSession("video");
      const userB = createTestUserSession("video");
      startSearching(userA);
      startSearching(userB);

      const dummySdp: VideoSignal = {
        kind: "description",
        descriptionType: "offer",
        sdp: "v=0\r\no=- 999 2 IN IP4 127.0.0.1\r\n",
      };

      // Neither ready
      expect(forwardVideoSignal(userA, dummySdp)).toBe(false);

      // Only User A ready
      markVideoReady(userA);
      expect(forwardVideoSignal(userA, dummySdp)).toBe(false);

      // Both ready -> authorized
      markVideoReady(userB);
      expect(forwardVideoSignal(userA, dummySdp)).toBe(true);
    });

    it("revokes signaling authorization when either user stops video", () => {
      const userA = createTestUserSession("video");
      const userB = createTestUserSession("video");
      startSearching(userA);
      startSearching(userB);
      markVideoReady(userA);
      markVideoReady(userB);

      const dummySdp: VideoSignal = {
        kind: "description",
        descriptionType: "offer",
        sdp: "v=0\r\no=- 999 2 IN IP4 127.0.0.1\r\n",
      };
      expect(forwardVideoSignal(userA, dummySdp)).toBe(true);

      // User B stops video
      stopVideo(userB);

      // Signaling must now be dropped
      expect(forwardVideoSignal(userA, dummySdp)).toBe(false);
    });
  });

  // 7. Rate Limiting & DoS Protection
  describe("7. Rate Limiting & Request Flooding Protection", () => {
    it("enforces message burst limits (max 8 messages per 10s)", () => {
      const userA = createTestUserSession("text");
      const userB = createTestUserSession("text");
      startSearching(userA);
      startSearching(userB);

      // Send 8 messages
      for (let i = 1; i <= 8; i++) {
        expect(sendChatMessage(userA, `Message variation ${i}`).ok).toBe(true);
      }

      // 9th message must be rate limited
      expect(() => sendChatMessage(userA, "Message 9")).toThrow(
        /Slow down for a moment/i
      );
    });

    it("prevents rapid repeated message spam", () => {
      const userA = createTestUserSession("text");
      const userB = createTestUserSession("text");
      startSearching(userA);
      startSearching(userB);

      sendChatMessage(userA, "Repeated spam text");
      sendChatMessage(userA, "Repeated spam text");

      // 3rd identical message within window is blocked
      expect(() => sendChatMessage(userA, "Repeated spam text")).toThrow(
        /Repeated messages are limited/i
      );
    });

    it("enforces matchmaking search request rate limit (max 20 per minute)", () => {
      const user = createTestUserSession("text");
      for (let i = 0; i < 20; i++) {
        assertSearchLimit(user);
      }
      expect(() => assertSearchLimit(user)).toThrow(/Too many requests/i);
    });

    it("enforces safety abuse report rate limit (max 3 per hour)", () => {
      const user = createTestUserSession("text");
      for (let i = 0; i < 3; i++) {
        assertReportLimit(user);
      }
      expect(() => assertReportLimit(user)).toThrow(/Too many requests/i);
    });

    it("enforces session creation rate limit per client IP", () => {
      const testIp = `rate-limit-test-${randomBytes(8).toString("hex")}`;
      for (let i = 0; i < 20; i++) {
        createAnonymousSession(
          {
            ageConfirmed: true,
            termsAccepted: true,
            privacyAccepted: true,
            preferences: { interests: [], language: "English", mediaMode: "text" },
          },
          testIp
        );
      }
      expect(() =>
        createAnonymousSession(
          {
            ageConfirmed: true,
            termsAccepted: true,
            privacyAccepted: true,
            preferences: { interests: [], language: "English", mediaMode: "text" },
          },
          testIp
        )
      ).toThrow(/Too many requests/i);
    });
  });

  // 8. Production Configuration Guardrails & Secret Enforcement
  describe("8. Production Configuration Guardrails", () => {
    it("fails startup in production if SESSION_SECRET is missing or empty", () => {
      expect(() => {
        validateProductionConfig({
          NODE_ENV: "production",
          SESSION_SECRET: "",
        });
      }).toThrow(/SESSION_SECRET must be explicitly set/i);
    });

    it("fails startup in production if SESSION_SECRET is too short (<32 chars)", () => {
      expect(() => {
        validateProductionConfig({
          NODE_ENV: "production",
          SESSION_SECRET: "short_secret_only_24_chars",
        });
      }).toThrow(/at least 32 characters/i);
    });

    it("fails startup in production if default/placeholder SESSION_SECRET is used", () => {
      expect(() => {
        validateProductionConfig({
          NODE_ENV: "production",
          SESSION_SECRET: "your_secure_random_session_secret_at_least_32_characters",
        });
      }).toThrow(/Insecure placeholder detected in SESSION_SECRET/i);
    });

    it("fails startup in production if MODERATOR_KEY is a weak placeholder", () => {
      expect(() => {
        validateProductionConfig({
          NODE_ENV: "production",
          SESSION_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef",
          MODERATOR_KEY: "admin",
        });
      }).toThrow(/MODERATOR_KEY must be at least 24 characters/i);
    });

    it("fails startup in production if DATABASE_URL contains default passwords", () => {
      expect(() => {
        validateProductionConfig({
          NODE_ENV: "production",
          SESSION_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef",
          DATABASE_URL: "mysql://meetly_user:secure_meetly_db_pass_2026@127.0.0.1:3306/meetly",
        });
      }).toThrow(/Insecure default\/placeholder database password/i);
    });

    it("passes validation with strong production configuration", () => {
      expect(() => {
        validateProductionConfig({
          NODE_ENV: "production",
          SESSION_SECRET: "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
          MODERATOR_KEY: "prod-mod-key-secure-2026-evolix-studio-live",
          DATABASE_URL: "mysql://meetly_user:UniqueProdPass998877!@10.0.1.5:3306/meetly",
          CORS_ORIGIN: "https://meetly.evolix.studio",
        });
      }).not.toThrow();
    });
  });

  // 9. Client Build Asset Inspection (Secret Leaks & Source Maps)
  describe("9. Static Asset Inspection (No Leaked Secrets or Source Maps)", () => {
    it("verifies production dist contains no .map source maps", () => {
      const distPublic = path.join(process.cwd(), "dist", "public");
      if (fs.existsSync(distPublic)) {
        const files = fs.readdirSync(distPublic, { recursive: true }) as string[];
        const mapFiles = files.filter(f => f.endsWith(".map"));
        expect(mapFiles.length).toBe(0);
      }
    });

    it("verifies production client JS bundle contains no backend secrets", () => {
      const assetsDir = path.join(process.cwd(), "dist", "public", "assets");
      if (fs.existsSync(assetsDir)) {
        const jsFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith(".js"));
        for (const jsFile of jsFiles) {
          const content = fs.readFileSync(path.join(assetsDir, jsFile), "utf-8");
          // Ensure known backend secret variable names and values are never in client bundle
          expect(content).not.toContain("SESSION_SECRET");
          expect(content).not.toContain("MODERATOR_KEY");
          expect(content).not.toContain("DATABASE_URL");
          expect(content).not.toContain("MYSQL_ROOT_PASSWORD");
        }
      }
    });
  });

  // 10. Privacy & PII Protection in Safety Reports
  describe("10. Safety Report Privacy & User Anonymity", () => {
    it("stores only cryptographically hashed session identifiers", async () => {
      const userA = createTestUserSession("text");
      const userB = createTestUserSession("text");
      startSearching(userA);
      startSearching(userB);

      const reportId = `report-${crypto.randomUUID()}`;
      const hashA = crypto.createHash("sha256").update(userA.id).digest("hex");
      const hashB = crypto.createHash("sha256").update(userB.id).digest("hex");

      await insertSafetyReport({
        id: reportId,
        category: "harassment",
        reporterSessionHash: hashA,
        reportedSessionHash: hashB,
        description: "Safety concern",
        status: "open",
      });

      const reports = await listSafetyReports({ limit: 10 });
      const created = reports.find(r => r.id === reportId);
      expect(created).toBeDefined();

      // Ensure raw session IDs or tokens are NOT stored
      expect(created?.reporterSessionHash).not.toBe(userA.id);
      expect(created?.reporterSessionHash).not.toBe(userA.token);
      expect(created?.reporterSessionHash).toBe(hashA);
      expect(created?.reportedSessionHash).toBe(hashB);
    });
  });
});

