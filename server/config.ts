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
}

export function generateIceServers(sessionIdentifier?: string): IceServerConfig[] {
  const stunUrls = process.env.STUN_SERVERS
    ? process.env.STUN_SERVERS.split(",")
        .map(u => u.trim())
        .filter(Boolean)
    : ["stun:stun.l.google.com:19302"];

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
};
