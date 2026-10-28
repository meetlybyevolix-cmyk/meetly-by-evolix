import { Camera, CameraOff, Mic, MicOff, ShieldAlert, Video, VideoOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type VideoSignal =
  | { kind: "description"; descriptionType: "offer" | "answer"; sdp: string }
  | { kind: "candidate"; candidate: RTCIceCandidateInit };
type VideoEvent =
  | { type: "video-status"; readyCount: number; active: boolean }
  | { type: "video-start"; offerer: boolean }
  | { type: "video-signal"; signal: VideoSignal }
  | { type: "video-stopped"; message: string }
  | { type: "video-error"; message: string };
type CallState = "idle" | "requesting" | "waiting" | "connecting" | "active";

export default function VideoCall({ socket }: { socket: WebSocket | null }) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [readyCount, setReadyCount] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [message, setMessage] = useState("");
  const [needsPlayback, setNeedsPlayback] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingSignalsRef = useRef<VideoSignal[]>([]);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const permissionRequestRef = useRef(0);

  const sendControl = useCallback((payload: Record<string, unknown>) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(payload));
    return true;
  }, [socket]);

  const stopLocalMedia = useCallback((updateState = true) => {
    permissionRequestRef.current += 1;
    const connection = peerConnectionRef.current;
    peerConnectionRef.current = null;
    if (connection) {
      connection.ontrack = null;
      connection.onicecandidate = null;
      connection.onconnectionstatechange = null;
      connection.close();
    }
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    remoteStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    pendingSignalsRef.current = [];
    pendingIceRef.current = [];
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (updateState) {
      setLocalStream(null);
      setRemoteStream(null);
      setCallState("idle");
      setCameraEnabled(true);
      setMicEnabled(true);
      setNeedsPlayback(false);
    }
  }, []);

  const applySignal = useCallback(async (signal: VideoSignal) => {
    const connection = peerConnectionRef.current;
    if (!connection) {
      pendingSignalsRef.current.push(signal);
      return;
    }
    try {
      if (signal.kind === "candidate") {
        if (connection.remoteDescription) await connection.addIceCandidate(signal.candidate);
        else pendingIceRef.current.push(signal.candidate);
        return;
      }
      await connection.setRemoteDescription({ type: signal.descriptionType, sdp: signal.sdp });
      if (signal.descriptionType === "offer") {
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        if (!sendControl({ type: "video-signal", signal: { kind: "description", descriptionType: "answer", sdp: connection.localDescription?.sdp ?? answer.sdp } })) {
          throw new Error("Your signaling connection was interrupted.");
        }
      }
      const bufferedCandidates = pendingIceRef.current.splice(0);
      for (const candidate of bufferedCandidates) await connection.addIceCandidate(candidate);
    } catch {
      setMessage("The video connection could not be negotiated. End video and try again, or continue by text.");
    }
  }, [sendControl]);

  const createPeerConnection = useCallback(async (offerer: boolean) => {
    if (peerConnectionRef.current) return;
    const stream = localStreamRef.current;
    if (!stream) {
      setMessage("Allow camera and microphone access before joining video.");
      sendControl({ type: "video-decline" });
      return;
    }
    try {
      const connection = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      peerConnectionRef.current = connection;
      stream.getTracks().forEach(track => connection.addTrack(track, stream));
      connection.ontrack = event => {
        const incoming = event.streams[0] ?? new MediaStream([event.track]);
        remoteStreamRef.current = incoming;
        setRemoteStream(incoming);
        setCallState("active");
      };
      connection.onicecandidate = event => {
        if (event.candidate) sendControl({ type: "video-signal", signal: { kind: "candidate", candidate: event.candidate.toJSON() } });
      };
      connection.onconnectionstatechange = () => {
        if (connection.connectionState === "connected") setCallState("active");
        if (connection.connectionState === "failed") {
          sendControl({ type: "video-stop" });
          stopLocalMedia();
          setMessage("A direct video connection could not be established on this network. Your camera and microphone are off; you can keep chatting by text.");
        }
      };
      setCallState("connecting");
      const queued = pendingSignalsRef.current.splice(0);
      for (const signal of queued) await applySignal(signal);
      if (offerer) {
        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);
        if (!sendControl({ type: "video-signal", signal: { kind: "description", descriptionType: "offer", sdp: connection.localDescription?.sdp ?? offer.sdp } })) {
          throw new Error("Your signaling connection was interrupted.");
        }
      }
    } catch {
      sendControl({ type: "video-stop" });
      stopLocalMedia();
      setMessage("Video could not connect. Your camera and microphone are off; continue by text or try again.");
    }
  }, [applySignal, sendControl, stopLocalMedia]);

  useEffect(() => {
    if (!socket) {
      if (localStreamRef.current || peerConnectionRef.current) stopLocalMedia();
      return;
    }
    const onMessage = (event: MessageEvent) => {
      let update: VideoEvent;
      try { update = JSON.parse(String(event.data)) as VideoEvent; }
      catch { return; }
      if (!update || typeof update !== "object" || !update.type?.startsWith("video-")) return;
      if (update.type === "video-status") {
        setReadyCount(update.readyCount);
        if (update.active) setCallState(current => current === "waiting" ? "connecting" : current);
      } else if (update.type === "video-start") {
        setMessage("");
        void createPeerConnection(update.offerer);
      } else if (update.type === "video-signal") {
        void applySignal(update.signal);
      } else if (update.type === "video-stopped") {
        stopLocalMedia();
        setReadyCount(0);
        setMessage(update.message || "Video stopped. The text conversation is still available.");
      } else if (update.type === "video-error") {
        setMessage(update.message);
      }
    };
    const onClose = () => {
      stopLocalMedia();
      setReadyCount(0);
      setMessage("The chat connection ended. Your camera and microphone are off.");
    };
    socket.addEventListener("message", onMessage);
    socket.addEventListener("close", onClose);
    return () => {
      socket.removeEventListener("message", onMessage);
      socket.removeEventListener("close", onClose);
      if (localStreamRef.current || peerConnectionRef.current) {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "video-stop" }));
        stopLocalMedia(false);
      }
    };
  }, [applySignal, createPeerConnection, socket, stopLocalMedia]);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);
  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      if (remoteStream) remoteVideoRef.current.play().then(() => setNeedsPlayback(false)).catch(() => setNeedsPlayback(true));
    }
  }, [remoteStream]);

  const joinVideo = async () => {
    if (callState === "requesting" || callState === "waiting" || callState === "connecting" || callState === "active") return;
    setMessage("");
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setMessage("The private chat connection is not ready yet. Please wait a moment and try again.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("This browser cannot access camera and microphone here. Use a supported browser over HTTPS or continue by text.");
      return;
    }
    const requestId = ++permissionRequestRef.current;
    setCallState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (permissionRequestRef.current !== requestId) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCameraEnabled(stream.getVideoTracks().some(track => track.enabled));
      setMicEnabled(stream.getAudioTracks().some(track => track.enabled));
      if (!sendControl({ type: "video-ready" })) throw new Error("The private chat connection was interrupted before video consent could be shared.");
      setCallState("waiting");
    } catch (error) {
      sendControl({ type: "video-decline" });
      stopLocalMedia();
      setMessage(error instanceof Error && /denied|permission|notallowed/i.test(error.message)
        ? "Camera or microphone permission was denied. Your text chat remains available."
        : error instanceof Error ? error.message : "Camera and microphone access failed. Continue by text or try again.");
    }
  };

  const endVideo = () => {
    sendControl({ type: "video-stop" });
    stopLocalMedia();
    setReadyCount(0);
    setMessage("Video stopped. The text conversation is still available.");
  };

  const stayWithText = () => {
    sendControl({ type: "video-decline" });
    stopLocalMedia();
    setReadyCount(0);
    setMessage("You chose to stay with text. You can opt in to video later if both people agree.");
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraEnabled(track.enabled);
  };
  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicEnabled(track.enabled);
  };

  const partnerReady = readyCount > 0 && callState === "idle";
  const waitingForPartner = callState === "waiting";
  const callActive = callState === "active" || callState === "connecting";

  return <section className="video-call-panel" aria-label="Optional video chat">
    <div className="video-call-heading"><div className="video-title-icon"><Video size={17} /></div><div><strong>Optional video chat</strong><span>Both people must choose to join before media is sent.</span></div><span className="video-prototype-badge">No recording</span></div>
    <div className="video-privacy-warning" role="note"><ShieldAlert size={17} /><p><strong>Read before joining:</strong> This direct WebRTC connection uses Google's public STUN service, not a privacy relay. The other person and STUN provider may learn your network IP; some networks will not connect. Your camera preview stays on your device until both people opt in. Meetly does not record or store call media, but the other person could capture their screen. Age is self-attested, and staffed media moderation is not available.</p></div>
    <div className="video-stage-grid">
      <div className={`video-stage ${localStream ? "has-video" : ""}`}>
        {localStream ? <video ref={localVideoRef} autoPlay playsInline muted aria-label="Your local camera preview" /> : <div className="video-placeholder"><Camera size={24} /><span>Your camera stays off until you choose Join video.</span></div>}
        <span className="video-stage-label">You · local preview</span>
      </div>
      <div className={`video-stage ${remoteStream ? "has-video" : ""}`}>
        {remoteStream ? <video ref={remoteVideoRef} autoPlay playsInline aria-label="Your chat partner's live video" /> : <div className="video-placeholder"><Video size={24} /><span>{partnerReady ? "Your partner is ready if you choose to join." : "Your partner’s video appears only after you both opt in."}</span></div>}
        <span className="video-stage-label">Someone new</span>
      </div>
    </div>
    {needsPlayback && <button className="video-playback-button" onClick={() => { void remoteVideoRef.current?.play().then(() => setNeedsPlayback(false)).catch(() => setMessage("Tap to enable audio from your chat partner.")); }}>Enable call audio</button>}
    {message && <div className="video-call-message" role="status">{message}</div>}
    <div className="video-call-actions" aria-live="polite">
      {callState === "idle" && <>
        <span className="video-partner-state">{partnerReady ? "Your partner is ready; video still needs your consent." : "Text chat continues unless you both opt in."}</span>
        <div className="video-action-buttons"><button className="button button-primary" onClick={() => void joinVideo()}><Video size={15} />Join video</button><button className="button button-secondary" onClick={stayWithText}>Stay with text</button></div>
      </>}
      {callState === "requesting" && <span className="video-partner-state" role="status">Waiting for browser camera and microphone permission…</span>}
      {waitingForPartner && <><span className="video-partner-state" role="status">Your local preview is ready. Audio/video is not sent until the other person opts in.</span><button className="button button-secondary" onClick={endVideo}>Cancel video</button></>}
      {callActive && <><span className="video-partner-state" role="status">{callState === "active" ? "Video connected · direct peer connection" : "Setting up a direct connection…"}</span><div className="video-action-buttons"><button className="toolbar-button" onClick={toggleCamera} aria-pressed={!cameraEnabled}>{cameraEnabled ? <Camera size={15} /> : <CameraOff size={15} />}{cameraEnabled ? "Camera on" : "Camera off"}</button><button className="toolbar-button" onClick={toggleMic} aria-pressed={!micEnabled}>{micEnabled ? <Mic size={15} /> : <MicOff size={15} />}{micEnabled ? "Mic on" : "Mic muted"}</button><button className="button button-secondary" onClick={endVideo}><VideoOff size={15} />End video</button></div></>}
    </div>
  </section>;
}
