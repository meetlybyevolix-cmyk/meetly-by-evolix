import "dotenv/config";
import { createHmac, randomBytes } from "node:crypto";

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  isProduction: boolean;
  databaseUrl: string;
  sessionSecret: Buffer;
  corsOrigin: string;
  turnRealm: string;
  turnSharedSecret: string;
  turnCredentialTtl: number;
  iceServers: IceServerConfig[];
  requireAgeAssurance: boolean;
  ageAssuranceProvider: string;
  googleClientId: string;
  googleSheetsSpreadsheetId: string;
  googleServiceAccountEmail: string;
  googleServiceAccountPrivateKey: string;
  allowMockGoogleAuth: boolean;
}

export function generateIceServers(sessionIdentifier?: string): IceServerConfig[] {
  const stunUrls = process.env.STUN_SERVERS
    ? process.env.STUN_SERVERS.split(",")
        .map(u => u.trim())
        .filter(Boolean)
    : [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
      ];

  const servers: IceServerConfig[] = [{ urls: stunUrls }];

  const turnServersEnv = process.env.TURN_SERVERS || process.env.TURN_SERVER_URL;
  const turnSharedSecret = process.env.TURN_SHARED_SECRET?.trim();

  if (turnServersEnv) {
    const urls = turnServersEnv
      .split(",")
      .map(u => u.trim())
      .filter(Boolean);

    if (turnSharedSecret) {
      // RFC 5766 / Coturn REST API Ephemeral Time-Limited Credential Mechanism
      const ttl = Number(process.env.TURN_CREDENTIAL_TTL || 86400);
      const expiry = Math.floor(Date.now() / 1000) + ttl;
      const username = sessionIdentifier
        ? `${expiry}:${sessionIdentifier}`
        : `${expiry}:${randomBytes(8).toString("hex")}`;
      const credential = createHmac("sha1", turnSharedSecret)
        .update(username)
        .digest("base64");

      servers.push({
        urls,
        username,
        credential,
      });
    } else if (process.env.TURN_USERNAME) {
      // Static credentials (e.g. basic testing)
      const turnConfig: IceServerConfig = { urls };
      turnConfig.username = process.env.TURN_USERNAME;
      if (process.env.TURN_CREDENTIAL) {
        turnConfig.credential = process.env.TURN_CREDENTIAL;
      }
      servers.push(turnConfig);
    }
  }

  return servers;
}

const rawSecret = process.env.SESSION_SECRET?.trim();

const INSECURE_SECRET_PLACEHOLDERS = [
  "your_secure_random_session_secret_at_least_32_characters",
  "change_in_production_to_a_long_random_hex_string",
  "secret",
  "changeme",
  "your_coturn_static_auth_secret_here",
  "change_in_production_to_a_strong_turn_secret",
];

const INSECURE_DB_PASSWORDS = [
  "secure_meetly_db_pass_2026",
  "super_secure_root_password_2026",
  "secure_password",
  "password",
  "root",
];

const INSECURE_MODERATOR_KEYS = [
  "your_secure_random_moderator_api_key_32_characters",
  "change_in_production_to_a_secure_moderator_secret",
  "admin",
  "moderator",
];

export function validateProductionConfig(env: Record<string, string | undefined> = process.env) {
  const nodeEnv = env.NODE_ENV || "development";
  const isProd = nodeEnv === "production";
  if (!isProd) return;

  const sessionSecretVal = env.SESSION_SECRET?.trim();
  if (!sessionSecretVal) {
    throw new Error(
      "[Security] SESSION_SECRET must be explicitly set in production. Ephemeral fallbacks are prohibited in production."
    );
  }
  if (sessionSecretVal.length < 32) {
    throw new Error(
      "[Security] SESSION_SECRET must be at least 32 characters in production."
    );
  }
  if (INSECURE_SECRET_PLACEHOLDERS.includes(sessionSecretVal.toLowerCase())) {
    throw new Error(
      "[Security] Insecure placeholder detected in SESSION_SECRET. Please generate a cryptographically strong random secret (e.g. `openssl rand -hex 32`)."
    );
  }

  const moderatorKeyVal = env.MODERATOR_KEY?.trim() || env.ADMIN_KEY?.trim();
  if (moderatorKeyVal) {
    if (moderatorKeyVal.length < 24) {
      throw new Error(
        "[Security] MODERATOR_KEY must be at least 24 characters in production."
      );
    }
    if (INSECURE_MODERATOR_KEYS.includes(moderatorKeyVal.toLowerCase())) {
      throw new Error(
        "[Security] Insecure placeholder detected in MODERATOR_KEY. Please generate a cryptographically strong random key."
      );
    }
  }

  const dbUrl = env.DATABASE_URL?.trim();
  if (dbUrl) {
    for (const weakPass of INSECURE_DB_PASSWORDS) {
      if (dbUrl.includes(weakPass)) {
        throw new Error(
          `[Security] Insecure default/placeholder database password ("${weakPass}") detected in DATABASE_URL. Please set a unique, strong database password.`
        );
      }
    }
  }

  const turnSecret = env.TURN_SHARED_SECRET?.trim();
  if (turnSecret && INSECURE_SECRET_PLACEHOLDERS.includes(turnSecret.toLowerCase())) {
    throw new Error(
      "[Security] Insecure placeholder detected in TURN_SHARED_SECRET. Please generate a strong TURN secret."
    );
  }

  const cors = env.CORS_ORIGIN?.trim() || "*";
  if (cors === "*") {
    console.warn(
      "[Security Warning] CORS_ORIGIN is configured as '*' in production. For public production, restrict CORS to your authoritative frontend domain(s) (e.g., https://meetly.evolix.studio)."
    );
  }
}

// Validate in production environment
if (process.env.NODE_ENV === "production") {
  validateProductionConfig(process.env);
}

const sessionSecret = rawSecret
  ? Buffer.from(rawSecret, rawSecret.length === 64 ? "hex" : "utf-8")
  : randomBytes(32);

export const config: AppConfig = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: process.env.DATABASE_URL || "",
  sessionSecret,
  corsOrigin: process.env.CORS_ORIGIN || "*",
  turnRealm: process.env.TURN_REALM || "meetly.internal",
  turnSharedSecret: process.env.TURN_SHARED_SECRET || "",
  turnCredentialTtl: Number(process.env.TURN_CREDENTIAL_TTL || 86400),
  iceServers: generateIceServers(),
  requireAgeAssurance:
    process.env.REQUIRE_AGE_ASSURANCE === "true" &&
    process.env.ALLOW_EPHEMERAL_COMPLIANCE_FALLBACK !== "true",
  ageAssuranceProvider: process.env.AGE_ASSURANCE_PROVIDER || "mock",
  googleClientId:
    process.env.GOOGLE_CLIENT_ID ||
    "162654871088-dkiopg65foj48avnhhr34s3rs1v4ccq9.apps.googleusercontent.com",
  googleSheetsSpreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "",
  googleServiceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
  googleServiceAccountPrivateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "",
  allowMockGoogleAuth:
    process.env.ALLOW_MOCK_GOOGLE_AUTH === "true" ||
    process.env.NODE_ENV !== "production",
};
