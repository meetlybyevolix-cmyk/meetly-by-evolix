import { createHash } from "node:crypto";
import { desc, eq, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  AgeVerification,
  DataSubjectRequest,
  GrievanceTicket,
  InsertAgeVerification,
  InsertDataSubjectRequest,
  InsertGrievanceTicket,
  InsertSafetyReport,
  InsertUser,
  User,
  SafetyReport,
  ageVerifications,
  dataSubjectRequests,
  grievanceTickets,
  safetyReports,
  users,
  UploadedMedia,
  InsertUploadedMedia,
  uploadedMedia,
} from "../drizzle/schema";
import { config } from "./config";

let _db: ReturnType<typeof drizzle> | null = null;

export class DatabaseDurabilityError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "DatabaseDurabilityError";
  }
}

/**
 * Determines whether durable database persistence is mandatory.
 * In production mode, durable writes are strictly required unless explicitly bypassed.
 */
export function isDurableStorageRequired(): boolean {
  if (config.nodeEnv === "production") {
    return process.env.ALLOW_EPHEMERAL_COMPLIANCE_FALLBACK !== "true";
  }
  return false;
}

// In-memory fallbacks for development/ephemeral modes without MySQL
const inMemoryReports: SafetyReport[] = [];
const inMemoryGrievances: GrievanceTicket[] = [];
const inMemoryDataRequests: DataSubjectRequest[] = [];
const inMemoryAgeVerifications: AgeVerification[] = [];
const inMemoryUploadedMedia: UploadedMedia[] = [];
const inMemoryUsers: User[] = [];
const MAX_IN_MEMORY_RECORDS = 500;

export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latencyMs?: number;
  error?: string;
}> {
  const start = Date.now();
  const db = await getDb();
  if (!db) {
    if (isDurableStorageRequired()) {
      return { healthy: false, error: "Database not connected in production" };
    }
    return { healthy: true, latencyMs: 0 };
  }
  try {
    await db.execute(sql`SELECT 1`);
    return { healthy: true, latencyMs: Date.now() - start };
  } catch (error) {
    if (!isDurableStorageRequired()) {
      return { healthy: true, latencyMs: 0 };
    }
    const msg = error instanceof Error ? error.message : String(error);
    return { healthy: false, error: msg };
  }
}

export type ReportPriority = "critical" | "high" | "medium" | "low";

export function getReportPriority(category: string): ReportPriority {
  if (
    [
      "csam_child_exploitation",
      "non_consensual_sexual_content",
    ].includes(category)
  ) {
    return "critical";
  }
  if (
    [
      "underage",
      "suspected_minor",
      "threats",
      "hate",
      "illegal_content",
    ].includes(category)
  ) {
    return "high";
  }
  if (
    [
      "sexual",
      "sexual_content",
      "harassment",
      "privacy_violation",
      "impersonation",
    ].includes(category)
  ) {
    return "medium";
  }
  return "low";
}

export type EnrichedSafetyReport = SafetyReport & {
  priority: ReportPriority;
};

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && config.databaseUrl) {
    try {
      _db = drizzle(config.databaseUrl);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export function getInternalUserId(user: { id?: number; openId: string }): string {
  const hash = createHash("sha256").update(user.openId).digest("hex").slice(0, 12).toUpperCase();
  return `USR-${hash}`;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const now = new Date();
  const db = await getDb();

  const values: InsertUser = {
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? "google",
    role: user.role ?? "user",
    createdAt: user.createdAt ?? now,
    updatedAt: now,
    lastSignedIn: user.lastSignedIn ?? now,
  };

  if (db) {
    try {
      const updateSet: Record<string, unknown> = {
        name: values.name,
        email: values.email,
        loginMethod: values.loginMethod,
        updatedAt: now,
        lastSignedIn: values.lastSignedIn,
      };
      if (user.role) updateSet.role = user.role;

      await db.insert(users).values(values).onDuplicateKeyUpdate({
        set: updateSet,
      });
    } catch (error) {
      console.error("[Database] Failed to upsert user in MySQL:", error);
      if (isDurableStorageRequired()) {
        throw new DatabaseDurabilityError(
          "Durable database write failed for user profile.",
          error
        );
      }
    }
  } else if (isDurableStorageRequired()) {
    throw new DatabaseDurabilityError("Database not connected in production");
  }

  // Update in-memory fallback buffer
  const existingIdx = inMemoryUsers.findIndex(u => u.openId === user.openId);
  if (existingIdx >= 0) {
    inMemoryUsers[existingIdx] = {
      ...inMemoryUsers[existingIdx],
      name: values.name ?? inMemoryUsers[existingIdx].name,
      email: values.email !== undefined ? values.email : inMemoryUsers[existingIdx].email,
      loginMethod: values.loginMethod ?? inMemoryUsers[existingIdx].loginMethod,
      role: values.role ?? inMemoryUsers[existingIdx].role,
      lastSignedIn: values.lastSignedIn ?? now,
      updatedAt: now,
    };
  } else {
    const nextId = inMemoryUsers.length + 1;
    inMemoryUsers.push({
      id: nextId,
      openId: values.openId,
      name: values.name ?? null,
      email: values.email ?? null,
      loginMethod: values.loginMethod ?? "google",
      role: values.role ?? "user",
      createdAt: values.createdAt ?? now,
      updatedAt: now,
      lastSignedIn: values.lastSignedIn ?? now,
    });
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (db) {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.openId, openId))
        .limit(1);
      if (result.length > 0) return result[0];
    } catch (err) {
      console.warn("[Database] MySQL query failed, falling back to memory:", err);
    }
  }
  return inMemoryUsers.find(u => u.openId === openId);
}

export async function deleteUserByOpenId(openId: string): Promise<void> {
  const db = await getDb();
  const now = new Date();
  if (db) {
    try {
      await db
        .update(users)
        .set({
          name: "[Deleted User]",
          email: null,
          updatedAt: now,
        })
        .where(eq(users.openId, openId));
    } catch (err) {
      console.warn("[Database] Error deleting user in MySQL:", err);
    }
  }
  const memUser = inMemoryUsers.find(u => u.openId === openId);
  if (memUser) {
    memUser.name = "[Deleted User]";
    memUser.email = null;
    memUser.updatedAt = now;
  }
}

export async function insertSafetyReport(report: InsertSafetyReport): Promise<void> {
  const createdRecord: SafetyReport = {
    id: report.id,
    category: report.category,
    reporterSessionHash: report.reporterSessionHash,
    reportedSessionHash: report.reportedSessionHash,
    description: report.description ?? null,
    selectedExcerpt: report.selectedExcerpt ?? null,
    status: report.status ?? "open",
    createdAt: new Date(),
  };

  const db = await getDb();
  if (db) {
    try {
      await db.insert(safetyReports).values(report);
      inMemoryReports.unshift(createdRecord);
      if (inMemoryReports.length > MAX_IN_MEMORY_RECORDS) {
        inMemoryReports.pop();
      }
      return;
    } catch (error) {
      console.error("[Database] Error writing safety report to MySQL:", error);
      if (isDurableStorageRequired()) {
        throw new DatabaseDurabilityError(
          "Durable database write failed for safety report. Record could not be persisted.",
          error
        );
      }
    }
  } else if (isDurableStorageRequired()) {
    throw new DatabaseDurabilityError(
      "Database connection unavailable. Cannot record safety report durably in production."
    );
  }

  inMemoryReports.unshift(createdRecord);
  if (inMemoryReports.length > MAX_IN_MEMORY_RECORDS) {
    inMemoryReports.pop();
  }
  console.info("[Safety] Report recorded in memory buffer (non-production fallback).");
}

export async function listSafetyReports(options: {
  status?: string;
  priority?: ReportPriority;
  limit?: number;
} = {}): Promise<EnrichedSafetyReport[]> {
  const limit = options.limit ?? 50;
  const db = await getDb();
  let baseReports: SafetyReport[] = [];

  if (db) {
    try {
      if (options.status) {
        baseReports = await db
          .select()
          .from(safetyReports)
          .where(eq(safetyReports.status, options.status as any))
          .orderBy(desc(safetyReports.createdAt))
          .limit(limit * 2);
      } else {
        baseReports = await db
          .select()
          .from(safetyReports)
          .orderBy(desc(safetyReports.createdAt))
          .limit(limit * 2);
      }
    } catch (error) {
      console.warn("[Database] Failed to list reports from DB, falling back to memory:", error);
      baseReports = inMemoryReports;
    }
  } else {
    baseReports = inMemoryReports;
  }

  const enriched: EnrichedSafetyReport[] = baseReports
    .filter(r => !options.status || r.status === options.status)
    .map(r => ({
      ...r,
      priority: getReportPriority(r.category),
    }))
    .filter(r => !options.priority || r.priority === options.priority);

  // Sort priority (critical > high > medium > low), then descending date
  const priorityWeight: Record<ReportPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  enriched.sort((a, b) => {
    const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return enriched.slice(0, limit);
}

export async function updateSafetyReportStatus(
  id: string,
  status: "open" | "reviewed" | "actioned" | "closed"
): Promise<boolean> {
  const memReport = inMemoryReports.find(r => r.id === id);
  if (memReport) {
    memReport.status = status;
  }

  const db = await getDb();
  if (db) {
    try {
      await db
        .update(safetyReports)
        .set({ status })
        .where(eq(safetyReports.id, id));
      return true;
    } catch (error) {
      console.error("[Database] Failed to update report status:", error);
      return Boolean(memReport);
    }
  }

  return Boolean(memReport);
}

export async function getSafetyReportStats() {
  const reports = await listSafetyReports({ limit: 1000 });
  return {
    total: reports.length,
    open: reports.filter(r => r.status === "open").length,
    reviewed: reports.filter(r => r.status === "reviewed").length,
    actioned: reports.filter(r => r.status === "actioned").length,
    closed: reports.filter(r => r.status === "closed").length,
    criticalOpen: reports.filter(r => r.status === "open" && r.priority === "critical").length,
    highPriorityOpen: reports.filter(r => r.status === "open" && (r.priority === "high" || r.priority === "critical")).length,
  };
}

// -------------------------------------------------------------
// Grievance Redressal Mechanisms (IT Rules, 2021 Rule 3(2))
// -------------------------------------------------------------

export async function insertGrievanceTicket(
  ticket: InsertGrievanceTicket
): Promise<GrievanceTicket> {
  const record: GrievanceTicket = {
    id: ticket.id,
    ticketCode: ticket.ticketCode,
    complainantName: ticket.complainantName,
    complainantEmail: ticket.complainantEmail,
    category: ticket.category,
    subject: ticket.subject,
    details: ticket.details,
    evidence: ticket.evidence ?? null,
    status: ticket.status ?? "received",
    resolutionNotes: ticket.resolutionNotes ?? null,
    acknowledgedAt: new Date(),
    resolvedAt: null,
    createdAt: new Date(),
  };

  const db = await getDb();
  if (db) {
    try {
      await db.insert(grievanceTickets).values(ticket);
      inMemoryGrievances.unshift(record);
      if (inMemoryGrievances.length > MAX_IN_MEMORY_RECORDS) {
        inMemoryGrievances.pop();
      }
      return record;
    } catch (error) {
      console.error("[Database] Error writing grievance to MySQL:", error);
      if (isDurableStorageRequired()) {
        throw new DatabaseDurabilityError(
          "Failed to persist grievance ticket in durable database storage.",
          error
        );
      }
    }
  } else if (isDurableStorageRequired()) {
    throw new DatabaseDurabilityError(
      "Database connection unavailable. Cannot persist grievance ticket durably in production."
    );
  }

  inMemoryGrievances.unshift(record);
  if (inMemoryGrievances.length > MAX_IN_MEMORY_RECORDS) {
    inMemoryGrievances.pop();
  }
  return record;
}

export async function listGrievanceTickets(options: {
  status?: string;
  limit?: number;
} = {}): Promise<GrievanceTicket[]> {
  const limit = options.limit ?? 50;
  const db = await getDb();

  if (db) {
    try {
      if (options.status) {
        return await db
          .select()
          .from(grievanceTickets)
          .where(eq(grievanceTickets.status, options.status as any))
          .orderBy(desc(grievanceTickets.createdAt))
          .limit(limit);
      }
      return await db
        .select()
        .from(grievanceTickets)
        .orderBy(desc(grievanceTickets.createdAt))
        .limit(limit);
    } catch (error) {
      console.warn("[Database] Failed to list grievances from DB, falling back to memory:", error);
    }
  }

  return inMemoryGrievances
    .filter(g => !options.status || g.status === options.status)
    .slice(0, limit);
}

export async function getGrievanceTicketByCode(
  ticketCode: string
): Promise<GrievanceTicket | undefined> {
  const db = await getDb();
  if (db) {
    try {
      const results = await db
        .select()
        .from(grievanceTickets)
        .where(eq(grievanceTickets.ticketCode, ticketCode))
        .limit(1);
      if (results.length > 0) return results[0];
    } catch (error) {
      console.warn("[Database] Failed to get grievance by code, checking memory:", error);
    }
  }
  return inMemoryGrievances.find(g => g.ticketCode === ticketCode);
}

export async function updateGrievanceTicketStatus(
  idOrCode: string,
  status: "received" | "under_review" | "actioned" | "rejected" | "closed",
  resolutionNotes?: string
): Promise<boolean> {
  const mem = inMemoryGrievances.find(
    g => g.id === idOrCode || g.ticketCode === idOrCode
  );
  if (mem) {
    mem.status = status;
    if (resolutionNotes) mem.resolutionNotes = resolutionNotes;
    if (["actioned", "rejected", "closed"].includes(status)) {
      mem.resolvedAt = new Date();
    }
  }

  const db = await getDb();
  if (db) {
    try {
      const updateData: Record<string, unknown> = { status };
      if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
      if (["actioned", "rejected", "closed"].includes(status)) {
        updateData.resolvedAt = new Date();
      }
      await db
        .update(grievanceTickets)
        .set(updateData)
        .where(
          or(
            eq(grievanceTickets.id, idOrCode),
            eq(grievanceTickets.ticketCode, idOrCode)
          )
        );
      return true;
    } catch (error) {
      console.error("[Database] Failed to update grievance status:", error);
      return Boolean(mem);
    }
  }

  return Boolean(mem);
}

export async function getGrievanceStats() {
  const list = await listGrievanceTickets({ limit: 1000 });
  return {
    total: list.length,
    received: list.filter(g => g.status === "received").length,
    underReview: list.filter(g => g.status === "under_review").length,
    actioned: list.filter(g => g.status === "actioned").length,
    closed: list.filter(g => g.status === "closed").length,
  };
}

// -------------------------------------------------------------
// Data Subject / Privacy Rights Requests (DPDP Act, 2023)
// -------------------------------------------------------------

export async function insertDataSubjectRequest(
  request: InsertDataSubjectRequest
): Promise<DataSubjectRequest> {
  const record: DataSubjectRequest = {
    id: request.id,
    requestCode: request.requestCode,
    requestType: request.requestType,
    contactEmail: request.contactEmail,
    sessionIdentifierHash: request.sessionIdentifierHash ?? null,
    details: request.details,
    status: request.status ?? "received",
    responseNotes: request.responseNotes ?? null,
    createdAt: new Date(),
    resolvedAt: null,
  };

  const db = await getDb();
  if (db) {
    try {
      await db.insert(dataSubjectRequests).values(request);
      inMemoryDataRequests.unshift(record);
      if (inMemoryDataRequests.length > MAX_IN_MEMORY_RECORDS) {
        inMemoryDataRequests.pop();
      }
      return record;
    } catch (error) {
      console.error("[Database] Error writing data request to MySQL:", error);
      if (isDurableStorageRequired()) {
        throw new DatabaseDurabilityError(
          "Failed to persist data subject request in durable database storage.",
          error
        );
      }
    }
  } else if (isDurableStorageRequired()) {
    throw new DatabaseDurabilityError(
      "Database connection unavailable. Cannot persist data subject request durably in production."
    );
  }

  inMemoryDataRequests.unshift(record);
  if (inMemoryDataRequests.length > MAX_IN_MEMORY_RECORDS) {
    inMemoryDataRequests.pop();
  }
  return record;
}

// -------------------------------------------------------------
// Age Verification Operations (DPDP Act, 2023 18+ Assurance)
// -------------------------------------------------------------

export async function insertAgeVerification(
  verification: InsertAgeVerification
): Promise<AgeVerification> {
  const record: AgeVerification = {
    id: verification.id,
    sessionHash: verification.sessionHash,
    provider: verification.provider,
    providerReference: verification.providerReference,
    status: verification.status ?? "pending",
    over18Confirmed: verification.over18Confirmed ?? false,
    verifiedAt: verification.verifiedAt ?? null,
    expiresAt: verification.expiresAt ?? null,
    auditProof: verification.auditProof ?? null,
    createdAt: new Date(),
  };

  const db = await getDb();
  if (db) {
    try {
      await db.insert(ageVerifications).values(verification);
      inMemoryAgeVerifications.unshift(record);
      if (inMemoryAgeVerifications.length > MAX_IN_MEMORY_RECORDS) {
        inMemoryAgeVerifications.pop();
      }
      return record;
    } catch (error) {
      console.error("[Database] Error writing age verification to MySQL:", error);
      if (isDurableStorageRequired()) {
        throw new DatabaseDurabilityError(
          "Failed to persist age verification in durable database storage.",
          error
        );
      }
    }
  } else if (isDurableStorageRequired()) {
    throw new DatabaseDurabilityError(
      "Database connection unavailable. Cannot persist age verification durably in production."
    );
  }

  inMemoryAgeVerifications.unshift(record);
  if (inMemoryAgeVerifications.length > MAX_IN_MEMORY_RECORDS) {
    inMemoryAgeVerifications.pop();
  }
  return record;
}

export async function getAgeVerificationBySessionHash(
  sessionHash: string
): Promise<AgeVerification | undefined> {
  const db = await getDb();
  if (db) {
    try {
      const results = await db
        .select()
        .from(ageVerifications)
        .where(eq(ageVerifications.sessionHash, sessionHash))
        .limit(1);
      if (results.length > 0) return results[0];
    } catch (error) {
      console.warn("[Database] Failed to get age verification by session hash, checking memory:", error);
    }
  }
  return inMemoryAgeVerifications.find(v => v.sessionHash === sessionHash);
}

export async function updateAgeVerificationStatus(
  sessionHash: string,
  status: "pending" | "verified" | "rejected" | "expired",
  options?: {
    over18Confirmed?: boolean;
    auditProof?: string;
    expiresAt?: Date;
  }
): Promise<boolean> {
  const mem = inMemoryAgeVerifications.find(v => v.sessionHash === sessionHash);
  if (mem) {
    mem.status = status;
    if (options?.over18Confirmed !== undefined) mem.over18Confirmed = options.over18Confirmed;
    if (options?.auditProof) mem.auditProof = options.auditProof;
    if (options?.expiresAt) mem.expiresAt = options.expiresAt;
    if (status === "verified") mem.verifiedAt = new Date();
  }

  const db = await getDb();
  if (db) {
    try {
      const updateData: Record<string, unknown> = { status };
      if (options?.over18Confirmed !== undefined) updateData.over18Confirmed = options.over18Confirmed;
      if (options?.auditProof) updateData.auditProof = options.auditProof;
      if (options?.expiresAt) updateData.expiresAt = options.expiresAt;
      if (status === "verified") updateData.verifiedAt = new Date();

      await db
        .update(ageVerifications)
        .set(updateData)
        .where(eq(ageVerifications.sessionHash, sessionHash));
      return true;
    } catch (error) {
      console.error("[Database] Failed to update age verification status:", error);
      return Boolean(mem);
    }
  }

  return Boolean(mem);
}

export async function listDataSubjectRequests(options: {
  status?: string;
  limit?: number;
} = {}): Promise<DataSubjectRequest[]> {
  const limit = options.limit ?? 50;
  const db = await getDb();

  if (db) {
    try {
      if (options.status) {
        return await db
          .select()
          .from(dataSubjectRequests)
          .where(eq(dataSubjectRequests.status, options.status as any))
          .orderBy(desc(dataSubjectRequests.createdAt))
          .limit(limit);
      }
      return await db
        .select()
        .from(dataSubjectRequests)
        .orderBy(desc(dataSubjectRequests.createdAt))
        .limit(limit);
    } catch (error) {
      console.warn("[Database] Failed to list data requests from DB, falling back to memory:", error);
    }
  }

  return inMemoryDataRequests
    .filter(r => !options.status || r.status === options.status)
    .slice(0, limit);
}

export async function getDataSubjectRequestByCode(
  requestCode: string
): Promise<DataSubjectRequest | undefined> {
  const db = await getDb();
  if (db) {
    try {
      const results = await db
        .select()
        .from(dataSubjectRequests)
        .where(eq(dataSubjectRequests.requestCode, requestCode))
        .limit(1);
      if (results.length > 0) return results[0];
    } catch (error) {
      console.warn("[Database] Failed to get data request by code, checking memory:", error);
    }
  }
  return inMemoryDataRequests.find(r => r.requestCode === requestCode);
}

export async function updateDataSubjectRequestStatus(
  idOrCode: string,
  status: "received" | "under_review" | "completed" | "rejected",
  responseNotes?: string
): Promise<boolean> {
  const mem = inMemoryDataRequests.find(
    r => r.id === idOrCode || r.requestCode === idOrCode
  );
  if (mem) {
    mem.status = status;
    if (responseNotes) mem.responseNotes = responseNotes;
    if (["completed", "rejected"].includes(status)) {
      mem.resolvedAt = new Date();
    }
  }

  const db = await getDb();
  if (db) {
    try {
      const updateData: Record<string, unknown> = { status };
      if (responseNotes) updateData.responseNotes = responseNotes;
      if (["completed", "rejected"].includes(status)) {
        updateData.resolvedAt = new Date();
      }
      await db
        .update(dataSubjectRequests)
        .set(updateData)
        .where(
          or(
            eq(dataSubjectRequests.id, idOrCode),
            eq(dataSubjectRequests.requestCode, idOrCode)
          )
        );
      return true;
    } catch (error) {
      console.error("[Database] Failed to update data request status:", error);
      return Boolean(mem);
    }
  }

  return Boolean(mem);
}

// ==========================================
// Uploaded Media Records & Moderation Audit Trail
// ==========================================
export async function insertUploadedMediaRecord(
  data: InsertUploadedMedia
): Promise<UploadedMedia> {
  const record: UploadedMedia = {
    id: data.id,
    roomId: data.roomId,
    uploaderSessionHash: data.uploaderSessionHash,
    mimeType: data.mimeType,
    fileSizeBytes: data.fileSizeBytes,
    width: data.width ?? null,
    height: data.height ?? null,
    storageKey: data.storageKey,
    isFlagged: data.isFlagged ?? false,
    flagReason: data.flagReason ?? null,
    status: data.status ?? "active",
    createdAt: new Date(),
    expiresAt: data.expiresAt ?? null,
  };

  inMemoryUploadedMedia.unshift(record);
  if (inMemoryUploadedMedia.length > MAX_IN_MEMORY_RECORDS) {
    inMemoryUploadedMedia.pop();
  }

  const db = await getDb();
  if (db) {
    try {
      await db.insert(uploadedMedia).values(data);
    } catch (error) {
      if (isDurableStorageRequired()) {
        throw new DatabaseDurabilityError(
          "Failed to durably persist media upload record",
          error
        );
      }
      console.warn("[Media DB] Stored in memory fallback buffer:", error);
    }
  }

  return record;
}

export async function getUploadedMediaRecord(
  id: string
): Promise<UploadedMedia | null> {
  const mem = inMemoryUploadedMedia.find(m => m.id === id);
  if (mem) return mem;

  const db = await getDb();
  if (db) {
    try {
      const results = await db
        .select()
        .from(uploadedMedia)
        .where(eq(uploadedMedia.id, id))
        .limit(1);
      return results[0] || null;
    } catch (error) {
      console.error("[Media DB] Error querying media record:", error);
      return null;
    }
  }
  return null;
}

export async function updateUploadedMediaStatus(
  id: string,
  status: UploadedMedia["status"]
): Promise<boolean> {
  const mem = inMemoryUploadedMedia.find(m => m.id === id);
  if (mem) {
    mem.status = status;
  }

  const db = await getDb();
  if (db) {
    try {
      await db
        .update(uploadedMedia)
        .set({ status })
        .where(eq(uploadedMedia.id, id));
      return true;
    } catch (error) {
      console.error("[Media DB] Failed to update media status:", error);
      return Boolean(mem);
    }
  }
  return Boolean(mem);
}

export async function listUploadedMedia(options?: {
  status?: UploadedMedia["status"];
  limit?: number;
}): Promise<UploadedMedia[]> {
  const limit = options?.limit ?? 50;
  const db = await getDb();
  if (db) {
    try {
      let query = db.select().from(uploadedMedia);
      if (options?.status) {
        query = query.where(eq(uploadedMedia.status, options.status)) as any;
      }
      return await query.orderBy(desc(uploadedMedia.createdAt)).limit(limit);
    } catch (error) {
      console.error("[Media DB] Error listing media:", error);
    }
  }

  let list = inMemoryUploadedMedia;
  if (options?.status) {
    list = list.filter(m => m.status === options.status);
  }
  return list.slice(0, limit);
}
