import {
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
    "harassment",
    "sexual_content",
    "suspected_minor",
    "threats",
    "spam",
    "hate",
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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SafetyReport = typeof safetyReports.$inferSelect;
export type InsertSafetyReport = typeof safetyReports.$inferInsert;
