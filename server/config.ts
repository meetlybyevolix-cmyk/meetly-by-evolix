import "dotenv/config";
import { randomBytes } from "node:crypto";

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
  iceServers: IceServerConfig[];
}

function parseIceServers(): IceServerConfig[] {
  const stunUrls = process.env.STUN_SERVERS
    ? process.env.STUN_SERVERS.split(",")
        .map(u => u.trim())
        .filter(Boolean)
    : ["stun:stun.l.google.com:19302"];

  const servers: IceServerConfig[] = [{ urls: stunUrls }];

  if (process.env.TURN_SERVER_URL) {
    const turnConfig: IceServerConfig = {
      urls: process.env.TURN_SERVER_URL.split(",")
        .map(u => u.trim())
        .filter(Boolean),
    };
    if (process.env.TURN_USERNAME) {
      turnConfig.username = process.env.TURN_USERNAME;
    }
    if (process.env.TURN_CREDENTIAL) {
      turnConfig.credential = process.env.TURN_CREDENTIAL;
    }
    servers.push(turnConfig);
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
  iceServers: parseIceServers(),
};
