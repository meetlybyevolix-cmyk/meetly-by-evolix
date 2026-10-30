import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  assertAgeAssuranceEligible,
  checkAgeAssurance,
  initiateAgeAssurance,
  verifyAgeAssurance,
} from "./ageAssurance";
import { config } from "./config";

describe("Meetly 18+ Age Assurance Subsystem (DPDP Act, 2023)", () => {
  const originalEnv = { ...process.env };
  const originalRequireAge = config.requireAgeAssurance;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    config.requireAgeAssurance = originalRequireAge;
  });

  describe("1. Initial Status & Challenge Generation", () => {
    it("reports 'none' status for a new, unverified anonymous session", async () => {
      const sessionId = "unverified-session-" + Math.random().toString(36).substring(7);
      const status = await checkAgeAssurance(sessionId);

      expect(status.status).toBe("none");
      expect(status.over18Confirmed).toBe(false);
      expect(status.message).toContain("required");
    });

    it("initiates verification challenge with unique challenge ID and nonce", async () => {
      const sessionId = "challenge-session-" + Math.random().toString(36).substring(7);
      const challenge = await initiateAgeAssurance(sessionId, "mock");

      expect(challenge).toBeDefined();
      expect(challenge.challengeId).toBeTruthy();
      expect(challenge.sessionHash).toBeTruthy();
      expect(challenge.provider).toBe("mock");
      expect(challenge.verificationNonce).toBeTruthy();
      expect(challenge.status).toBe("pending");

      const currentStatus = await checkAgeAssurance(sessionId);
      expect(currentStatus.status).toBe("pending");
      expect(currentStatus.over18Confirmed).toBe(false);
    });
  });

  describe("2. Age Verification Confirmation & Cryptographic Proof", () => {
    it("successfully verifies session when adult status is affirmatively confirmed", async () => {
      const sessionId = "verify-session-" + Math.random().toString(36).substring(7);
      await initiateAgeAssurance(sessionId, "mock");

      const result = await verifyAgeAssurance(sessionId, {
        provider: "mock",
        over18Confirmed: true,
      });

      expect(result.status).toBe("verified");
      expect(result.over18Confirmed).toBe(true);
      expect(result.expiresAt).toBeTruthy();
      expect(result.message).toContain("unlocked");

      const statusAfter = await checkAgeAssurance(sessionId);
      expect(statusAfter.status).toBe("verified");
      expect(statusAfter.over18Confirmed).toBe(true);
    });

    it("records explicit 'rejected' status when under-18 status is reported", async () => {
      const sessionId = "reject-session-" + Math.random().toString(36).substring(7);
      await initiateAgeAssurance(sessionId, "mock");

      const result = await verifyAgeAssurance(sessionId, {
        provider: "mock",
        over18Confirmed: false,
      });

      expect(result.status).toBe("rejected");
      expect(result.over18Confirmed).toBe(false);
      expect(result.message).toContain("restricted to adults");

      const statusAfter = await checkAgeAssurance(sessionId);
      expect(statusAfter.status).toBe("rejected");
      expect(statusAfter.over18Confirmed).toBe(false);
    });
  });

  describe("3. Matchmaking Queue Access Guardrails", () => {
    it("allows queue entry when age assurance is not enforced in config (permissive mode)", async () => {
      config.requireAgeAssurance = false;
      const sessionId = "permissive-session-" + Math.random().toString(36).substring(7);

      await expect(assertAgeAssuranceEligible(sessionId)).resolves.not.toThrow();
    });

    it("rejects matchmaking queue entry when age assurance is enforced and session is unverified", async () => {
      config.requireAgeAssurance = true;
      const sessionId = "blocked-unverified-session-" + Math.random().toString(36).substring(7);

      await expect(assertAgeAssuranceEligible(sessionId)).rejects.toThrow(
        /Age Assurance Verification required/i
      );
    });

    it("permits matchmaking queue entry when age assurance is enforced and session is verified", async () => {
      config.requireAgeAssurance = true;
      const sessionId = "verified-eligible-session-" + Math.random().toString(36).substring(7);

      await initiateAgeAssurance(sessionId, "mock");
      await verifyAgeAssurance(sessionId, {
        provider: "mock",
        over18Confirmed: true,
      });

      await expect(assertAgeAssuranceEligible(sessionId)).resolves.not.toThrow();
    });
  });
});

