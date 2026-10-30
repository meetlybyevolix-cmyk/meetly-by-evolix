import { createHash, randomBytes, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config";
import {
  insertUploadedMediaRecord,
  getUploadedMediaRecord,
  updateUploadedMediaStatus,
} from "../db";
import type { Session } from "./service";

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGE_DIMENSION = 4096;
export const MAX_UPLOADS_PER_MINUTE_SESSION = 5;
export const MEDIA_RETENTION_MS = 2 * 60 * 60 * 1000; // 2 hours ephemeral retention
export const REPORTED_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days for moderation audit

export const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.resolve(process.cwd(), "data", "uploads");

// Ensure upload directory exists
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (err) {
  console.error("[Media Service] Could not initialize upload directory:", err);
}

export interface SanitizedImage {
  sanitizedBuffer: Buffer;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  ext: "jpg" | "png" | "webp";
  width: number;
  height: number;
}

export interface MediaItem {
  id: string;
  roomId: string;
  uploaderSessionId: string;
  uploaderSessionHash: string;
  mimeType: string;
  fileSizeBytes: number;
  width: number;
  height: number;
  fileName: string;
  filePath: string;
  createdAt: number;
  expiresAt: number;
  isFlagged: boolean;
  flagReason?: string;
  status: "active" | "reported" | "removed" | "expired";
}

// In-memory media registry
const mediaRegistry = new Map<string, MediaItem>();

// Room participant history for authorization (roomId -> Set of participant session IDs)
const roomParticipantsHistory = new Map<string, Set<string>>();

// Rate limiting: sessionId -> array of upload timestamps
const sessionUploadWindows = new Map<string, number[]>();

export function registerRoomParticipants(roomId: string, participants: string[]) {
  const existing = roomParticipantsHistory.get(roomId) ?? new Set<string>();
  participants.forEach(p => existing.add(p));
  roomParticipantsHistory.set(roomId, existing);
}

export function isSessionAuthorizedForRoom(roomId: string, sessionId: string): boolean {
  const participants = roomParticipantsHistory.get(roomId);
  return Boolean(participants && participants.has(sessionId));
}

/**
 * Validates magic bytes, dimensions, and strips EXIF/GPS/text metadata.
 */
export function validateAndSanitizeImage(
  buffer: Buffer,
  declaredMime?: string
): SanitizedImage {
  if (!buffer || buffer.length === 0) {
    throw new Error("No image data received.");
  }

  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error("Image must be 5MB or smaller.");
  }

  // 1. Detect format by magic bytes
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A;

  // JPEG: FF D8 FF
  const isJpeg =
    buffer.length >= 4 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  // WebP: RIFF....WEBP
  const isWebp =
    buffer.length >= 16 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";

  if (!isPng && !isJpeg && !isWebp) {
    throw new Error(
      "Only JPEG, PNG, and WebP images are supported. Executable, vector, and document formats are prohibited."
    );
  }

  if (isPng) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    if (width <= 0 || height <= 0) {
      throw new Error("Invalid PNG dimensions.");
    }
    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      throw new Error(`Image dimensions must not exceed ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}.`);
    }

    const sanitizedBuffer = stripPngMetadata(buffer);
    return {
      sanitizedBuffer,
      mimeType: "image/png",
      ext: "png",
      width,
      height,
    };
  }

  if (isJpeg) {
    let offset = 2;
    let width = 0;
    let height = 0;

    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      while (buffer[offset] === 0xff && offset < buffer.length) offset++;
      if (offset >= buffer.length) break;

      const marker = buffer[offset++];
      if (marker === 0xd9 || marker === 0xda) break; // EOI or SOS

      if (offset + 2 > buffer.length) break;
      const len = buffer.readUInt16BE(offset);

      // Start of Frame markers containing dimensions
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        if (offset + 7 <= buffer.length) {
          height = buffer.readUInt16BE(offset + 3);
          width = buffer.readUInt16BE(offset + 5);
          break;
        }
      }
      offset += len;
    }

    if (width <= 0 || height <= 0) {
      throw new Error("Invalid or unreadable JPEG image frame.");
    }
    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      throw new Error(`Image dimensions must not exceed ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}.`);
    }

    const sanitizedBuffer = stripJpegExif(buffer);
    return {
      sanitizedBuffer,
      mimeType: "image/jpeg",
      ext: "jpg",
      width,
      height,
    };
  }

  // WebP
  let width = 0;
  let height = 0;
  const chunkType = buffer.toString("ascii", 12, 16);

  if (chunkType === "VP8X" && buffer.length >= 30) {
    width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
    height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
  } else if (chunkType === "VP8 " && buffer.length >= 30) {
    width = buffer.readUInt16LE(26) & 0x3fff;
    height = buffer.readUInt16LE(28) & 0x3fff;
  } else if (chunkType === "VP8L" && buffer.length >= 25) {
    const b1 = buffer[21];
    const b2 = buffer[22];
    const b3 = buffer[23];
    const b4 = buffer[24];
    width = 1 + (((b2 & 0x3f) << 8) | b1);
    height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
  }

  if (width <= 0 || height <= 0) {
    throw new Error("Invalid or unreadable WebP image frame.");
  }
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    throw new Error(`Image dimensions must not exceed ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}.`);
  }

  const sanitizedBuffer = stripWebpMetadata(buffer);
  return {
    sanitizedBuffer,
    mimeType: "image/webp",
    ext: "webp",
    width,
    height,
  };
}

/**
 * Strips JPEG APP1 markers (EXIF / GPS / XMP).
 */
function stripJpegExif(buffer: Buffer): Buffer {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return buffer;
  }
  const chunks: Buffer[] = [Buffer.from([0xff, 0xd8])];
  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    while (buffer[offset] === 0xff && offset < buffer.length) offset++;
    if (offset >= buffer.length) break;

    const marker = buffer[offset++];
    if (marker === 0xd9) {
      chunks.push(Buffer.from([0xff, 0xd9]));
      break;
    }
    if (marker === 0xda) {
      // Start of Scan: remainder of buffer is entropy-coded image data
      chunks.push(buffer.subarray(offset - 2));
      break;
    }
    if (offset + 2 > buffer.length) break;
    const length = buffer.readUInt16BE(offset);
    if (offset + length > buffer.length) break;

    // Marker 0xE1 is APP1 (EXIF / GPS / XMP metadata). Omit it.
    if (marker !== 0xe1) {
      chunks.push(buffer.subarray(offset - 2, offset + length));
    }
    offset += length;
  }

  return Buffer.concat(chunks);
}

/**
 * Strips PNG auxiliary metadata chunks (eXIf, tEXt, zTXt, iTXt).
 */
function stripPngMetadata(buffer: Buffer): Buffer {
  if (
    buffer.length < 8 ||
    buffer[0] !== 0x89 ||
    buffer[1] !== 0x50 ||
    buffer[2] !== 0x4e ||
    buffer[3] !== 0x47
  ) {
    return buffer;
  }
  const chunks: Buffer[] = [buffer.subarray(0, 8)];
  let offset = 8;
  const strippedChunkTypes = new Set(["eXIf", "tEXt", "zTXt", "iTXt"]);

  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const totalChunkLength = 4 + 4 + length + 4; // len + type + data + crc
    if (offset + totalChunkLength > buffer.length) break;

    if (!strippedChunkTypes.has(type)) {
      chunks.push(buffer.subarray(offset, offset + totalChunkLength));
    }
    offset += totalChunkLength;
    if (type === "IEND") break;
  }

  return Buffer.concat(chunks);
}

/**
 * Strips WebP EXIF/XMP chunks.
 */
function stripWebpMetadata(buffer: Buffer): Buffer {
  if (
    buffer.length < 16 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return buffer;
  }

  const chunks: Buffer[] = [];
  let offset = 12; // Start after RIFF + length + WEBP
  const strippedChunks = new Set(["EXIF", "XMP "]);

  while (offset + 8 <= buffer.length) {
    const fourCC = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const paddedSize = chunkSize % 2 === 1 ? chunkSize + 1 : chunkSize;
    const totalLength = 8 + paddedSize;

    if (offset + totalLength > buffer.length) break;

    if (!strippedChunks.has(fourCC)) {
      chunks.push(buffer.subarray(offset, offset + totalLength));
    }
    offset += totalLength;
  }

  const payload = Buffer.concat(chunks);
  const totalRiffSize = 4 + payload.length; // 'WEBP' + payload
  const header = Buffer.alloc(12);
  header.write("RIFF", 0, 4, "ascii");
  header.writeUInt32LE(totalRiffSize, 4);
  header.write("WEBP", 8, 4, "ascii");

  return Buffer.concat([header, payload]);
}

/**
 * Checks session upload rate limits (max 5 uploads per 60 seconds).
 */
export function assertSessionUploadLimit(session: Session) {
  if (session.isSynthetic) return;
  const now = Date.now();
  const windowMs = 60_000;
  const recent = (sessionUploadWindows.get(session.id) ?? []).filter(
    t => now - t < windowMs
  );

  if (recent.length >= MAX_UPLOADS_PER_MINUTE_SESSION) {
    throw new Error(
      "Upload rate limit reached. You can send up to 5 photos per minute."
    );
  }

  sessionUploadWindows.set(session.id, [...recent, now]);
}

/**
 * Saves and registers an uploaded image for an active chat room.
 */
export async function saveUploadedImage(
  session: Session,
  rawBuffer: Buffer,
  declaredMime?: string,
  options?: { isFlagged?: boolean; flagReason?: string }
): Promise<MediaItem> {
  if (session.state !== "chat" || !session.roomId) {
    throw new Error("Photos can only be shared during an active conversation.");
  }

  assertSessionUploadLimit(session);

  const { sanitizedBuffer, mimeType, ext, width, height } =
    validateAndSanitizeImage(rawBuffer, declaredMime);

  const mediaId = randomUUID();
  const fileName = `${mediaId}.${ext}`;
  const filePath = path.resolve(UPLOAD_DIR, fileName);

  // Path traversal check
  if (!filePath.startsWith(UPLOAD_DIR)) {
    throw new Error("Invalid destination path.");
  }

  // Atomic file write
  fs.writeFileSync(filePath, sanitizedBuffer);

  const now = Date.now();
  const expiresAt = now + MEDIA_RETENTION_MS;
  const uploaderSessionHash = createHash("sha256")
    .update(session.id)
    .digest("hex");

  const mediaItem: MediaItem = {
    id: mediaId,
    roomId: session.roomId,
    uploaderSessionId: session.id,
    uploaderSessionHash,
    mimeType,
    fileSizeBytes: sanitizedBuffer.length,
    width,
    height,
    fileName,
    filePath,
    createdAt: now,
    expiresAt,
    isFlagged: options?.isFlagged ?? false,
    flagReason: options?.flagReason,
    status: "active",
  };

  mediaRegistry.set(mediaId, mediaItem);

  // Register in room history for participant access
  registerRoomParticipants(session.roomId, [session.id]);

  // Persist record to database audit trail
  try {
    await insertUploadedMediaRecord({
      id: mediaId,
      roomId: session.roomId,
      uploaderSessionHash,
      mimeType,
      fileSizeBytes: sanitizedBuffer.length,
      width,
      height,
      storageKey: fileName,
      isFlagged: mediaItem.isFlagged,
      flagReason: mediaItem.flagReason ?? null,
      status: "active",
      createdAt: new Date(now),
      expiresAt: new Date(expiresAt),
    });
  } catch (err) {
    console.warn("[Media Service] DB record write warning:", err);
  }

  return mediaItem;
}

/**
 * Synchronous authorization check from active in-memory registry.
 */
export function getAuthorizedMediaSync(
  mediaId: string,
  requestingSessionId?: string,
  isModerator = false
): MediaItem | null {
  const media = mediaRegistry.get(mediaId);
  if (!media) return null;
  if (media.status === "removed" || media.status === "expired") return null;
  if (isModerator) return media;
  if (!requestingSessionId) return null;
  if (!isSessionAuthorizedForRoom(media.roomId, requestingSessionId)) return null;
  return media;
}

/**
 * Authorizes and retrieves an image record.
 */
export async function getAuthorizedMedia(
  mediaId: string,
  requestingSessionId?: string,
  isModerator = false
): Promise<MediaItem | null> {
  let media = mediaRegistry.get(mediaId);

  // Fallback to database lookup if not found in memory
  if (!media) {
    const dbRecord = await getUploadedMediaRecord(mediaId);
    if (dbRecord) {
      const filePath = path.resolve(UPLOAD_DIR, dbRecord.storageKey);
      if (fs.existsSync(filePath)) {
        media = {
          id: dbRecord.id,
          roomId: dbRecord.roomId,
          uploaderSessionId: "",
          uploaderSessionHash: dbRecord.uploaderSessionHash,
          mimeType: dbRecord.mimeType,
          fileSizeBytes: dbRecord.fileSizeBytes,
          width: dbRecord.width ?? 0,
          height: dbRecord.height ?? 0,
          fileName: dbRecord.storageKey,
          filePath,
          createdAt: dbRecord.createdAt.getTime(),
          expiresAt: dbRecord.expiresAt ? dbRecord.expiresAt.getTime() : Date.now() + 3600_000,
          isFlagged: dbRecord.isFlagged,
          flagReason: dbRecord.flagReason ?? undefined,
          status: dbRecord.status,
        };
        mediaRegistry.set(mediaId, media);
      }
    }
  }

  if (!media) return null;
  if (media.status === "removed" || media.status === "expired") return null;

  // Moderators have access to any non-removed media
  if (isModerator) {
    return media;
  }

  // Participants must belong to the room the image was uploaded in
  if (!requestingSessionId) return null;
  if (!isSessionAuthorizedForRoom(media.roomId, requestingSessionId)) {
    return null;
  }

  return media;
}

/**
 * Flags and reports an image for moderation review.
 */
export async function reportMedia(
  mediaId: string,
  reportedBySessionId: string,
  reason: string
): Promise<boolean> {
  const media = mediaRegistry.get(mediaId);
  if (!media) return false;

  media.isFlagged = true;
  media.flagReason = reason;
  media.status = "reported";
  // Extend retention for moderation triage
  media.expiresAt = Date.now() + REPORTED_RETENTION_MS;

  try {
    await updateUploadedMediaStatus(mediaId, "reported");
  } catch (err) {
    console.warn("[Media Service] DB status update warning:", err);
  }

  return true;
}

/**
 * Removes an image immediately.
 */
export async function removeMedia(mediaId: string): Promise<boolean> {
  const media = mediaRegistry.get(mediaId);
  if (!media) return false;

  media.status = "removed";
  if (fs.existsSync(media.filePath)) {
    try {
      fs.unlinkSync(media.filePath);
    } catch (err) {
      console.warn("[Media Service] Unlink error:", err);
    }
  }

  try {
    await updateUploadedMediaStatus(mediaId, "removed");
  } catch (err) {
    console.warn("[Media Service] DB status update warning:", err);
  }

  return true;
}

/**
 * Cleans up expired media files.
 */
export function cleanupExpiredMedia() {
  const now = Date.now();
  for (const [id, item] of mediaRegistry.entries()) {
    if (now > item.expiresAt && item.status !== "reported") {
      item.status = "expired";
      if (fs.existsSync(item.filePath)) {
        try {
          fs.unlinkSync(item.filePath);
        } catch {}
      }
      mediaRegistry.delete(id);
    }
  }
}

// Run periodic cleanup every 5 minutes
setInterval(cleanupExpiredMedia, 5 * 60_000).unref();
