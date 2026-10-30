import { OAuth2Client } from "google-auth-library";
import { config } from "./config";

export interface VerifiedGoogleUser {
  sub: string;
  name: string;
  email: string | null;
  emailVerified: boolean;
}

const oauth2Client = new OAuth2Client(config.googleClientId || undefined);

// Sliding window login rate limiter per IP: max 10 requests per 60 seconds
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const loginRateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

export function assertGoogleAuthRateLimit(clientIp: string): void {
  const now = Date.now();
  const existing = loginRateLimitMap.get(clientIp);

  if (!existing || now > existing.resetAt) {
    loginRateLimitMap.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    throw new Error(
      "Too many authentication attempts from this network. Please wait a minute before trying again."
    );
  }

  existing.count += 1;
}

/**
 * Resets the in-memory login rate limit (primarily used for test suites).
 */
export function resetGoogleAuthRateLimit(): void {
  loginRateLimitMap.clear();
}

/**
 * Server-side verification of Google ID token using Google Identity Services.
 * Validates cryptographic signature, issuer, audience, and expiration.
 * Never trusts client-submitted names or claims.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleUser> {
  if (!idToken || typeof idToken !== "string" || !idToken.trim()) {
    throw new Error("Missing or invalid Google authentication token.");
  }

  const trimmedToken = idToken.trim();

  // Test / Offline Mock Verification fallback
  if (config.allowMockGoogleAuth && trimmedToken.startsWith("mock-google-token:")) {
    const parts = trimmedToken.split(":");
    // format: mock-google-token:<sub|google_id>:<name>:<email>
    const sub = parts[1] || "mock_google_sub_12345";
    const name = parts[2] || "Mock Google User";
    const email = parts[3] || "mock.user@example.com";

    return {
      sub,
      name,
      email,
      emailVerified: true,
    };
  }

  try {
    const ticket = await oauth2Client.verifyIdToken({
      idToken: trimmedToken,
      audience: config.googleClientId ? [config.googleClientId] : undefined,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Google authentication payload could not be extracted.");
    }

    // 1. Verify stable subject claim
    if (!payload.sub || typeof payload.sub !== "string") {
      throw new Error("Google token is missing valid subject ('sub') claim.");
    }

    // 2. Verify Issuer
    const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
    if (!payload.iss || !validIssuers.includes(payload.iss)) {
      throw new Error("Google token issuer is invalid.");
    }

    // 3. Verify Expiration
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < nowSeconds) {
      throw new Error("Google authentication token has expired. Please sign in again.");
    }

    // 4. Extract verified customer name from Google profile payload
    const verifiedName =
      payload.name?.trim() ||
      payload.given_name?.trim() ||
      payload.email?.split("@")[0] ||
      "Google User";

    const verifiedEmail = payload.email?.trim() || null;
    const emailVerified = Boolean(payload.email_verified);

    return {
      sub: payload.sub,
      name: verifiedName,
      email: verifiedEmail,
      emailVerified,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Token used too late")) {
      throw new Error("Google authentication token expired. Please try signing in again.");
    }
    const msg = error instanceof Error ? error.message : "Authentication verification failed";
    throw new Error(`Google authentication token verification failed: ${msg}`);
  }
}
