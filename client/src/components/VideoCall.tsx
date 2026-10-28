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
  | { kind: "description"; descriptionType: "offer" | "answer" | "pranswer" | "rollback"; sdp: string }
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

  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ]);

  // Fetch dynamic ICE configuration from server
  useEffect(() => {
    fetch("/api/ice-servers")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
          iceServersRef.current = data.iceServers;
        }
      })
      .catch(() => {
        // Fallback to default STUN
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
      connection.close();
    }
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    remoteStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
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
      setConnectionType("Direct (P2P)");
    }
  }, []);

  // Apply incoming WebRTC signaling with candidate buffering
  const applySignal = useCallback(
    async (signal: VideoSignal) => {
      const connection = peerConnectionRef.current;
      if (!connection) return;

      try {
        if (signal.kind === "candidate") {
          // If remote description is already applied, add candidate immediately
          if (connection.remoteDescription && connection.remoteDescription.type) {
            await connection.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } else {
            // Buffer candidate until remote description arrives
            pendingIceRef.current.push(signal.candidate);
          }
          return;
        }

        if (signal.kind === "description") {
          if (signal.descriptionType === "offer") {
            // Set remote offer
            await connection.setRemoteDescription(
              new RTCSessionDescription({ type: "offer", sdp: signal.sdp })
            );

            // Flush any buffered candidates that arrived early
            const buffered = pendingIceRef.current.splice(0);
            for (const candidate of buffered) {
              try {
                await connection.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.warn("[WebRTC] Early candidate warning:", e);
              }
            }

            // Create and send answer
            const answer = await connection.createAnswer();
            await connection.setLocalDescription(answer);

            sendControl({
              type: "video-signal",
              signal: {
                kind: "description",
                descriptionType: "answer",
                sdp: answer.sdp,
              },
            });
          } else if (signal.descriptionType === "answer") {
            // Set remote answer
            await connection.setRemoteDescription(
              new RTCSessionDescription({ type: "answer", sdp: signal.sdp })
            );

            // Flush buffered candidates
            const buffered = pendingIceRef.current.splice(0);
            for (const candidate of buffered) {
              try {
                await connection.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.warn("[WebRTC] Early candidate warning:", e);
              }
            }
          }
        }
      } catch (error) {
        console.error("[WebRTC] Signaling apply error:", error);
      }
    },
    [sendControl]
  );

  // Initialize peer connection
  const createPeerConnection = useCallback(
    async (offerer: boolean) => {
      if (peerConnectionRef.current) return;
      const stream = localStreamRef.current;
      if (!stream) {
        setMessage("Allow camera and microphone access before joining video.");
        sendControl({ type: "video-decline" });
        return;
      }

      try {
        const connection = new RTCPeerConnection({
          iceServers: iceServersRef.current,
        });
        peerConnectionRef.current = connection;

        // Add local tracks to peer connection
        stream.getTracks().forEach(track => connection.addTrack(track, stream));

        // Inbound tracks from partner
        connection.ontrack = event => {
          const incoming = event.streams[0] ?? new MediaStream([event.track]);
          remoteStreamRef.current = incoming;
          setRemoteStream(incoming);
          setCallState("active");
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = incoming;
            remoteVideoRef.current
              .play()
              .then(() => setNeedsPlayback(false))
              .catch(() => setNeedsPlayback(true));
          }
          void inspectConnectionType(connection);
        };

        // Outbound ICE candidates
        connection.onicecandidate = event => {
          if (event.candidate) {
            sendControl({
              type: "video-signal",
              signal: {
                kind: "candidate",
                candidate: event.candidate.toJSON
                  ? event.candidate.toJSON()
                  : {
                      candidate: event.candidate.candidate,
                      sdpMid: event.candidate.sdpMid,
                      sdpMLineIndex: event.candidate.sdpMLineIndex,
                    },
              },
            });
          }
        };

        // Connection state monitoring
        connection.onconnectionstatechange = () => {
          const state = connection.connectionState;
          if (state === "connected") {
            setCallState("active");
            void inspectConnectionType(connection);
          } else if (state === "disconnected") {
            setConnectionType("Reconnecting...");
          } else if (state === "failed") {
            if (connection.restartIce) {
              connection.restartIce();
            } else {
              setMessage(
                "Direct video connection failed on this network. You can continue by text."
              );
            }
          }
        };

        connection.oniceconnectionstatechange = () => {
          const state = connection.iceConnectionState;
          if (state === "connected" || state === "completed") {
            setCallState("active");
            void inspectConnectionType(connection);
          }
        };

        setCallState("connecting");

        // Initial offer initiation if designated offerer
        if (offerer) {
          const offer = await connection.createOffer();
          await connection.setLocalDescription(offer);
          sendControl({
            type: "video-signal",
            signal: {
              kind: "description",
              descriptionType: "offer",
              sdp: offer.sdp,
            },
          });
        }
      } catch (err) {
        console.error("[WebRTC] Peer connection initialization failed:", err);
        sendControl({ type: "video-stop" });
        stopLocalMedia();
        setMessage("Video connection failed. You can continue by text.");
      }
    },
    [inspectConnectionType, sendControl, stopLocalMedia]
  );

  // WebSocket message listener for video events
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
        void createPeerConnection(update.offerer);
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
      setMessage("Chat connection ended. Camera and microphone are off.");
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

  // Ensure video nodes render active streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current
        .play()
        .then(() => setNeedsPlayback(false))
        .catch(() => setNeedsPlayback(true));
    }
  }, [remoteStream]);

  // User action: Enable Camera & Join Video
  const joinVideo = async () => {
    if (callState !== "idle") return;
    setMessage("");

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setMessage("Connection is not ready yet. Please wait a moment.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(
        "Camera and microphone access is not supported on this browser or connection. Please use HTTPS or continue by text."
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

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      if (!sendControl({ type: "video-ready" })) {
        throw new Error("Connection was interrupted before video consent could be sent.");
      }
      setCallState("waiting");
    } catch (error) {
      sendControl({ type: "video-decline" });
      stopLocalMedia();
      setMessage(
        error instanceof Error && /denied|permission|notallowed/i.test(error.message)
          ? "Camera or microphone permission was denied. Allow access in your browser's address bar settings to use Video Chat, or continue by text."
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

      {/* Privacy Notice */}
      <div className="video-privacy-warning" role="note">
        <ShieldAlert size={16} />
        <p>
          <strong>Video Privacy:</strong> Calls are peer-to-peer using STUN/TURN relays. Meetly does not record your video. Camera preview remains local until both users opt in. Age is self-attested.
        </p>
      </div>

      {/* Main Video Viewport Stage */}
      <div className="video-viewport-stage">
        {/* Remote Video Container */}
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
              <div className="video-hero-icon">
                <Video size={38} />
              </div>
              <h4>
                {callState === "waiting"
                  ? "Waiting for your partner to join video..."
                  : partnerReady
                    ? "Your chat partner is ready! Click below to join."
                    : "Live Video Chat"}
              </h4>
              <p>
                {callState === "waiting"
                  ? "Your camera preview is active in the corner. Waiting for partner to click join."
                  : partnerReady
                    ? "Your partner has enabled camera and microphone. Click to connect."
                    : "Camera and microphone are off. Click below to allow browser access and start."}
              </p>
              {callState === "idle" && (
                <button
                  type="button"
                  className="button button-primary button-large"
                  onClick={joinVideo}
                >
                  <Video size={18} />
                  Start Camera & Join Call
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

      {/* Autoplay Audio Recovery */}
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
          <Volume2 size={14} /> Tap here to unmute partner audio
        </button>
      )}

      {/* Notice or Error Banner */}
      {message && (
        <div className="video-call-message" role="alert">
          {message}
        </div>
      )}
    </section>
  );
}
