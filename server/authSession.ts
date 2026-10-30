import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { COOKIE_NAME } from "@shared/const";
import type { User } from "../drizzle/schema";
import { config } from "./config";
import { getSessionCookieOptions } from "./_core/cookies";

export interface AuthSessionPayload {
  openId: string;
  role: string;
  iat: number;
  exp: number;
}

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Parses HTTP cookie header string into key-value map without third-party type conflicts.
 */
export function parseCookies(header?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!header) return list;
  header.split(";").forEach(pair => {
    const idx = pair.indexOf("=");
    if (idx < 0) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    try {
      list[key] = decodeURIComponent(val);
    } catch {
      list[key] = val;
    }
  });
  return list;
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 */
export function createAuthSessionToken(user: User): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AuthSessionPayload = {
    openId: user.openId,
    role: user.role,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", config.sessionSecret)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies the signature and expiration of an authentication token.
 * Uses timingSafeEqual to guard against timing side-channel attacks.
 */
export function verifyAuthSessionToken(token: string): AuthSessionPayload | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  try {
    const expectedSignature = createHmac("sha256", config.sessionSecret)
      .update(payloadB64)
      .digest("base64url");

    const expectedBuf = Buffer.from(expectedSignature);
    const actualBuf = Buffer.from(signature);

    if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
      return null;
    }

    const jsonStr = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const payload = JSON.parse(jsonStr) as AuthSessionPayload;

    if (!payload.openId || typeof payload.exp !== "number") {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null; // Expired session
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Sets the secure HTTP-only session cookie on an Express response.
 */
export function setAuthCookie(res: Response, req: Request, token: string): void {
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: SESSION_TTL_SECONDS * 1000,
  });
}

/**
 * Clears the session cookie on logout.
 */
export function clearAuthCookie(res: Response, req: Request): void {
  const cookieOptions = getSessionCookieOptions(req);
  res.clearCookie(COOKIE_NAME, cookieOptions);
}
