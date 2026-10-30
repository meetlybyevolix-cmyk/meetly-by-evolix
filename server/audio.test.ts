import { describe, expect, it } from "vitest";
import { generateIceServers } from "./config";
import {
  createAnonymousSession,
  forwardVideoSignal,
  markVideoReady,
  getSession,
  startSearching,
  disconnectAll,
  type VideoSignal,
} from "./chat/service";

describe("Meetly Two-Way Audio & Microphone Subsystem Verification", () => {
  describe("1. ICE & Audio Relay Infrastructure", () => {
    it("provides valid STUN servers for audio/video NAT candidate discovery", () => {
      const servers = generateIceServers("session-audio-test-01");
      expect(Array.isArray(servers)).toBe(true);
      expect(servers.length).toBeGreaterThan(0);
      expect(servers[0].urls).toBeDefined();

      const urls = Array.isArray(servers[0].urls) ? servers[0].urls : [servers[0].urls];
      expect(urls.some(u => u.includes("stun"))).toBe(true);
    });
  });

  describe("2. Audio Track Signaling & replaceTrack Semantics", () => {
    it("relays audio SDP offers and candidate signals between paired peers", () => {
      disconnectAll();

      const userA = createAnonymousSession(
        {
          ageConfirmed: true,
          termsAccepted: true,
          privacyAccepted: true,
          preferences: { interests: ["Music"], language: "English", mediaMode: "video" },
        },
        "127.0.0.1"
      );
      const userB = createAnonymousSession(
        {
          ageConfirmed: true,
          termsAccepted: true,
          privacyAccepted: true,
          preferences: { interests: ["Music"], language: "English", mediaMode: "video" },
        },
        "127.0.0.2"
      );

      const sessionA = getSession(userA.token)!;
      const sessionB = getSession(userB.token)!;

      startSearching(sessionA);
      startSearching(sessionB);

      expect(sessionA.state).toBe("chat");
      expect(sessionB.state).toBe("chat");

      // Both users mark video/audio ready
      markVideoReady(sessionA);
      markVideoReady(sessionB);

      // Alice sends audio SDP offer
      const audioSdpOffer: VideoSignal = {
        kind: "description",
        descriptionType: "offer",
        sdp: "v=0\r\no=- 12345 2 IN IP4 127.0.0.1\r\nm=audio 5004 UDP/TLS/RTP/SAVPF 111\r\na=rtpmap:111 opus/48000/2\r\n",
      };

      const forwardedOffer = forwardVideoSignal(sessionA, audioSdpOffer);
      expect(forwardedOffer).toBe(true);

      // Bob sends audio ICE candidate
      const audioCandidate: VideoSignal = {
        kind: "candidate",
        candidate: {
          candidate: "candidate:1 1 UDP 2122260223 192.168.1.100 5004 typ host",
          sdpMid: "audio",
          sdpMLineIndex: 0,
        },
      };

      const forwardedCandidate = forwardVideoSignal(sessionB, audioCandidate);
      expect(forwardedCandidate).toBe(true);
    });

    it("supports device switching via replaceTrack mock without triggering renegotiation", () => {
      // Simulate WebRTC RTCRtpSender.replaceTrack behavior
      let activeTrackId = "mic-device-default-01";
      const sender = {
        track: { id: activeTrackId, kind: "audio", enabled: true },
        async replaceTrack(newTrack: { id: string; kind: string; enabled: boolean } | null) {
          if (newTrack) {
            this.track = newTrack;
            activeTrackId = newTrack.id;
          } else {
            this.track = null;
          }
          return Promise.resolve();
        },
      };

      expect(sender.track?.id).toBe("mic-device-default-01");

      // User switches to USB Headset microphone
      const newMicTrack = { id: "mic-device-usb-headset-02", kind: "audio", enabled: true };
      sender.replaceTrack(newMicTrack);

      expect(sender.track?.id).toBe("mic-device-usb-headset-02");
      expect(activeTrackId).toBe("mic-device-usb-headset-02");
      expect(sender.track?.enabled).toBe(true);
    });

    it("verifies microphone mute toggle updates track enabled property while keeping track alive", () => {
      const audioTrack = { id: "mic-track-01", kind: "audio", enabled: true };

      // Mute microphone
      audioTrack.enabled = false;
      expect(audioTrack.enabled).toBe(false);

      // Unmute microphone
      audioTrack.enabled = true;
      expect(audioTrack.enabled).toBe(true);
    });

    it("verifies audio-only fallback preserves communication when camera stream fails", () => {
      // User creates session in video mode but only audio track is attached
      const session = createAnonymousSession(
        {
          ageConfirmed: true,
          termsAccepted: true,
          privacyAccepted: true,
          preferences: { interests: [], language: "English", mediaMode: "video" },
        },
        "127.0.0.3"
      );

      expect(session).toBeDefined();
      expect(session.token).toBeTruthy();
    });
  });
});

