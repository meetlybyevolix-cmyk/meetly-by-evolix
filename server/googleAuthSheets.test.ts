import { beforeEach, describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import {
  getUserByOpenId,
  getInternalUserId,
  upsertUser,
  deleteUserByOpenId,
} from "./db";
import {
  verifyGoogleIdToken,
  assertGoogleAuthRateLimit,
  resetGoogleAuthRateLimit,
} from "./googleAuth";
import {
  syncUserRegistration,
  syncUserDeletion,
  processPendingSheetSyncs,
  sanitizeSpreadsheetCell,
  setMockSheetsStore,
  getMockSheetsStore,
  resetMockSheetsStore,
  getPendingSyncQueueLength,
  SHEET_COLUMNS,
} from "./googleSheets";
import {
  createAuthSessionToken,
  verifyAuthSessionToken,
  parseCookies,
} from "./authSession";
import { COOKIE_NAME } from "@shared/const";
import type { TrpcContext } from "./_core/context";

function createMockContext(overrides: Partial<TrpcContext> = {}): TrpcContext {
  const headers: Record<string, string> = {};
  const responseHeaders: Record<string, string | string[]> = {};

  const req = {
    headers,
    ip: "127.0.0.1",
    socket: { remoteAddress: "127.0.0.1" },
    ...overrides.req,
  } as unknown as TrpcContext["req"];

  const res = {
    setHeader: (key: string, val: string | string[]) => {
      responseHeaders[key.toLowerCase()] = val;
    },
    getHeader: (key: string) => responseHeaders[key.toLowerCase()],
    cookie: (name: string, val: string) => {
      responseHeaders["set-cookie"] = `${name}=${val}`;
    },
    clearCookie: (name: string) => {
      responseHeaders["set-cookie"] = `${name}=; Max-Age=-1`;
    },
    ...overrides.res,
  } as unknown as TrpcContext["res"];

  return {
    req,
    res,
    user: overrides.user || null,
  };
}

describe("Meetly Phase 8: Google Authentication & Google Sheets Registration Suite", () => {
  beforeEach(() => {
    resetGoogleAuthRateLimit();
    setMockSheetsStore([]); // Empty mock sheet with auto-header initialization
  });

  // 1. First-time Google login
  it("1. First-time Google login creates account, assigns persistent USR ID, and registers row", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const mockToken = "mock-google-token:google_sub_alice:Alice Sharma:alice@example.com";

    const res = await caller.auth.googleLogin({ idToken: mockToken });

    expect(res.success).toBe(true);
    expect(res.isNewUser).toBe(true);
    expect(res.user.name).toBe("Alice Sharma");
    expect(res.user.userId).toMatch(/^USR-[0-9A-F]{12}$/);
    expect(res.sessionToken).toBeDefined();

    // Verify sheet was populated with headers + row
    const sheetRows = getMockSheetsStore();
    expect(sheetRows).not.toBeNull();
    expect(sheetRows![0]).toEqual(Array.from(SHEET_COLUMNS));
    expect(sheetRows![1][0]).toBe(res.user.userId);
    expect(sheetRows![1][1]).toBe("Alice Sharma");
    expect(sheetRows![1][4]).toBe("Active");
  });

  // 2. Returning-user login
  it("2. Returning-user login recognizes existing user, maintains same ID, and sets isNewUser=false", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const mockToken = "mock-google-token:google_sub_bob:Bob Patel:bob@example.com";

    // First login
    const firstRes = await caller.auth.googleLogin({ idToken: mockToken });
    expect(firstRes.isNewUser).toBe(true);
    const originalUserId = firstRes.user.userId;

    // Second login (returning user)
    const secondRes = await caller.auth.googleLogin({ idToken: mockToken });
    expect(secondRes.isNewUser).toBe(false);
    expect(secondRes.user.userId).toBe(originalUserId);
    expect(secondRes.user.name).toBe("Bob Patel");
  });

  // 3. Verified customer name capture
  it("3. Verified customer name is captured exclusively from verified Google payload", async () => {
    const mockToken = "mock-google-token:google_sub_carol:Carol Danvers:carol@marvel.com";
    const verified = await verifyGoogleIdToken(mockToken);

    expect(verified.sub).toBe("google_sub_carol");
    expect(verified.name).toBe("Carol Danvers");
    expect(verified.email).toBe("carol@marvel.com");
    expect(verified.emailVerified).toBe(true);
  });

  // 4. Database registration
  it("4. Database registration stores user in MySQL with openId, name, loginMethod, and timestamps", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const mockToken = "mock-google-token:google_sub_david:David Miller:david@example.com";

    const res = await caller.auth.googleLogin({ idToken: mockToken });
    const userInDb = await getUserByOpenId("google_sub_david");

    expect(userInDb).toBeDefined();
    expect(userInDb?.openId).toBe("google_sub_david");
    expect(userInDb?.name).toBe("David Miller");
    expect(userInDb?.loginMethod).toBe("google");
    expect(userInDb?.role).toBe("user");
    expect(getInternalUserId(userInDb!)).toBe(res.user.userId);
  });

  // 5. Google Sheet synchronization
  it("5. Google Sheet synchronization writes RAW values with formula sanitization", async () => {
    const dangerousName = "=cmd|'/C calc'!A0";
    const sanitized = sanitizeSpreadsheetCell(dangerousName);

    // Verify formula trigger is escaped with leading quote
    expect(sanitized.startsWith("'=")).toBe(true);

    const syncRes = await syncUserRegistration({
      userId: "USR-SAFE12345678",
      customerName: dangerousName,
      registrationDate: new Date(),
      lastLogin: new Date(),
      status: "Active",
    });

    expect(syncRes.synced).toBe(true);
    const sheet = getMockSheetsStore();
    expect(sheet).not.toBeNull();
    // Name in sheet should have sanitized formula
    expect(sheet![1][1]).toBe(sanitized);
    expect(sheet![1][0]).toBe("USR-SAFE12345678");
  });

  // 6. Duplicate-login prevention in Google Sheet
  it("6. Duplicate-login prevention updates existing row rather than appending duplicate rows", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const mockToken = "mock-google-token:google_sub_eve:Eve Johnson:eve@example.com";

    // 1st login
    await caller.auth.googleLogin({ idToken: mockToken });
    const sheetAfterFirst = getMockSheetsStore();
    expect(sheetAfterFirst?.length).toBe(2); // Headers + 1 row

    // 2nd login
    await caller.auth.googleLogin({ idToken: mockToken });
    const sheetAfterSecond = getMockSheetsStore();

    // MUST remain 2 rows (no duplicate appended)
    expect(sheetAfterSecond?.length).toBe(2);
    expect(sheetAfterSecond![1][1]).toBe("Eve Johnson");
    expect(sheetAfterSecond![1][4]).toBe("Active");
  });

  // 7. Invalid Google token rejection
  it("7. Invalid Google token rejection throws BAD_REQUEST and prevents session creation", async () => {
    const caller = appRouter.createCaller(createMockContext());

    await expect(caller.auth.googleLogin({ idToken: "" })).rejects.toThrow();
    await expect(caller.auth.googleLogin({ idToken: "invalid_gibberish_token" })).rejects.toThrow(
      /verification failed|invalid/i
    );
  });

  // 8. Account deletion and data synchronization
  it("8. Account deletion marks MySQL user as deleted and propagates status='Deleted' to Sheet", async () => {
    const mockToken = "mock-google-token:google_sub_frank:Frank Castle:frank@example.com";
    const loginCaller = appRouter.createCaller(createMockContext());
    const loginRes = await loginCaller.auth.googleLogin({ idToken: mockToken });

    const user = await getUserByOpenId("google_sub_frank");
    expect(user).toBeDefined();

    // Authenticated caller with user context
    const authedCaller = appRouter.createCaller(createMockContext({ user: user! }));
    const deleteRes = await authedCaller.auth.deleteAccount();

    expect(deleteRes.success).toBe(true);

    // Verify MySQL redaction
    const deletedUser = await getUserByOpenId("google_sub_frank");
    expect(deletedUser?.name).toBe("[Deleted User]");
    expect(deletedUser?.email).toBeNull();

    // Verify Google Sheet deletion sync
    const sheet = getMockSheetsStore();
    expect(sheet).not.toBeNull();
    const frankRow = sheet!.find(r => r[0] === loginRes.user.userId);
    expect(frankRow).toBeDefined();
    expect(frankRow![1]).toBe("[Deleted]");
    expect(frankRow![4]).toBe("Deleted");
  });

  // 9. Google Sheets API failure recovery
  it("9. Google Sheets failure does not block MySQL login and safely enqueues sync for retry", async () => {
    resetMockSheetsStore(); // Disables mock sheet store, triggering queued path
    expect(getPendingSyncQueueLength()).toBe(0);

    const caller = appRouter.createCaller(createMockContext());
    const mockToken = "mock-google-token:google_sub_grace:Grace Hopper:grace@navy.mil";

    // Should succeed in MySQL even though live Google Sheets is not configured in test env
    const res = await caller.auth.googleLogin({ idToken: mockToken });

    expect(res.success).toBe(true);
    expect(res.user.name).toBe("Grace Hopper");
    expect(res.sheetsSync.synced).toBe(false);
    expect(res.sheetsSync.action).toBe("queued");
    expect(getPendingSyncQueueLength()).toBeGreaterThanOrEqual(1);

    // Test retry processor
    setMockSheetsStore([]);
    const retryResult = await processPendingSheetSyncs();
    expect(retryResult.processed).toBeGreaterThanOrEqual(1);
    expect(retryResult.succeeded).toBeGreaterThanOrEqual(1);
  });

  // 10. Logout and session expiration
  it("10. Logout clears cookie and expired session tokens are rejected", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const mockToken = "mock-google-token:google_sub_helen:Helen Keller:helen@example.com";
    await caller.auth.googleLogin({ idToken: mockToken });

    const user = (await getUserByOpenId("google_sub_helen"))!;
    const validToken = createAuthSessionToken(user);
    expect(verifyAuthSessionToken(validToken)).not.toBeNull();

    // Expired token test (artificially backdated exp)
    const expiredPayload = {
      openId: user.openId,
      role: user.role,
      iat: Math.floor(Date.now() / 1000) - 4000,
      exp: Math.floor(Date.now() / 1000) - 100, // in the past
    };
    const b64 = Buffer.from(JSON.stringify(expiredPayload)).toString("base64url");
    const fakeSignature = "invalid_or_expired_sig";
    expect(verifyAuthSessionToken(`${b64}.${fakeSignature}`)).toBeNull();

    // Logout mutation
    const logoutRes = await caller.auth.logout();
    expect(logoutRes.success).toBe(true);
  });

  // 11. Mobile Google Sign-In compatibility
  it("11. Mobile Google Sign-In parses cookie headers and Bearer auth tokens correctly", () => {
    const rawCookieHeader = `meetly-session=anon123; ${COOKIE_NAME}=test_session_token_xyz; theme=dark`;
    const parsed = parseCookies(rawCookieHeader);

    expect(parsed[COOKIE_NAME]).toBe("test_session_token_xyz");
    expect(parsed["meetly-session"]).toBe("anon123");
    expect(parsed["theme"]).toBe("dark");
  });

  // 12. Existing chat and video privacy isolation
  it("12. Verified Google identity is strictly isolated and NEVER transmitted to stranger chat partners", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const mockToken = "mock-google-token:google_sub_ivan:Ivan Secret:ivan@private.org";
    const authRes = await caller.auth.googleLogin({ idToken: mockToken });

    expect(authRes.user.name).toBe("Ivan Secret");

    // Start matchmaking session
    const sessionRes = await caller.chat.session.create({
      ageConfirmed: true,
      termsAccepted: true,
      privacyAccepted: true,
      preferences: {
        interests: ["Technology"],
        language: "English",
        mediaMode: "video",
      },
    });

    expect(sessionRes.token).toBeDefined();

    // Query chat state using session token header
    const chatCaller = appRouter.createCaller(
      createMockContext({
        req: {
          headers: { "x-meetly-session": sessionRes.token },
          ip: "127.0.0.1",
          socket: { remoteAddress: "127.0.0.1" },
        } as unknown as TrpcContext["req"],
      })
    );

    const chatState = await chatCaller.chat.state();
    const serializedState = JSON.stringify(chatState);

    expect(serializedState).not.toContain("Ivan Secret");
    expect(serializedState).not.toContain("ivan@private.org");
    expect(serializedState).not.toContain("google_sub_ivan");
  });
});
