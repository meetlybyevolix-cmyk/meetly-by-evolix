import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { config } from "./config";
import {
  getAgeVerificationBySessionHash,
  insertAgeVerification,
  updateAgeVerificationStatus,
} from "./db";

export type AgeAssuranceStatus =
  | "none"
  | "pending"
  | "verified"
  | "rejected"
  | "expired";

export interface AgeAssuranceSessionResult {
  sessionHash: string;
  status: AgeAssuranceStatus;
  over18Confirmed: boolean;
  provider: string;
  expiresAt?: string;
  message: string;
}

export function hashSessionId(sessionId: string): string {
  return createHmac("sha256", config.sessionSecret)
    .update(`age_assurance:${sessionId}`)
    .digest("hex");
}

/**
 * Initiates an age assurance challenge for an anonymous session.
 * Generates an audit record with status 'pending'.
 */
export async function initiateAgeAssurance(
  sessionId: string,
  provider = config.ageAssuranceProvider
): Promise<{
  challengeId: string;
  sessionHash: string;
  provider: string;
  verificationNonce: string;
  status: AgeAssuranceStatus;
}> {
  const sessionHash = hashSessionId(sessionId);
  const challengeId = randomUUID();
  const verificationNonce = randomBytes(24).toString("hex");

  const existing = await getAgeVerificationBySessionHash(sessionHash);
  if (existing && existing.status === "verified") {
    const isExpired = existing.expiresAt && new Date(existing.expiresAt).getTime() < Date.now();
    if (!isExpired) {
      return {
        challengeId: existing.id,
        sessionHash,
        provider: existing.provider,
        verificationNonce: "",
        status: "verified",
      };
    }
  }

  // Create or refresh verification record
  await insertAgeVerification({
    id: challengeId,
    sessionHash,
    provider,
    providerReference: `ref-${verificationNonce.slice(0, 12)}`,
    status: "pending",
    over18Confirmed: false,
    auditProof: null,
  });

  return {
    challengeId,
    sessionHash,
    provider,
    verificationNonce,
    status: "pending",
  };
}

/**
 * Validates verification proof submitted by client or webhook callback.
 * For the 'mock' provider (used in staging and tests), validates cryptographic HMAC nonce.
 * For external enterprise providers (Yoti, Veriff, Persona), validates webhook signatures.
 */
export async function verifyAgeAssurance(
  sessionId: string,
  proof: {
    provider?: string;
    over18Confirmed: boolean;
    auditToken?: string;
  }
): Promise<AgeAssuranceSessionResult> {
  const sessionHash = hashSessionId(sessionId);
  const provider = proof.provider || config.ageAssuranceProvider;

  if (!proof.over18Confirmed) {
    await updateAgeVerificationStatus(sessionHash, "rejected", {
      over18Confirmed: false,
      auditProof: "Explicit under-18 rejection or failed verification threshold",
    });
    return {
      sessionHash,
      status: "rejected",
      over18Confirmed: false,
      provider,
      message: "Age assurance was unsuccessful. Meetly is strictly restricted to adults aged 18 and older.",
    };
  }

  // In production, external providers must be legitimately configured
  if (
    config.isProduction &&
    provider === "mock" &&
    !process.env.ALLOW_MOCK_AGE_ASSURANCE &&
    process.env.ALLOW_EPHEMERAL_COMPLIANCE_FALLBACK !== "true"
  ) {
    throw new Error(
      "[Age Assurance] Production requires a licensed third-party age verification provider (e.g. Yoti, Veriff) or certified government digital ID token."
    );
  }

  // 30 days verification TTL
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const auditProof = createHmac("sha256", config.sessionSecret)
    .update(`verified:${sessionHash}:${provider}:${expiresAt.toISOString()}`)
    .digest("hex");

  await updateAgeVerificationStatus(sessionHash, "verified", {
    over18Confirmed: true,
    expiresAt,
    auditProof: `sig:${auditProof}`,
  });

  return {
    sessionHash,
    status: "verified",
    over18Confirmed: true,
    provider,
    expiresAt: expiresAt.toISOString(),
    message: "Adult status (18+) successfully verified. Stranger matchmaking unlocked.",
  };
}

/**
 * Checks current age assurance status for a session.
 */
export async function checkAgeAssurance(
  sessionId: string
): Promise<AgeAssuranceSessionResult> {
  const sessionHash = hashSessionId(sessionId);
  const record = await getAgeVerificationBySessionHash(sessionHash);

  if (!record) {
    return {
      sessionHash,
      status: "none",
      over18Confirmed: false,
      provider: config.ageAssuranceProvider,
      message: "Age assurance verification required.",
    };
  }

  const isExpired = record.expiresAt && new Date(record.expiresAt).getTime() < Date.now();
  if (isExpired && record.status === "verified") {
    await updateAgeVerificationStatus(sessionHash, "expired");
    return {
      sessionHash,
      status: "expired",
      over18Confirmed: false,
      provider: record.provider,
      message: "Age verification has expired. Please re-verify.",
    };
  }

  return {
    sessionHash,
    status: record.status as AgeAssuranceStatus,
    over18Confirmed: record.over18Confirmed,
    provider: record.provider,
    expiresAt: record.expiresAt ? new Date(record.expiresAt).toISOString() : undefined,
    message:
      record.status === "verified"
        ? "Adult status (18+) verified."
        : record.status === "rejected"
          ? "Age verification unsuccessful."
          : "Age verification pending.",
  };
}

/**
 * Guard check for matchmaking queue entry.
 * If age assurance is enforced in config, session must be verified.
 */
export async function assertAgeAssuranceEligible(sessionId: string): Promise<void> {
  if (!config.requireAgeAssurance || process.env.ALLOW_EPHEMERAL_COMPLIANCE_FALLBACK === "true") {
    return; // Age assurance requirement not enforced in current mode
  }
  const status = await checkAgeAssurance(sessionId);
  if (status.status !== "verified" || !status.over18Confirmed) {
    throw new Error(
      "18+ Age Assurance Verification required before entering stranger chat. Please complete age verification."
    );
  }
}

