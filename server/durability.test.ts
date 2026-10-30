import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  checkDatabaseHealth,
  DatabaseDurabilityError,
  insertAgeVerification,
  insertDataSubjectRequest,
  insertGrievanceTicket,
  insertSafetyReport,
  isDurableStorageRequired,
} from "./db";
import { config } from "./config";

describe("Meetly Production Database Durability & Resilience Suite", () => {
  const originalEnv = { ...process.env };
  const originalNodeEnv = config.nodeEnv;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    config.nodeEnv = originalNodeEnv;
  });

  describe("1. Durability Requirements Evaluation", () => {
    it("reports durable storage NOT required in development / test environments by default", () => {
      config.nodeEnv = "test";
      delete process.env.ALLOW_EPHEMERAL_COMPLIANCE_FALLBACK;
      expect(isDurableStorageRequired()).toBe(false);
    });

    it("strictly requires durable storage when running in production mode", () => {
      config.nodeEnv = "production";
      delete process.env.ALLOW_EPHEMERAL_COMPLIANCE_FALLBACK;
      expect(isDurableStorageRequired()).toBe(true);
    });

    it("permits ephemeral fallback only when explicitly authorized by environment variable", () => {
      config.nodeEnv = "production";
      process.env.ALLOW_EPHEMERAL_COMPLIANCE_FALLBACK = "true";
      expect(isDurableStorageRequired()).toBe(false);
    });
  });

  describe("2. No Silent In-Memory Fallback in Production Mode", () => {
    it("throws DatabaseDurabilityError on safety report submission when MySQL is disconnected in production", async () => {
      config.nodeEnv = "production";
      delete process.env.ALLOW_EPHEMERAL_COMPLIANCE_FALLBACK;

      await expect(
        insertSafetyReport({
          id: "test-durability-report-01",
          reporterSessionHash: "hash-01",
          reportedSessionHash: "hash-02",
          category: "harassment",
          description: "Testing durability guard",
        })
      ).rejects.toThrow(DatabaseDurabilityError);
    });

    it("throws DatabaseDurabilityError on grievance ticket submission when MySQL is disconnected in production", async () => {
      config.nodeEnv = "production";
      delete process.env.ALLOW_EPHEMERAL_COMPLIANCE_FALLBACK;

      await expect(
        insertGrievanceTicket({
          id: "test-durability-grievance-01",
          ticketCode: "GRV-20261029-DUR1",
          complainantName: "Audit Test",
          complainantEmail: "audit@example.com",
          category: "safety_concern",
          subject: "Durability Enforcement Test",
          details: "Must fail with 503 instead of issuing false confirmation",
        })
      ).rejects.toThrow(DatabaseDurabilityError);
    });

    it("throws DatabaseDurabilityError on data subject request when MySQL is disconnected in production", async () => {
      config.nodeEnv = "production";
      delete process.env.ALLOW_EPHEMERAL_COMPLIANCE_FALLBACK;

      await expect(
        insertDataSubjectRequest({
          id: "test-durability-dsr-01",
          requestCode: "DSR-20261029-DUR1",
          requestType: "erasure",
          contactEmail: "audit_privacy@example.com",
          details: "Must fail durably if database is down",
        })
      ).rejects.toThrow(DatabaseDurabilityError);
    });

    it("throws DatabaseDurabilityError on age verification write when MySQL is disconnected in production", async () => {
      config.nodeEnv = "production";
      delete process.env.ALLOW_EPHEMERAL_COMPLIANCE_FALLBACK;

      await expect(
        insertAgeVerification({
          id: "test-durability-age-01",
          sessionHash: "hash-age-durability-01",
          provider: "mock",
          providerReference: "ref-durability",
          status: "pending",
          over18Confirmed: false,
        })
      ).rejects.toThrow(DatabaseDurabilityError);
    });
  });

  describe("3. Database Health Probe Integration (/api/ready)", () => {
    it("reports database unhealthy in production when MySQL is unreachable", async () => {
      config.nodeEnv = "production";
      delete process.env.ALLOW_EPHEMERAL_COMPLIANCE_FALLBACK;

      const health = await checkDatabaseHealth();
      expect(health.healthy).toBe(false);
      expect(health.error).toContain("Database not connected in production");
    });

    it("reports healthy in non-production environments with zero latency fallback", async () => {
      config.nodeEnv = "test";
      const health = await checkDatabaseHealth();
      expect(health.healthy).toBe(true);
      expect(health.latencyMs).toBe(0);
    });
  });

  describe("4. Non-Production Graceful In-Memory Fallback", () => {
    it("allows non-production safety report recording without throwing", async () => {
      config.nodeEnv = "development";
      await expect(
        insertSafetyReport({
          id: "test-dev-report-01",
          reporterSessionHash: "hash-dev-01",
          reportedSessionHash: "hash-dev-02",
          category: "spam",
          description: "Dev in-memory test",
        })
      ).resolves.not.toThrow();
    });

    it("allows non-production grievance ticket recording without throwing", async () => {
      config.nodeEnv = "development";
      const ticket = await insertGrievanceTicket({
        id: "test-dev-grievance-01",
        ticketCode: "GRV-20261029-DEV1",
        complainantName: "Dev User",
        complainantEmail: "dev@example.com",
        category: "other",
        subject: "Development Test Grievance",
        details: "In-memory dev testing",
      });
      expect(ticket).toBeDefined();
      expect(ticket.ticketCode).toBe("GRV-20261029-DEV1");
    });
  });
});

