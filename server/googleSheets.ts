import { JWT } from "google-auth-library";
import { config } from "./config";

export interface SyncUserPayload {
  userId: string;
  customerName: string;
  registrationDate: Date | string;
  lastLogin: Date | string;
  status: "Active" | "Suspended" | "Deleted" | string;
}

export interface SyncResult {
  synced: boolean;
  action: "appended" | "updated" | "queued" | "deleted";
  rowIndex?: number;
  error?: string;
  reason?: string;
}

export interface PendingSyncItem extends SyncUserPayload {
  action: "upsert" | "delete";
  attempts: number;
  lastAttemptAt: number;
  lastError?: string;
}

export const SHEET_COLUMNS = [
  "Internal User ID",
  "Customer Name",
  "Registration Date",
  "Last Login",
  "Registration Status",
] as const;

// In-memory retry queue for failed or offline Google Sheets sync attempts
const pendingSyncQueue: PendingSyncItem[] = [];
const MAX_PENDING_QUEUE = 500;

// In-memory mock store for unit testing & offline dev
let mockSheetStore: string[][] | null = null;

export function setMockSheetsStore(rows: string[][] | null): void {
  mockSheetStore = rows;
}

export function getMockSheetsStore(): string[][] | null {
  return mockSheetStore;
}

export function resetMockSheetsStore(): void {
  mockSheetStore = null;
  pendingSyncQueue.length = 0;
}

export function getPendingSyncQueueLength(): number {
  return pendingSyncQueue.length;
}

/**
 * Sanitizes input to prevent CSV / Spreadsheet formula injection (OWASP guideline).
 * Prepends a single quote if the value starts with dangerous formula triggers (=, +, -, @, %, |).
 * Replaces tab, newline, and carriage return control characters.
 */
export function sanitizeSpreadsheetCell(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  let str = String(value).trim();
  str = str.replace(/[\r\n\t]/g, " ");

  if (/^[=+\-@%|]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Checks whether all required Google Sheets credentials are configured.
 */
export function isGoogleSheetsConfigured(): boolean {
  return Boolean(
    config.googleSheetsSpreadsheetId &&
      config.googleServiceAccountEmail &&
      config.googleServiceAccountPrivateKey
  );
}

/**
 * Creates an authorized JWT Google API client using service account credentials.
 */
function getSheetsAuthClient(): JWT {
  const privateKey = config.googleServiceAccountPrivateKey.replace(/\\n/g, "\n");
  return new JWT({
    email: config.googleServiceAccountEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function formatDateForSheet(dateVal: Date | string): string {
  try {
    const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
    if (isNaN(d.getTime())) return new Date().toISOString().replace("T", " ").slice(0, 19);
    return d.toISOString().replace("T", " ").slice(0, 19);
  } catch {
    return new Date().toISOString().replace("T", " ").slice(0, 19);
  }
}

/**
 * Synchronizes user registration to the owner's private Google Sheet.
 * Idempotent: appends new rows, updates returning users.
 * RAW formatting and formula sanitization are strictly applied.
 */
export async function syncUserRegistration(user: SyncUserPayload): Promise<SyncResult> {
  const cleanUserId = sanitizeSpreadsheetCell(user.userId);
  const cleanName = sanitizeSpreadsheetCell(user.customerName);
  const cleanRegDate = formatDateForSheet(user.registrationDate);
  const cleanLastLogin = formatDateForSheet(user.lastLogin);
  const cleanStatus = sanitizeSpreadsheetCell(user.status || "Active");

  // Mock / Unit Test environment handler
  if (mockSheetStore !== null) {
    return syncUserToMockSheet({
      cleanUserId,
      cleanName,
      cleanRegDate,
      cleanLastLogin,
      cleanStatus,
    });
  }

  // If live credentials are not configured, queue non-fatally
  if (!isGoogleSheetsConfigured()) {
    queuePendingSync({
      ...user,
      action: "upsert",
      attempts: 0,
      lastAttemptAt: Date.now(),
      lastError: "Google Sheets service credentials not configured in environment",
    });
    return {
      synced: false,
      action: "queued",
      reason: "credentials_not_configured",
    };
  }

  try {
    const authClient = getSheetsAuthClient();
    const spreadsheetId = config.googleSheetsSpreadsheetId;
    const range = "Sheet1!A:E";

    // 1. Fetch existing rows to check for headers and duplicate user IDs
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(range)}`;

    const readRes = await authClient.request<{ values?: string[][] }>({
      url: readUrl,
      method: "GET",
    });

    const rows = readRes.data.values || [];

    // Initialize headers if sheet is empty
    if (rows.length === 0) {
      await authClient.request({
        url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
          spreadsheetId
        )}/values/Sheet1!A1:E1?valueInputOption=RAW`,
        method: "PUT",
        data: {
          values: [Array.from(SHEET_COLUMNS)],
        },
      });
      rows.push(Array.from(SHEET_COLUMNS));
    }

    // 2. Search for existing user row by Internal User ID (Column A)
    let existingRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row && row[0] === cleanUserId) {
        existingRowIndex = i + 1; // 1-based index in Google Sheets
        break;
      }
    }

    if (existingRowIndex > 0) {
      // User exists: Update Last Login and Registration Status
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId
      )}/values/Sheet1!A${existingRowIndex}:E${existingRowIndex}?valueInputOption=RAW`;

      await authClient.request({
        url: updateUrl,
        method: "PUT",
        data: {
          values: [
            [
              cleanUserId,
              cleanName,
              rows[existingRowIndex - 1][2] || cleanRegDate,
              cleanLastLogin,
              cleanStatus,
            ],
          ],
        },
      });

      return {
        synced: true,
        action: "updated",
        rowIndex: existingRowIndex,
      };
    } else {
      // First-time user: Append new row
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId
      )}/values/Sheet1!A:E:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

      await authClient.request({
        url: appendUrl,
        method: "POST",
        data: {
          values: [
            [cleanUserId, cleanName, cleanRegDate, cleanLastLogin, cleanStatus],
          ],
        },
      });

      return {
        synced: true,
        action: "appended",
        rowIndex: rows.length + 1,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Sheets API request failed";
    console.warn("[Google Sheets Sync] Sync attempt failed non-fatally; queued for retry:", errorMsg);

    queuePendingSync({
      ...user,
      action: "upsert",
      attempts: 1,
      lastAttemptAt: Date.now(),
      lastError: errorMsg,
    });

    return {
      synced: false,
      action: "queued",
      error: errorMsg,
    };
  }
}

/**
 * Propagates account erasure to the Google Sheet (sets status to 'Deleted' and redacts name).
 */
export async function syncUserDeletion(userId: string): Promise<SyncResult> {
  const cleanUserId = sanitizeSpreadsheetCell(userId);

  if (mockSheetStore !== null) {
    for (let i = 1; i < mockSheetStore.length; i++) {
      if (mockSheetStore[i][0] === cleanUserId) {
        mockSheetStore[i][1] = "[Deleted]";
        mockSheetStore[i][4] = "Deleted";
        mockSheetStore[i][3] = formatDateForSheet(new Date());
        return { synced: true, action: "deleted", rowIndex: i + 1 };
      }
    }
    return { synced: true, action: "deleted" };
  }

  if (!isGoogleSheetsConfigured()) {
    queuePendingSync({
      userId,
      customerName: "[Deleted]",
      registrationDate: new Date(),
      lastLogin: new Date(),
      status: "Deleted",
      action: "delete",
      attempts: 0,
      lastAttemptAt: Date.now(),
    });
    return { synced: false, action: "queued", reason: "credentials_not_configured" };
  }

  try {
    const authClient = getSheetsAuthClient();
    const spreadsheetId = config.googleSheetsSpreadsheetId;
    const range = "Sheet1!A:E";

    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(range)}`;

    const readRes = await authClient.request<{ values?: string[][] }>({
      url: readUrl,
      method: "GET",
    });

    const rows = readRes.data.values || [];
    let targetRow = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][0] === cleanUserId) {
        targetRow = i + 1;
        break;
      }
    }

    if (targetRow > 0) {
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId
      )}/values/Sheet1!A${targetRow}:E${targetRow}?valueInputOption=RAW`;

      await authClient.request({
        url: updateUrl,
        method: "PUT",
        data: {
          values: [
            [
              cleanUserId,
              "[Deleted]",
              rows[targetRow - 1][2] || formatDateForSheet(new Date()),
              formatDateForSheet(new Date()),
              "Deleted",
            ],
          ],
        },
      });

      return { synced: true, action: "deleted", rowIndex: targetRow };
    }

    return { synced: true, action: "deleted" };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Deletion sync failed";
    console.warn("[Google Sheets Deletion Sync] Failed non-fatally; queued for retry:", errorMsg);

    queuePendingSync({
      userId,
      customerName: "[Deleted]",
      registrationDate: new Date(),
      lastLogin: new Date(),
      status: "Deleted",
      action: "delete",
      attempts: 1,
      lastAttemptAt: Date.now(),
      lastError: errorMsg,
    });

    return { synced: false, action: "queued", error: errorMsg };
  }
}

/**
 * Retries queued synchronizations once connection is restored.
 */
export async function processPendingSheetSyncs(): Promise<{ processed: number; succeeded: number }> {
  if (pendingSyncQueue.length === 0) {
    return { processed: 0, succeeded: 0 };
  }

  const items = [...pendingSyncQueue];
  pendingSyncQueue.length = 0;
  let succeeded = 0;

  for (const item of items) {
    try {
      if (item.action === "delete") {
        const res = await syncUserDeletion(item.userId);
        if (res.synced) succeeded++;
        else queuePendingSync({ ...item, attempts: item.attempts + 1 });
      } else {
        const res = await syncUserRegistration(item);
        if (res.synced) succeeded++;
        else queuePendingSync({ ...item, attempts: item.attempts + 1 });
      }
    } catch {
      queuePendingSync({ ...item, attempts: item.attempts + 1 });
    }
  }

  return { processed: items.length, succeeded };
}

function queuePendingSync(item: PendingSyncItem): void {
  const existingIdx = pendingSyncQueue.findIndex(p => p.userId === item.userId);
  if (existingIdx >= 0) {
    pendingSyncQueue[existingIdx] = item;
  } else {
    pendingSyncQueue.push(item);
    if (pendingSyncQueue.length > MAX_PENDING_QUEUE) {
      pendingSyncQueue.shift();
    }
  }
}

function syncUserToMockSheet(data: {
  cleanUserId: string;
  cleanName: string;
  cleanRegDate: string;
  cleanLastLogin: string;
  cleanStatus: string;
}): SyncResult {
  if (!mockSheetStore) mockSheetStore = [];

  if (mockSheetStore.length === 0) {
    mockSheetStore.push(Array.from(SHEET_COLUMNS));
  }

  let existingIdx = -1;
  for (let i = 1; i < mockSheetStore.length; i++) {
    if (mockSheetStore[i][0] === data.cleanUserId) {
      existingIdx = i;
      break;
    }
  }

  if (existingIdx > 0) {
    mockSheetStore[existingIdx][1] = data.cleanName;
    mockSheetStore[existingIdx][3] = data.cleanLastLogin;
    mockSheetStore[existingIdx][4] = data.cleanStatus;
    return { synced: true, action: "updated", rowIndex: existingIdx + 1 };
  } else {
    mockSheetStore.push([
      data.cleanUserId,
      data.cleanName,
      data.cleanRegDate,
      data.cleanLastLogin,
      data.cleanStatus,
    ]);
    return { synced: true, action: "appended", rowIndex: mockSheetStore.length };
  }
}
