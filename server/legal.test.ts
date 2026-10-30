import { randomBytes, randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  checkLegalLaunchReadiness,
  getLegalConfig,
} from "./legalConfig";
import {
  getGrievanceStats,
  getGrievanceTicketByCode,
  insertGrievanceTicket,
  listGrievanceTickets,
  updateGrievanceTicketStatus,
  getDataSubjectRequestByCode,
  insertDataSubjectRequest,
  listDataSubjectRequests,
  updateDataSubjectRequestStatus,
  insertSafetyReport,
  listSafetyReports,
  getReportPriority,
} from "./db";
import { createAnonymousSession, getSession } from "./chat/service";

describe("Meetly Legal, Compliance & Safety Framework", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  describe("1. Centralized Legal Configuration & Launch Readiness", () => {
    it("provides sane defaults with explicit pending markers for unappointed officers", () => {
      delete process.env.GRIEVANCE_OFFICER_NAME;
      delete process.env.GRIEVANCE_POSTAL_ADDRESS;
      delete process.env.LEGAL_ENTITY_TYPE;

      const config = getLegalConfig();
      expect(config.siteName).toBe("Meetly");
      expect(config.minimumUserAge).toBe(18);
      expect(config.certInLogRetentionDays).toBe(180);
      expect(config.grievanceOfficerName).toContain("Pending");
      expect(config.grievancePostalAddress).toContain("Pending");
    });

    it("flags unconfigured officer details as launch blockers", () => {
      delete process.env.GRIEVANCE_OFFICER_NAME;
      delete process.env.GRIEVANCE_POSTAL_ADDRESS;
      delete process.env.LEGAL_ENTITY_TYPE;

      const readiness = checkLegalLaunchReadiness();
      expect(readiness.readyForLaunch).toBe(false);
      expect(
        readiness.missingRequiredItems.some((item) =>
          item.includes("GRIEVANCE_OFFICER_NAME")
        )
      ).toBe(true);
      expect(
        readiness.missingRequiredItems.some((item) =>
          item.includes("GRIEVANCE_POSTAL_ADDRESS")
        )
      ).toBe(true);
      expect(
        readiness.missingRequiredItems.some((item) =>
          item.includes("LEGAL_ENTITY_TYPE")
        )
      ).toBe(true);
    });

    it("validates launch readiness when all required legal details are formally configured", () => {
      process.env.GRIEVANCE_OFFICER_NAME = "Advocate Rajesh Kumar";
      process.env.GRIEVANCE_OFFICER_DESIGNATION = "Grievance Officer & Legal Counsel";
      process.env.GRIEVANCE_OFFICER_EMAIL = "grievance@meetly.evolix.studio";
      process.env.GRIEVANCE_POSTAL_ADDRESS = "Evolix Studio Pvt Ltd, Tech Park, Indiranagar, Bengaluru 560038, India";
      process.env.LEGAL_ENTITY_TYPE = "Private Limited Company registered in India";
      process.env.MINIMUM_USER_AGE = "18";
      process.env.ENABLE_ADS = "false";

      const readiness = checkLegalLaunchReadiness();
      expect(readiness.readyForLaunch).toBe(true);
      expect(readiness.missingRequiredItems).toHaveLength(0);
    });

    it("emits advisory when user age is lowered below 18 due to DPDP minor consent constraints", () => {
      process.env.MINIMUM_USER_AGE = "13";
      const readiness = checkLegalLaunchReadiness();
      expect(
        readiness.advisories.some((adv) => adv.includes("DPDP Act 2023"))
      ).toBe(true);
    });

    it("flags missing AdSense client ID when ENABLE_ADS is set to true", () => {
      process.env.GRIEVANCE_OFFICER_NAME = "Advocate Rajesh Kumar";
      process.env.GRIEVANCE_POSTAL_ADDRESS = "Bengaluru, India";
      process.env.LEGAL_ENTITY_TYPE = "Private Limited";
      process.env.ENABLE_ADS = "true";
      delete process.env.ADSENSE_CLIENT_ID;

      const readiness = checkLegalLaunchReadiness();
      expect(readiness.readyForLaunch).toBe(false);
      expect(
        readiness.missingRequiredItems.some((item) =>
          item.includes("ADSENSE_CLIENT_ID")
        )
      ).toBe(true);
    });
  });

  describe("2. Rule 3(2) IT Rules Grievance Redressal Workflow", () => {
    it("creates a grievance ticket with unique ticket code and stores it in memory/db", async () => {
      const ticketId = randomUUID();
      const ticketCode = `GRV-20261029-${randomBytes(4).toString("hex").toUpperCase()}`;

      const ticket = await insertGrievanceTicket({
        id: ticketId,
        ticketCode,
        category: "safety_concern",
        complainantName: "Concerned User",
        complainantEmail: "user@example.com",
        subject: "Harassment and abusive behaviour in video chat",
        details: "Encountered unsolicited harassment violating community guidelines.",
        evidence: "Timestamp 14:20 UTC, partner session hash reference",
        status: "received",
      });

      expect(ticket).toBeDefined();
      expect(ticket.ticketCode).toBe(ticketCode);
      expect(ticket.status).toBe("received");
      expect(ticket.category).toBe("safety_concern");
      expect(ticket.complainantEmail).toBe("user@example.com");

      const fetched = await getGrievanceTicketByCode(ticketCode);
      expect(fetched).toBeDefined();
      expect(fetched?.ticketCode).toBe(ticketCode);
      expect(fetched?.subject).toBe("Harassment and abusive behaviour in video chat");
    });

    it("tracks ticket status lifecycle: received -> under_review -> actioned", async () => {
      const ticketId = randomUUID();
      const ticketCode = `GRV-20261029-${randomBytes(4).toString("hex").toUpperCase()}`;

      await insertGrievanceTicket({
        id: ticketId,
        ticketCode,
        category: "content_removal",
        complainantName: "Test Complainant",
        complainantEmail: "test@example.com",
        subject: "Infringing content removal request",
        details: "Requesting prompt takedown of personal material.",
        status: "received",
      });

      const updated = await updateGrievanceTicketStatus(
        ticketCode,
        "under_review",
        "Assigned to legal counsel. User IP verified for statutory log preserve."
      );
      expect(updated).toBe(true);

      const underReviewTicket = await getGrievanceTicketByCode(ticketCode);
      expect(underReviewTicket?.status).toBe("under_review");
      expect(underReviewTicket?.resolutionNotes).toContain("Assigned to legal counsel");

      const resolved = await updateGrievanceTicketStatus(
        ticketCode,
        "actioned",
        "Investigated and IP flagged for 180-day retention under CERT-In directions."
      );
      expect(resolved).toBe(true);

      const actionedTicket = await getGrievanceTicketByCode(ticketCode);
      expect(actionedTicket?.status).toBe("actioned");
      expect(actionedTicket?.resolvedAt).toBeInstanceOf(Date);
    });

    it("lists grievance tickets and reports statistics", async () => {
      const list = await listGrievanceTickets({ limit: 10 });
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);

      const stats = await getGrievanceStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(typeof stats.received).toBe("number");
      expect(typeof stats.underReview).toBe("number");
    });
  });

  describe("3. DPDP Act 2023 Data Subject Request Handling", () => {
    it("creates data subject request with unique request code", async () => {
      const requestId = randomUUID();
      const requestCode = `DSR-20261029-${randomBytes(4).toString("hex").toUpperCase()}`;

      const request = await insertDataSubjectRequest({
        id: requestId,
        requestCode,
        requestType: "erasure",
        contactEmail: "data_subject@example.com",
        sessionIdentifierHash: "sha256-dummy-hash",
        details: "Please delete any cached session state or IP associations.",
        status: "received",
      });

      expect(request).toBeDefined();
      expect(request.requestCode).toBe(requestCode);
      expect(request.status).toBe("received");
      expect(request.requestType).toBe("erasure");

      const fetched = await getDataSubjectRequestByCode(requestCode);
      expect(fetched).toBeDefined();
      expect(fetched?.requestCode).toBe(requestCode);
      expect(fetched?.contactEmail).toBe("data_subject@example.com");
    });

    it("updates data subject request lifecycle to completed with privacy disclosures", async () => {
      const requestId = randomUUID();
      const requestCode = `DSR-20261029-${randomBytes(4).toString("hex").toUpperCase()}`;

      await insertDataSubjectRequest({
        id: requestId,
        requestCode,
        requestType: "access_summary",
        contactEmail: "access_test@example.com",
        details: "Inquiry on what logs are held regarding my session.",
        status: "received",
      });

      const updated = await updateDataSubjectRequestStatus(
        requestCode,
        "completed",
        "Disclosed: Meetly does not record chat transcripts. Operational network logs retained 180 days under CERT-In mandate."
      );
      expect(updated).toBe(true);

      const completed = await getDataSubjectRequestByCode(requestCode);
      expect(completed?.status).toBe("completed");
      expect(completed?.resolvedAt).toBeInstanceOf(Date);
      expect(completed?.responseNotes).toContain("Operational network logs");
    });

    it("lists data subject requests for administrative audit", async () => {
      const list = await listDataSubjectRequests({ limit: 10 });
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
    });
  });

  describe("4. Statutory Priority and Safety Reporting Alignment", () => {
    it("classifies csam_child_exploitation and non_consensual_sexual_content as critical priority", () => {
      expect(getReportPriority("csam_child_exploitation")).toBe("critical");
      expect(getReportPriority("non_consensual_sexual_content")).toBe("critical");
      expect(getReportPriority("illegal_content")).toBe("high");
      expect(getReportPriority("harassment")).toBe("medium");
      expect(getReportPriority("spam")).toBe("low");
    });

    it("automatically sorts critical priority safety reports to the top of operator triage", async () => {
      const lowReportId = randomUUID();
      await insertSafetyReport({
        id: lowReportId,
        reporterSessionHash: "hash-reporter-low",
        reportedSessionHash: "hash-reported-low",
        category: "spam",
        description: "Repetitive promotional messages.",
      });

      const criticalReportId = randomUUID();
      await insertSafetyReport({
        id: criticalReportId,
        reporterSessionHash: "hash-reporter-crit",
        reportedSessionHash: "hash-reported-crit",
        category: "csam_child_exploitation",
        description: "Emergency CSAM report for immediate action.",
      });

      const list = await listSafetyReports({ limit: 10 });
      const critReport = list.find((r) => r.id === criticalReportId);
      const lowReport = list.find((r) => r.id === lowReportId);

      expect(critReport).toBeDefined();
      expect(critReport?.priority).toBe("critical");
      expect(lowReport?.priority).toBe("low");

      // Critical priority report must appear before low priority report in list
      const critIndex = list.findIndex((r) => r.id === criticalReportId);
      const lowIndex = list.findIndex((r) => r.id === lowReportId);
      expect(critIndex).toBeLessThan(lowIndex);
    });
  });

  describe("5. Age Verification & Terms Consent Guardrails", () => {
    it("refuses anonymous session creation if age confirmation is false", () => {
      expect(() => {
        createAnonymousSession(
          {
            ageConfirmed: false,
            termsAccepted: true,
            privacyAccepted: true,
            preferences: { interests: [], language: "English", mediaMode: "text" },
          },
          "127.0.0.1"
        );
      }).toThrow(/18|terms|privacy/i);
    });

    it("refuses anonymous session creation if terms acceptance is false", () => {
      expect(() => {
        createAnonymousSession(
          {
            ageConfirmed: true,
            termsAccepted: false,
            privacyAccepted: true,
            preferences: { interests: [], language: "English", mediaMode: "text" },
          },
          "127.0.0.1"
        );
      }).toThrow(/18|terms|privacy/i);
    });

    it("refuses anonymous session creation if privacy policy acceptance is false", () => {
      expect(() => {
        createAnonymousSession(
          {
            ageConfirmed: true,
            termsAccepted: true,
            privacyAccepted: false,
            preferences: { interests: [], language: "English", mediaMode: "text" },
          },
          "127.0.0.1"
        );
      }).toThrow(/18|terms|privacy/i);
    });

    it("successfully creates anonymous session and validates state when all legal consents are affirmatively provided", () => {
      const sessionResult = createAnonymousSession(
        {
          ageConfirmed: true,
          termsAccepted: true,
          privacyAccepted: true,
          preferences: { interests: ["Technology"], language: "English", mediaMode: "text" },
        },
        "127.0.0.1"
      );

      expect(sessionResult).toBeDefined();
      expect(sessionResult.token).toBeTruthy();
      expect(sessionResult.expiresAt).toBeGreaterThan(Date.now());

      const session = getSession(sessionResult.token);
      expect(session).toBeDefined();
      expect(session?.preferences.mediaMode).toBe("text");
      expect(session?.preferences.language).toBe("English");
      expect(session?.preferences.interests).toContain("Technology");
    });
  });
});
