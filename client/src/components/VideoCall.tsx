import {
  Camera,
  CameraOff,
  Flag,
  Mic,
  MicOff,
  PhoneOff,
  ShieldAlert,
  SkipForward,
  Video,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type VideoSignal =
  | { kind: "description"; descriptionType: "offer" | "answer" | "rollback"; sdp: string }
  | { kind: "candidate"; candidate: RTCIceCandidateInit };

export type VideoEvent =
  | { type: "video-status"; readyCount: number; active: boolean }
  | { type: "video-start"; offerer: boolean; polite?: boolean }
  | { type: "video-signal"; signal: VideoSignal }
  | { type: "video-stopped"; message: string }
  | { type: "video-error"; message: string };

export type CallState = "idle" | "requesting" | "waiting" | "connecting" | "active";

export interface VideoCallProps {
  socket: WebSocket | null;
  onNext?: () => void;
  onEnd?: () => void;
  onReport?: () => void;
  onBlock?: () => void;
}

export default function VideoCall({
  socket,
  onNext,
  onEnd,
  onReport,
}: VideoCallProps) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [readyCount, setReadyCount] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [message, setMessage] = useState("");
  const [connectionType, setConnectionType] = useState<string>("Negotiating...");
  const [needsPlayback, setNeedsPlayback] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const permissionRequestRef = useRef(0);

  // W3C Perfect Negotiation state references
  const politeRef = useRef<boolean>(false);
  const makingOfferRef = useRef<boolean>(false);
  const ignoreOfferRef = useRef<boolean>(false);
  const isSettingRemoteAnswerPendingRef = useRef<boolean>(false);

  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: "stun:stun.l.google.com:19302" },
  ]);

  // Fetch dynamic ICE configuration (STUN + Ephemeral Coturn TURN credentials)
  useEffect(() => {
    fetch("/api/ice-servers")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
          iceServersRef.current = data.iceServers;
        }
      })
      .catch(() => {
        // Default STUN server remains active
      });
  }, []);

  const sendControl = useCallback(
    (payload: Record<string, unknown>) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return false;
      socket.send(JSON.stringify(payload));
      return true;
    },
    [socket]
  );

  const stopLocalMedia = useCallback((updateState = true) => {
    permissionRequestRef.current += 1;
    const connection = peerConnectionRef.current;
    peerConnectionRef.current = null;
    if (connection) {
      connection.ontrack = null;
      connection.onicecandidate = null;
      connection.onconnectionstatechange = null;
      connection.oniceconnectionstatechange = null;
      connection.onnegotiationneeded = null;
      connection.close();
    }
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    remoteStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    pendingIceRef.current = [];
    makingOfferRef.current = false;
    ignoreOfferRef.current = false;
    isSettingRemoteAnswerPendingRef.current = false;

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    if (updateState) {
      setLocalStream(null);
      setRemoteStream(null);
      setCallState("idle");
      setCameraEnabled(true);
      setMicEnabled(true);
      setNeedsPlayback(false);
      setConnectionType("Negotiating...");
    }
  }, []);

  // Inspect WebRTC stats to determine if connection is direct (P2P) or relayed (TURN)
  const inspectConnectionType = useCallback(async (connection: RTCPeerConnection) => {
    try {
      const stats = await connection.getStats();
      let relayed = false;
      stats.forEach(report => {
        if (report.type === "candidate-pair" && report.state === "succeeded") {
          const localCand = stats.get(report.localCandidateId);
          const remoteCand = stats.get(report.remoteCandidateId);
          if (localCand?.candidateType === "relay" || remoteCand?.candidateType === "relay") {
            relayed = true;
          }
        }
      });
      setConnectionType(relayed ? "Relayed (TURN)" : "Direct (P2P)");
    } catch {
      setConnectionType("Active P2P");
    }
  }, []);

  // Apply incoming WebRTC signaling with Perfect Negotiation glare handling
  const applySignal = useCallback(
    async (signal: VideoSignal) => {
      const connection = peerConnectionRef.current;
      if (!connection) return;

      try {
        if (signal.kind === "candidate") {
          try {
            if (connection.remoteDescription) {
              await connection.addIceCandidate(signal.candidate);
            } else {
              pendingIceRef.current.push(signal.candidate);
            }
          } catch (err) {
            if (!ignoreOfferRef.current) {
              console.warn("[WebRTC] ICE candidate error:", err);
            }
          }
          return;
        }

        // Description handling (Offer / Answer / Rollback)
        const description: RTCSessionDescriptionInit = {
          type: signal.descriptionType as RTCSdpType,
          sdp: signal.sdp,
        };

        const readyForOffer =
          !makingOfferRef.current &&
          (connection.signalingState === "stable" ||
            isSettingRemoteAnswerPendingRef.current);
        const offerCollision = description.type === "offer" && !readyForOffer;

        ignoreOfferRef.current = !politeRef.current && offerCollision;
        if (ignoreOfferRef.current) {
          console.info("[WebRTC] Glare detected: impolite peer ignoring colliding offer");
          return;
        }

        isSettingRemoteAnswerPendingRef.current = description.type === "answer";
        await connection.setRemoteDescription(description);
        isSettingRemoteAnswerPendingRef.current = false;

        if (description.type === "offer") {
          await connection.setLocalDescription();
          if (
            !sendControl({
              type: "video-signal",
              signal: {
                kind: "description",
                descriptionType: connection.localDescription!.type,
                sdp: connection.localDescription!.sdp,
              },
            })
          ) {
            throw new Error("Signaling interrupted while sending answer.");
          }
        }

        // Flush buffered ICE candidates
        const buffered = pendingIceRef.current.splice(0);
        for (const candidate of buffered) {
          try {
            await connection.addIceCandidate(candidate);
          } catch (e) {
            if (!ignoreOfferRef.current) {
              console.warn("[WebRTC] Buffered candidate error:", e);
            }
          }
        }
      } catch (error) {
        console.error("[WebRTC] Signaling apply error:", error);
        setMessage(
          "Video signaling encountered an interruption. End video and try again, or continue by text."
        );
      }
    },
    [sendControl]
  );

  // Initialize peer connection with W3C Perfect Negotiation
  const createPeerConnection = useCallback(
    async (offerer: boolean, polite: boolean) => {
      if (peerConnectionRef.current) return;
      const stream = localStreamRef.current;
      if (!stream) {
        setMessage("Allow camera and microphone access before joining video.");
        sendControl({ type: "video-decline" });
        return;
      }

      politeRef.current = polite;
      makingOfferRef.current = false;
      ignoreOfferRef.current = false;
      isSettingRemoteAnswerPendingRef.current = false;

      try {
        const connection = new RTCPeerConnection({
          iceServers: iceServersRef.current,
        });
        peerConnectionRef.current = connection;

        // Add local tracks to peer connection
        stream.getTracks().forEach(track => connection.addTrack(track, stream));

        // Inbound tracks from stranger
        connection.ontrack = event => {
          const incoming = event.streams[0] ?? new MediaStream([event.track]);
          remoteStreamRef.current = incoming;
          setRemoteStream(incoming);
          setCallState("active");
          void inspectConnectionType(connection);
        };

        // Outbound ICE candidates
        connection.onicecandidate = event => {
          if (event.candidate) {
            sendControl({
              type: "video-signal",
              signal: {
                kind: "candidate",
                candidate: event.candidate.toJSON(),
              },
            });
          }
        };

        // W3C Perfect Negotiation: onnegotiationneeded
        connection.onnegotiationneeded = async () => {
          try {
            makingOfferRef.current = true;
            await connection.setLocalDescription();
            sendControl({
              type: "video-signal",
              signal: {
                kind: "description",
                descriptionType: connection.localDescription!.type,
                sdp: connection.localDescription!.sdp,
              },
            });
          } catch (err) {
            console.error("[WebRTC] Negotiation needed error:", err);
          } finally {
            makingOfferRef.current = false;
          }
        };

        // Connection state monitoring
        connection.onconnectionstatechange = () => {
          const state = connection.connectionState;
          if (state === "connected") {
            setCallState("active");
            void inspectConnectionType(connection);
          } else if (state === "failed") {
            if (!politeRef.current && connection.restartIce) {
              console.info("[WebRTC] Connection failed, attempting ICE restart...");
              connection.restartIce();
            } else {
              setMessage(
                "A direct video connection could not be established on this network. Your camera and microphone are off; continue by text."
              );
              stopLocalMedia();
            }
          }
        };

        connection.oniceconnectionstatechange = () => {
          const state = connection.iceConnectionState;
          if (state === "connected" || state === "completed") {
            setCallState("active");
            void inspectConnectionType(connection);
          } else if (state === "failed") {
            if (!politeRef.current && connection.restartIce) {
              connection.restartIce();
            }
          }
        };

        setCallState("connecting");

        // Initial offer initiation if offerer
        if (offerer) {
          const offer = await connection.createOffer();
          await connection.setLocalDescription(offer);
          sendControl({
            type: "video-signal",
            signal: {
              kind: "description",
              descriptionType: connection.localDescription!.type,
              sdp: connection.localDescription!.sdp,
            },
          });
        }
      } catch (err) {
        console.error("[WebRTC] Peer connection initialization failed:", err);
        sendControl({ type: "video-stop" });
        stopLocalMedia();
        setMessage("Video initialization failed. You can continue by text.");
      }
    },
    [inspectConnectionType, sendControl, stopLocalMedia]
  );

  // WebSocket message listener for video signaling events
  useEffect(() => {
    if (!socket) {
      if (localStreamRef.current || peerConnectionRef.current) stopLocalMedia();
      return;
    }

    const onMessage = (event: MessageEvent) => {
      let update: VideoEvent;
      try {
        update = JSON.parse(String(event.data)) as VideoEvent;
      } catch {
        return;
      }
      if (!update || typeof update !== "object" || !update.type?.startsWith("video-")) {
        return;
      }

      if (update.type === "video-status") {
        setReadyCount(update.readyCount);
        if (update.active) {
          setCallState(current => (current === "waiting" ? "connecting" : current));
        }
      } else if (update.type === "video-start") {
        setMessage("");
        const isPolite = update.polite ?? !update.offerer;
        void createPeerConnection(update.offerer, isPolite);
      } else if (update.type === "video-signal") {
        void applySignal(update.signal);
      } else if (update.type === "video-stopped") {
        stopLocalMedia();
        setReadyCount(0);
        setMessage(
          update.message || "Video stopped. The text conversation is still available."
        );
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
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "video-stop" }));
        }
        stopLocalMedia(false);
      }
    };
  }, [applySignal, createPeerConnection, socket, stopLocalMedia]);

  // Bind streams to video DOM nodes
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      if (remoteStream) {
        remoteVideoRef.current
          .play()
          .then(() => setNeedsPlayback(false))
          .catch(() => setNeedsPlayback(true));
      }
    }
  }, [remoteStream]);

  // User action: Join Video & Grant Browser Media Permissions
  const joinVideo = async () => {
    if (callState !== "idle") return;
    setMessage("");

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setMessage("Chat connection is not ready yet. Please wait a moment.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(
        "This browser cannot access camera/microphone here. Please use HTTPS or continue by text."
      );
      return;
    }

    const requestId = ++permissionRequestRef.current;
    setCallState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (permissionRequestRef.current !== requestId) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setCameraEnabled(stream.getVideoTracks().some(track => track.enabled));
      setMicEnabled(stream.getAudioTracks().some(track => track.enabled));

      if (!sendControl({ type: "video-ready" })) {
        throw new Error("Chat connection was interrupted before video consent could be shared.");
      }
      setCallState("waiting");
    } catch (error) {
      sendControl({ type: "video-decline" });
      stopLocalMedia();
      setMessage(
        error instanceof Error && /denied|permission|notallowed/i.test(error.message)
          ? "Camera or microphone permission was denied. Your text chat remains available."
          : error instanceof Error
            ? error.message
            : "Camera and microphone access failed. Continue by text or try again."
      );
    }
  };

  const endVideo = () => {
    sendControl({ type: "video-stop" });
    stopLocalMedia();
    setReadyCount(0);
    setMessage("Video stopped. The text conversation is still available.");
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

  const handleNextClick = () => {
    stopLocalMedia(false);
    if (onNext) onNext();
  };

  const handleEndClick = () => {
    stopLocalMedia(false);
    if (onEnd) onEnd();
  };

  const partnerReady = readyCount > 0 && callState === "idle";
  const isVideoActive = callState === "active";

  return (
    <section className="video-call-panel" aria-label="Stranger video chat">
      {/* Video Call Header */}
      <div className="video-call-heading">
        <div className="video-title-icon">
          <Video size={17} />
        </div>
        <div>
          <strong>Live Video Chat</strong>
          <span>Both participants must opt in before camera is shared.</span>
        </div>
        <span className="video-prototype-badge">
          {isVideoActive ? `● ${connectionType}` : "P2P WebRTC"}
        </span>
      </div>

      {/* Honest Privacy Notice */}
      <div className="video-privacy-warning" role="note">
        <ShieldAlert size={16} />
        <p>
          <strong>Video Privacy:</strong> Calls are peer-to-peer using STUN/TURN relays. Meetly does not record your video. Camera preview remains local until both users opt in. Age is self-attested.
        </p>
      </div>

      {/* Main Video Stage with Overlaid PiP Local Camera Preview */}
      <div className="video-viewport-stage">
        {/* Main Remote Video Area */}
        <div className={`video-remote-container ${remoteStream ? "has-feed" : ""}`}>
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              aria-label="Stranger's live video"
            />
          ) : (
            <div className="video-placeholder-hero">
              <Video size={36} />
              <h4>
                {callState === "waiting"
                  ? "Waiting for your partner to join video..."
                  : partnerReady
                    ? "Your chat partner is ready! Click Join Video below."
                    : "Camera and microphone are off."}
              </h4>
              <p>
                {callState === "idle" &&
                  "Click 'Join Video' to start camera and microphone preview."}
              </p>
              {callState === "idle" && (
                <button
                  type="button"
                  className="button button-primary"
                  onClick={joinVideo}
                >
                  <Video size={16} />
                  Join Video
                </button>
              )}
            </div>
          )}

          {/* Status Badge */}
          <div className="video-status-overlay">
            <span
              className={`status-pill ${
                isVideoActive
                  ? "live"
                  : callState === "connecting"
                    ? "connecting"
                    : "idle"
              }`}
            >
              <span className="status-dot" />
              {isVideoActive
                ? `Connected · ${connectionType}`
                : callState === "connecting"
                  ? "Connecting WebRTC..."
                  : callState === "waiting"
                    ? "Waiting for partner..."
                    : "Ready"}
            </span>
          </div>
        </div>

        {/* Picture-in-Picture Local Camera Preview */}
        {localStream && (
          <div className="video-pip-container">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              aria-label="Your local camera preview"
            />
            {!cameraEnabled && (
              <div className="pip-camera-off">
                <CameraOff size={16} />
                <span>Camera off</span>
              </div>
            )}
            <span className="pip-label">You (Local)</span>
          </div>
        )}

        {/* Video Control Bar Overlay */}
        {localStream && (
          <div className="video-controls-overlay" role="toolbar" aria-label="Video controls">
            <button
              type="button"
              className={`video-ctrl-btn ${micEnabled ? "active" : "muted"}`}
              onClick={toggleMic}
              title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
              aria-label={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
            >
              {micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            <button
              type="button"
              className={`video-ctrl-btn ${cameraEnabled ? "active" : "muted"}`}
              onClick={toggleCamera}
              title={cameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
              aria-label={cameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
            >
              {cameraEnabled ? <Camera size={18} /> : <CameraOff size={18} />}
            </button>

            {onNext && (
              <button
                type="button"
                className="video-ctrl-btn next"
                onClick={handleNextClick}
                title="Next Partner"
                aria-label="Next Partner"
              >
                <SkipForward size={18} />
                <span>Next</span>
              </button>
            )}

            {onReport && (
              <button
                type="button"
                className="video-ctrl-btn report"
                onClick={onReport}
                title="Report User"
                aria-label="Report User"
              >
                <Flag size={17} />
              </button>
            )}

            <button
              type="button"
              className="video-ctrl-btn end"
              onClick={handleEndClick || endVideo}
              title="End Video Chat"
              aria-label="End Video Chat"
            >
              <PhoneOff size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Autoplay Audio Unblocker if browser restricted audio */}
      {needsPlayback && (
        <button
          type="button"
          className="video-playback-button"
          onClick={() => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current
                .play()
                .then(() => setNeedsPlayback(false))
                .catch(() => {});
            }
          }}
        >
          <Volume2 size={14} /> Tap to enable partner audio
        </button>
      )}

      {/* Error or Notice Message */}
      {message && (
        <div className="video-call-message" role="alert">
          {message}
        </div>
      )}
    </section>
  );
}
