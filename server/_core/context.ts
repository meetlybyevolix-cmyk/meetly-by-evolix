import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { COOKIE_NAME } from "@shared/const";
import type { User } from "../../drizzle/schema";
import { parseCookies, verifyAuthSessionToken } from "../authSession";
import { getUserByOpenId, upsertUser } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const rawCookie = opts.req.headers.cookie || "";
    const parsedCookies = parseCookies(rawCookie);
    const xAuthHeader = opts.req.headers["x-auth-token"];
    const xAuthToken = typeof xAuthHeader === "string" ? xAuthHeader.trim() : undefined;
    const token =
      parsedCookies[COOKIE_NAME] ||
      xAuthToken ||
      opts.req.headers.authorization?.replace(/^Bearer\s+/i, "");

    if (token) {
      const payload = verifyAuthSessionToken(token);
      if (payload?.openId) {
        user = (await getUserByOpenId(payload.openId)) ?? null;

        // Resilient Session Restoration:
        // If the server restarted (e.g. Render waking from cold start at night or in-memory reset)
        // or MySQL connection had a temporary hiccup, restore authenticated user from verified HMAC payload.
        if (!user) {
          const now = new Date();
          const restoredUser: User = {
            id: 0,
            openId: payload.openId,
            name: payload.name ?? "Google User",
            email: payload.email ?? null,
            loginMethod: "google",
            role: payload.role === "admin" ? "admin" : "user",
            createdAt: new Date((payload.iat || Math.floor(now.getTime() / 1000)) * 1000),
            updatedAt: now,
            lastSignedIn: now,
          };
          user = restoredUser;
          // Rehydrate database / in-memory table in background
          void upsertUser(restoredUser).catch(() => {});
        }
      }
    }
  } catch (error) {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
