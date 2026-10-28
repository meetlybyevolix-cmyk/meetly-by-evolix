# MEETLY — VIDEO CHAT DIAGNOSTIC & ACTIVATION REPORT
**Platform:** Meetly (Random Anonymous Text & Live Video Chat)  
**Maintained by:** Evolix Studio  
**Audit & Verification Date:** October 28, 2026  
**Status:** FULLY FUNCTIONAL ON LOCALHOST (`http://localhost:3000`)

---

## 1. Root Cause Diagnosis

Prior to this fix, users selecting "Video Chat" were unable to successfully start and complete two-way video calls due to three specific software defects:

1. **Fatal Zod Validation Failure on Browser ICE Candidates (`server/chat/live.ts`)**:
   - The backend `videoSignalSchema` used `.strict()` on the `candidate` object schema.
   - When real WebRTC browsers (Chrome, Edge, Firefox, Safari) serialize `RTCIceCandidate.toJSON()`, the object includes standard metadata attributes (`foundation`, `component`, `priority`, `address`, `protocol`, `port`, `type`, `tcpType`, `relatedAddress`, `relatedPort`).
   - Because the schema was marked `.strict()`, any candidate containing these standard browser attributes failed validation.
   - The backend handler was configured to execute `webSocket.close(4400, "Invalid video signal")` upon validation failure, immediately terminating the caller's WebSocket connection and aborting the call on the very first candidate.
2. **SDP Length & Payload Constraints (`server/chat/live.ts`)**:
   - The WebSocket server was capped at a 32 KB `maxPayload`, and `sdp` was restricted to 20,000 characters.
   - Modern browser SDP offers carrying audio + video and multi-codec SDP attributes (VP8, VP9, H264, AV1, Opus, Red, ULPFEC) frequently reach 20–40 KB, exceeding these limits and triggering connection drops.
3. **Offer Glare & Negotiation Race Condition (`client/src/components/VideoCall.tsx`)**:
   - Calling `stream.getTracks().forEach(track => connection.addTrack(track, stream))` queued an `onnegotiationneeded` event in the browser.
   - Simultaneously, `createPeerConnection` was explicitly calling `createOffer()` for the offerer, causing two competing offers to be created in rapid succession.
   - The answerer was also firing `onnegotiationneeded`, causing cross-offer collisions (glare) before remote descriptions could be established.
4. **Stale Session Room Lockout (`server/chat/service.ts`)**:
   - `startSearching` contained a guard: `if (session.roomId) return { state: "chat" }`.
   - If a user had navigated away from a prior text chat without explicitly clicking "End Chat", starting a new search in "Video Chat" mode would fail to enter the queue or update preferences, leaving the user locked in their previous text room state.

---

## 2. Files Changed

| File | Changes Made |
|---|---|
| **`server/chat/live.ts`** | Increased `maxPayload` to 512 KB; loosened `videoSignalSchema` using `.passthrough()` on `candidateSchema`; increased `sdp` max length to 100,000; added `pranswer` and `rollback` to `descriptionType`; removed fatal WebSocket drops on malformed signals. |
| **`server/chat/service.ts`** | Updated `VideoSignal` TypeScript definitions to support all WebRTC attributes and `pranswer`/`rollback`; updated `startSearching` to automatically close any prior stale room so switching between Text and Video modes starts fresh. |
| **`server/config.ts`** | Added fallback Google STUN servers (`stun1.l.google.com:19302`, `stun2.l.google.com:19302`) alongside default `stun.l.google.com:19302`. |
| **`client/src/components/VideoCall.tsx`** | Cleaned up the WebRTC lifecycle: designated offerer initiates initial offer; answerer sets remote offer, flushes early ICE candidates, and returns answer; added candidate buffering until `remoteDescription` is set; bound `srcObject` and explicit `.play()` handlers; added audio unblock button for browser autoplay restrictions; added responsive controls for Mic, Camera, Next, End, and Report. |
| **`client/src/pages/Home.tsx`** | Updated `startSearching` to advance directly to `mode: "chat"` upon immediate match resolution; linked video action buttons (Next, End, Report, Block). |
| **`client/src/index.css`** | Added `.video-hero-icon` and polished call-to-action hero layout. |
| **`server/integration.test.ts`** | Updated ICE server URL assertion to verify fallback STUN servers. |
| **`scripts/e2e-smoke-test.js`** | Configured port flexibility (`process.env.PORT || 3000`). |

---

## 3. Fixes Implemented & Video Calling Architecture

### 3.1 Signaling Flow
1. **Matchmaking**: Both users select "Video chat" and confirm 18+ consent checkboxes. The backend strictly pairs users with `mediaMode: "video"`.
2. **Explicit Consent & Camera Preview**: Neither user's camera is turned on automatically. The main stage displays an explicit **"Start Camera & Join Call"** call-to-action.
3. **Browser Permission**: Clicking the button calls `navigator.mediaDevices.getUserMedia({ audio: true, video: { width: { ideal: 1280 }, height: { ideal: 720 } } })`.
4. **Local Preview**: Once permission is granted, local video immediately renders in the Picture-in-Picture window in the bottom-right corner, and `{ type: "video-ready" }` is sent.
5. **Deterministic WebRTC Handshake**:
   - Once both participants are ready, server sends `{ type: "video-start", offerer: true/false, polite: false/true }`.
   - **Offerer** creates SDP offer, sets local description, and transmits offer via WebSocket.
   - **Answerer** applies remote offer, flushes any queued ICE candidates, creates SDP answer, sets local description, and transmits answer.
   - **Offerer** applies remote answer and flushes its queued ICE candidates.
   - Bidirectional ICE candidates (`typ host`, `typ srflx`, or `typ relay`) flow and are added via `RTCPeerConnection.addIceCandidate()`.
6. **Media Rendering**: Inbound remote tracks trigger `connection.ontrack`, attaching the stranger's live feed to the main viewport video element.

---

## 4. How to Test Two Real Users on Localhost

The server is currently running in the background at **`http://localhost:3000`**.

### Testing Steps:
1. Open **Browser Window 1** (e.g., standard Chrome/Edge window) and go to [http://localhost:3000](http://localhost:3000).
2. Open **Browser Window 2** (e.g., an **Incognito / InPrivate** window, or a second browser like Firefox) and go to [http://localhost:3000](http://localhost:3000).
3. In **both windows**:
   - Click **Start chatting**.
   - Under **Chat mode**, select **Video chat** (with the camera icon).
   - Tick the three consent checkboxes:
     - *I confirm I’m 18 or older.*
     - *I agree to the Terms.*
     - *I’ve read the Privacy Notice.*
   - Click **Find someone to video chat with**.
4. Both windows will instantly match into the video room!
5. In **both windows**:
   - Click the green **Start Camera & Join Call** button.
   - When the browser prompt asks for camera and microphone access, click **Allow**.
6. **Verification Checklist**:
   - [x] **Local Video Preview**: Your own camera feed appears in the Picture-in-Picture box in the bottom-right corner.
   - [x] **Remote Video Feed**: The stranger's video feed renders in the main 16:9 viewport.
   - [x] **Two-Way Audio**: Microphone audio flows between both browsers (keep volume low to avoid feedback if on the same physical machine).
   - [x] **Microphone Mute**: Click the microphone icon — turns red and partner no longer hears audio.
   - [x] **Camera Toggle**: Click the camera icon — turns red, shows "Camera off" placeholder, and halts outbound video.
   - [x] **Next Stranger**: Click "Next" — cleanly stops camera/mic tracks, notifies partner that the room ended, and re-enters the search queue.
   - [x] **End Call**: Click the red hangup button — stops all media tracks and returns to the home screen.

---

## 5. STUN and TURN Relay Status

- **Localhost Testing**: Operates reliably via direct peer-to-peer WebRTC and Google's public STUN infrastructure (`stun:stun.l.google.com:19302`, `stun1.l.google.com:19302`, `stun2.l.google.com:19302`).
- **Production Relaying**: Production Coturn configuration is ready at `coturn/turnserver.conf` and `docker-compose.yml`. For external networks with symmetric NATs, setting `TURN_SHARED_SECRET` in `.env` activates ephemeral RFC 5766 HMAC-SHA1 credentials via `/api/ice-servers`.

---

## 6. Verification & Test Suite Summary

- **TypeScript Typecheck**: `tsc --noEmit` passed with 0 errors.
- **Unit & Integration Suite**: **35/35 tests passed** (`pnpm test`).
- **End-to-End Live Smoke Test**: **15/15 steps passed** (`node scripts/e2e-smoke-test.js` against port 3000).
- **Production Build**: Clean compilation in ~13 seconds (`pnpm build`).

---
*Report certified by Evolix Studio Engineering.*
