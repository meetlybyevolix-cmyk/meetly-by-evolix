import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertSafetyReport,
  InsertUser,
  SafetyReport,
  safetyReports,
  users,
} from "../drizzle/schema";
import { config } from "./config";

let _db: ReturnType<typeof drizzle> | null = null;

// In-memory safety reports fallback for staging/ephemeral modes without MySQL
const inMemoryReports: SafetyReport[] = [];
const MAX_IN_MEMORY_REPORTS = 500;

export type ReportPriority = "high" | "medium" | "low";

export function getReportPriority(category: string): ReportPriority {
  if (["underage", "threats", "hate"].includes(category)) return "high";
  if (["sexual", "harassment", "impersonation"].includes(category)) return "medium";
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("Database is not available");
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (
      process.env.ADMIN_OPEN_ID &&
      user.openId === process.env.ADMIN_OPEN_ID
    ) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
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

  inMemoryReports.unshift(createdRecord);
  if (inMemoryReports.length > MAX_IN_MEMORY_REPORTS) {
    inMemoryReports.pop();
  }

  const db = await getDb();
  if (db) {
    try {
      await db.insert(safetyReports).values(report);
      return;
    } catch (error) {
      console.error("[Database] Error writing safety report to MySQL, preserved in-memory:", error);
    }
  } else {
    console.info("[Safety] Report recorded in memory buffer (MySQL not configured).");
  }
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

  // Sort priority (high > medium > low), then descending date
  const priorityWeight: Record<ReportPriority, number> = {
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
    highPriorityOpen: reports.filter(r => r.status === "open" && r.priority === "high").length,
  };
}
