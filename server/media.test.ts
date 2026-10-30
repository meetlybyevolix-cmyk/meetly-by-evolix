import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createAnonymousSession,
  disconnectAll,
  getSession,
  sendChatMessage,
  startSearching,
  nextChat,
  blockAndLeave,
  subscribe,
  type ClientEvent,
} from "./chat/service";
import {
  validateAndSanitizeImage,
  saveUploadedImage,
  getAuthorizedMedia,
  getAuthorizedMediaSync,
  reportMedia,
  removeMedia,
  cleanupExpiredMedia,
  MAX_IMAGE_SIZE,
} from "./chat/media";

// Test Fixtures: Minimal valid image buffers
const validPngBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG Signature
  0x00, 0x00, 0x00, 0x0d, // IHDR chunk length (13)
  0x49, 0x48, 0x44, 0x52, // IHDR
  0x00, 0x00, 0x01, 0x00, // width: 256
  0x00, 0x00, 0x00, 0x80, // height: 128
  0x08, 0x02, 0x00, 0x00, 0x00,
  0x5a, 0x98, 0x58, 0xb6, // CRC
  0x00, 0x00, 0x00, 0x00, // IEND length
  0x49, 0x45, 0x4e, 0x44, // IEND
  0xae, 0x42, 0x60, 0x82, // CRC
]);

const validJpegBuffer = Buffer.from([
  0xff, 0xd8, // SOI
  0xff, 0xe0, 0x00, 0x10, // APP0 length 16
  0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  0xff, 0xc0, 0x00, 0x0b, // SOF0 length 11
  0x08, // precision
  0x00, 0xc8, // height: 200
  0x01, 0x40, // width: 320
  0x01, 0x01, 0x11, 0x00,
  0xff, 0xd9, // EOI
]);

const validWebpBuffer = Buffer.from([
  0x52, 0x49, 0x46, 0x46, // RIFF
  0x1e, 0x00, 0x00, 0x00, // size 30
  0x57, 0x45, 0x42, 0x50, // WEBP
  0x56, 0x50, 0x38, 0x58, // VP8X
  0x0a, 0x00, 0x00, 0x00, // chunk size 10
  0x00, 0x00, 0x00, 0x00, // flags
  0x3f, 0x01, 0x00, // canvas width - 1 = 319 -> 320
  0xef, 0x00, 0x00, // canvas height - 1 = 239 -> 240
  0x00, 0x00, 0x00, 0x00,
]);

describe("Feature 5: Photo Sending in Chat Security & Functionality Suite", () => {
  beforeEach(() => {
    disconnectAll();
  });

  afterEach(() => {
    disconnectAll();
  });

  describe("1. Image Validation & File Type Safety", () => {
    it("validates and accepts legitimate PNG, JPEG, and WebP images", () => {
      const pngResult = validateAndSanitizeImage(validPngBuffer);
      expect(pngResult.mimeType).toBe("image/png");
      expect(pngResult.width).toBe(256);
      expect(pngResult.height).toBe(128);

      const jpegResult = validateAndSanitizeImage(validJpegBuffer);
      expect(jpegResult.mimeType).toBe("image/jpeg");
      expect(jpegResult.width).toBe(320);
      expect(jpegResult.height).toBe(200);

      const webpResult = validateAndSanitizeImage(validWebpBuffer);
      expect(webpResult.mimeType).toBe("image/webp");
      expect(webpResult.width).toBe(320);
      expect(webpResult.height).toBe(240);
    });

    it("strictly rejects executable, script, and non-image file types", () => {
      // SVG (can execute scripts/XSS)
      const svgBuffer = Buffer.from("<svg onload='alert(1)'><circle/></svg>");
      expect(() => validateAndSanitizeImage(svgBuffer)).toThrow(
        /Only JPEG, PNG, and WebP images are supported/
      );

      // PDF
      const pdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj");
      expect(() => validateAndSanitizeImage(pdfBuffer)).toThrow(
        /Only JPEG, PNG, and WebP images are supported/
      );

      // Windows executable (MZ header)
      const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03]);
      expect(() => validateAndSanitizeImage(exeBuffer)).toThrow(
        /Only JPEG, PNG, and WebP images are supported/
      );

      // Plain text file
      const textBuffer = Buffer.from("Hello, this is just a text file.");
      expect(() => validateAndSanitizeImage(textBuffer)).toThrow(
        /Only JPEG, PNG, and WebP images are supported/
      );

      // HTML file
      const htmlBuffer = Buffer.from("<!DOCTYPE html><html><body>Test</body></html>");
      expect(() => validateAndSanitizeImage(htmlBuffer)).toThrow(
        /Only JPEG, PNG, and WebP images are supported/
      );
    });

    it("rejects oversized images exceeding the 5MB maximum limit", () => {
      // 5MB + 1 byte
      const oversizedBuffer = Buffer.alloc(MAX_IMAGE_SIZE + 1024);
      // Put PNG header
      oversizedBuffer[0] = 0x89;
      oversizedBuffer[1] = 0x50;
      oversizedBuffer[2] = 0x4e;
      oversizedBuffer[3] = 0x47;

      expect(() => validateAndSanitizeImage(oversizedBuffer)).toThrow(
        /Image must be 5MB or smaller/
      );
    });
  });

  describe("2. Metadata & Privacy EXIF Stripping", () => {
    it("strips APP1 EXIF/GPS metadata segments from JPEG files", () => {
      // Create JPEG with an APP1 segment containing fake EXIF GPS
      const exifPayload = Buffer.from("Exif\0\0GPS:lat=28.6139,lon=77.2090");
      const app1Segment = Buffer.concat([
        Buffer.from([0xff, 0xe1]),
        Buffer.alloc(2), // length placeholder
        exifPayload,
      ]);
      app1Segment.writeUInt16BE(2 + exifPayload.length, 2);

      const jpegWithExif = Buffer.concat([
        Buffer.from([0xff, 0xd8]), // SOI
        app1Segment,
        validJpegBuffer.subarray(2), // Rest of valid JPEG
      ]);

      expect(jpegWithExif.includes(Buffer.from("GPS:lat"))).toBe(true);

      const sanitized = validateAndSanitizeImage(jpegWithExif);
      expect(sanitized.sanitizedBuffer.includes(Buffer.from("GPS:lat"))).toBe(false);
      expect(sanitized.width).toBe(320);
      expect(sanitized.height).toBe(200);
    });

    it("strips textual and auxiliary metadata chunks from PNG files", () => {
      const textChunkData = Buffer.from("Author\0Confidential User");
      const textChunk = Buffer.concat([
        Buffer.alloc(4), // length
        Buffer.from("tEXt"),
        textChunkData,
        Buffer.alloc(4), // CRC
      ]);
      textChunk.writeUInt32BE(textChunkData.length, 0);

      const pngWithText = Buffer.concat([
        validPngBuffer.subarray(0, 33), // Through IHDR
        textChunk,
        validPngBuffer.subarray(33), // IEND
      ]);

      expect(pngWithText.includes(Buffer.from("Confidential User"))).toBe(true);

      const sanitized = validateAndSanitizeImage(pngWithText);
      expect(sanitized.sanitizedBuffer.includes(Buffer.from("Confidential User"))).toBe(false);
      expect(sanitized.width).toBe(256);
      expect(sanitized.height).toBe(128);
    });
  });

  describe("3. Upload Authorization & Room Isolation (IDOR Protection)", () => {
    it("rejects image uploads when user is not inside an active chat room", async () => {
      const session = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      });
      const s = getSession(session.token)!;

      // User state is "idle", not "chat"
      await expect(saveUploadedImage(s, validPngBuffer)).rejects.toThrow(
        /Photos can only be shared during an active conversation/
      );
    });

    it("enforces room authorization and prevents cross-room image leakage", async () => {
      // Room 1: Alice & Bob
      const alice = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      });
      const bob = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      });
      const aliceSession = getSession(alice.token)!;
      const bobSession = getSession(bob.token)!;
      startSearching(aliceSession);
      startSearching(bobSession);
      expect(aliceSession.state).toBe("chat");

      // Room 2: Charlie & Dave
      const charlie = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      });
      const dave = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      });
      const charlieSession = getSession(charlie.token)!;
      const daveSession = getSession(dave.token)!;
      startSearching(charlieSession);
      startSearching(daveSession);
      expect(charlieSession.state).toBe("chat");

      // Alice uploads a photo in Room 1
      const media = await saveUploadedImage(aliceSession, validPngBuffer);
      expect(media.id).toBeDefined();

      // Alice and Bob (participants of Room 1) can access the photo
      const aliceAccess = await getAuthorizedMedia(media.id, aliceSession.id);
      expect(aliceAccess).not.toBeNull();
      expect(aliceAccess?.id).toBe(media.id);

      const bobAccess = await getAuthorizedMedia(media.id, bobSession.id);
      expect(bobAccess).not.toBeNull();
      expect(bobAccess?.id).toBe(media.id);

      // Charlie and Dave (from Room 2) MUST be denied access (Preventing IDOR)
      const charlieAccess = await getAuthorizedMedia(media.id, charlieSession.id);
      expect(charlieAccess).toBeNull();

      const daveAccess = await getAuthorizedMedia(media.id, daveSession.id);
      expect(daveAccess).toBeNull();

      // Unauthenticated access MUST be denied
      const unauthAccess = await getAuthorizedMedia(media.id, undefined);
      expect(unauthAccess).toBeNull();

      // Moderator access is permitted
      const modAccess = await getAuthorizedMedia(media.id, undefined, true);
      expect(modAccess).not.toBeNull();
      expect(modAccess?.id).toBe(media.id);
    });
  });

  describe("4. End-to-End Chat Delivery (Text & Video Side Chat)", () => {
    it("delivers photos with captions in text chat rooms in real-time", async () => {
      const u1 = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      });
      const u2 = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      });
      const s1 = getSession(u1.token)!;
      const s2 = getSession(u2.token)!;
      startSearching(s1);
      startSearching(s2);

      const s2Events: ClientEvent[] = [];
      subscribe(s2.id, e => s2Events.push(e));

      // User 1 uploads photo and sends chat message referencing it
      const media = await saveUploadedImage(s1, validJpegBuffer);
      sendChatMessage(s1, "Here is a view from my window!", media.id);

      // User 2 receives message event with media attachment
      const messageEvent = s2Events.find(e => e.type === "message") as
        | { type: "message"; message: { text: string; media?: { id: string; url: string } } }
        | undefined;

      expect(messageEvent).toBeDefined();
      expect(messageEvent?.message.text).toBe("Here is a view from my window!");
      expect(messageEvent?.message.media?.id).toBe(media.id);
      expect(messageEvent?.message.media?.url).toContain(`/api/chat/media/${media.id}`);
    });

    it("delivers photos in video-mode rooms with side chat", async () => {
      const u1 = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "video" },
      });
      const u2 = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "video" },
      });
      const s1 = getSession(u1.token)!;
      const s2 = getSession(u2.token)!;
      startSearching(s1);
      startSearching(s2);

      const s2Events: ClientEvent[] = [];
      subscribe(s2.id, e => s2Events.push(e));

      const media = await saveUploadedImage(s1, validWebpBuffer);
      sendChatMessage(s1, "", media.id); // Image without text caption

      const messageEvent = s2Events.find(e => e.type === "message") as
        | { type: "message"; message: { text: string; media?: { id: string; url: string } } }
        | undefined;

      expect(messageEvent).toBeDefined();
      expect(messageEvent?.message.media?.id).toBe(media.id);
    });

    it("cleans up messages and isolates sessions on Next Stranger", async () => {
      const u1 = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      });
      const u2 = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      });
      const s1 = getSession(u1.token)!;
      const s2 = getSession(u2.token)!;
      startSearching(s1);
      startSearching(s2);

      const media = await saveUploadedImage(s1, validPngBuffer);
      sendChatMessage(s1, "Photo in Room 1", media.id);

      // Next Stranger terminates room
      nextChat(s1);
      expect(s1.state).toBe("searching");
      expect(s2.state).toBe("idle");
    });

    it("terminates conversation and prevents further messaging when user blocks stranger", async () => {
      const u1 = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      });
      const u2 = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      });
      const s1 = getSession(u1.token)!;
      const s2 = getSession(u2.token)!;
      startSearching(s1);
      startSearching(s2);

      blockAndLeave(s1);
      expect(s1.blocked.has(s2.id)).toBe(true);
      expect(s1.state).toBe("idle");
      expect(s2.state).toBe("idle");
    });
  });

  describe("5. Upload Rate Limiting & Abuse Protection", () => {
    it("enforces session upload rate limits (max 5 uploads per minute)", async () => {
      const u1 = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      });
      const u2 = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      });
      const s1 = getSession(u1.token)!;
      const s2 = getSession(u2.token)!;
      startSearching(s1);
      startSearching(s2);

      // Perform 5 valid uploads in quick succession
      for (let i = 0; i < 5; i++) {
        await saveUploadedImage(s1, validPngBuffer);
      }

      // 6th upload within the minute window MUST be rejected
      await expect(saveUploadedImage(s1, validPngBuffer)).rejects.toThrow(
        /Upload rate limit reached/
      );
    });
  });

  describe("6. Flagged Image Moderation Flow", () => {
    it("flags reported media and retains it for operator moderation triage", async () => {
      const u1 = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      });
      const u2 = createAnonymousSession({
        ageConfirmed: true,
        termsAccepted: true,
        privacyAccepted: true,
        preferences: { interests: [], language: "Any", mediaMode: "text" },
      });
      const s1 = getSession(u1.token)!;
      const s2 = getSession(u2.token)!;
      startSearching(s1);
      startSearching(s2);

      const media = await saveUploadedImage(s1, validJpegBuffer);
      expect(media.status).toBe("active");

      // User 2 reports the image for inappropriate content
      const reported = await reportMedia(media.id, s2.id, "Explicit content violation");
      expect(reported).toBe(true);

      const updatedMedia = await getAuthorizedMedia(media.id, s1.id);
      expect(updatedMedia?.status).toBe("reported");
      expect(updatedMedia?.isFlagged).toBe(true);
      expect(updatedMedia?.flagReason).toBe("Explicit content violation");

      // Moderator retains visibility
      const modView = await getAuthorizedMedia(media.id, undefined, true);
      expect(modView?.status).toBe("reported");
    });
  });
});

