import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /** Surrogate primary key. Auto-incremented numeric value managed by the database. */
  id: int("id").autoincrement().primaryKey(),
  /** User openId identifier. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const safetyReports = mysqlTable("safety_reports", {
  id: varchar("id", { length: 36 }).primaryKey(),
  category: mysqlEnum("category", [
    "csam_child_exploitation",
    "non_consensual_sexual_content",
    "harassment",
    "sexual_content",
    "suspected_minor",
    "threats",
    "spam",
    "hate",
    "privacy_violation",
    "impersonation",
    "other",
  ]).notNull(),
  reporterSessionHash: varchar("reporter_session_hash", {
    length: 64,
  }).notNull(),
  reportedSessionHash: varchar("reported_session_hash", {
    length: 64,
  }).notNull(),
  description: text("description"),
  selectedExcerpt: text("selected_excerpt"),
  status: mysqlEnum("status", ["open", "reviewed", "actioned", "closed"])
    .default("open")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const grievanceTickets = mysqlTable("grievance_tickets", {
  id: varchar("id", { length: 36 }).primaryKey(),
  ticketCode: varchar("ticket_code", { length: 24 }).notNull().unique(),
  complainantName: varchar("complainant_name", { length: 120 }).notNull(),
  complainantEmail: varchar("complainant_email", { length: 320 }).notNull(),
  category: mysqlEnum("category", [
    "content_removal",
    "privacy_complaint",
    "safety_concern",
    "user_conduct",
    "other",
  ]).notNull(),
  subject: varchar("subject", { length: 256 }).notNull(),
  details: text("details").notNull(),
  evidence: text("evidence"),
  status: mysqlEnum("status", [
    "received",
    "under_review",
    "actioned",
    "rejected",
    "closed",
  ])
    .default("received")
    .notNull(),
  resolutionNotes: text("resolution_notes"),
  acknowledgedAt: timestamp("acknowledged_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dataSubjectRequests = mysqlTable("data_subject_requests", {
  id: varchar("id", { length: 36 }).primaryKey(),
  requestCode: varchar("request_code", { length: 24 }).notNull().unique(),
  requestType: mysqlEnum("request_type", [
    "access_summary",
    "erasure",
    "correction",
    "consent_withdrawal",
    "inquiry",
  ]).notNull(),
  contactEmail: varchar("contact_email", { length: 320 }).notNull(),
  sessionIdentifierHash: varchar("session_identifier_hash", { length: 64 }),
  details: text("details").notNull(),
  status: mysqlEnum("status", [
    "received",
    "under_review",
    "completed",
    "rejected",
  ])
    .default("received")
    .notNull(),
  responseNotes: text("response_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const ageVerifications = mysqlTable("age_verifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sessionHash: varchar("session_hash", { length: 64 }).notNull().unique(),
  provider: varchar("provider", { length: 32 }).notNull(),
  providerReference: varchar("provider_reference", { length: 128 }).notNull(),
  status: mysqlEnum("status", [
    "pending",
    "verified",
    "rejected",
    "expired",
  ])
    .default("pending")
    .notNull(),
  over18Confirmed: boolean("over_18_confirmed").default(false).notNull(),
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at"),
  auditProof: text("audit_proof"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const uploadedMedia = mysqlTable("uploaded_media", {
  id: varchar("id", { length: 36 }).primaryKey(),
  roomId: varchar("room_id", { length: 64 }).notNull(),
  uploaderSessionHash: varchar("uploader_session_hash", { length: 64 }).notNull(),
  mimeType: varchar("mime_type", { length: 32 }).notNull(),
  fileSizeBytes: int("file_size_bytes").notNull(),
  width: int("width"),
  height: int("height"),
  storageKey: varchar("storage_key", { length: 128 }).notNull(),
  isFlagged: boolean("is_flagged").default(false).notNull(),
  flagReason: text("flag_reason"),
  status: mysqlEnum("status", ["active", "reported", "removed", "expired"])
    .default("active")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SafetyReport = typeof safetyReports.$inferSelect;
export type InsertSafetyReport = typeof safetyReports.$inferInsert;
export type GrievanceTicket = typeof grievanceTickets.$inferSelect;
export type InsertGrievanceTicket = typeof grievanceTickets.$inferInsert;
export type DataSubjectRequest = typeof dataSubjectRequests.$inferSelect;
export type InsertDataSubjectRequest = typeof dataSubjectRequests.$inferInsert;
export type AgeVerification = typeof ageVerifications.$inferSelect;
export type InsertAgeVerification = typeof ageVerifications.$inferInsert;
export type UploadedMedia = typeof uploadedMedia.$inferSelect;
export type InsertUploadedMedia = typeof uploadedMedia.$inferInsert;
