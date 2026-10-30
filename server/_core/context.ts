import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { COOKIE_NAME } from "@shared/const";
import type { User } from "../../drizzle/schema";
import { parseCookies, verifyAuthSessionToken } from "../authSession";
import { getUserByOpenId } from "../db";

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
    const token =
      parsedCookies[COOKIE_NAME] ||
      opts.req.headers.authorization?.replace(/^Bearer\s+/i, "");

    if (token) {
      const payload = verifyAuthSessionToken(token);
      if (payload?.openId) {
        user = (await getUserByOpenId(payload.openId)) ?? null;
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
