import {
  AlertTriangle,
  Camera,
  CameraOff,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Flag,
  LockKeyhole,
  MessageCircle,
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Settings,
  Shield,
  ShieldAlert,
  SkipForward,
  Sparkles,
  Video,
  Volume2,
  VolumeX,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  classifyVideoElement,
  type SafetyClassificationResult,
} from "../lib/videoSafetyClassifier";
import {
  processSelectedPhoto,
  uploadPhotoFile,
  type ImageValidationResult,
} from "../lib/imageUpload";
import ImageLightboxModal, {
  type LightboxMedia,
} from "./ImageLightboxModal";
import PhotoUploadPreview from "./PhotoUploadPreview";
import ChatImageBubble from "./ChatImageBubble";

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
  sessionToken?: string;
  onNext?: () => void;
  onEnd?: () => void;
  onReport?: () => void;
  onBlock?: () => void;
  messages?: Array<{
    id: string;
    text: string;
    sentAt: number;
    fromMe: boolean;
    media?: {
      id: string;
      url: string;
      mimeType?: string;
      width?: number;
      height?: number;
      isFlagged?: boolean;
    };
  }>;
  onSendMessage?: (text: string, mediaId?: string) => void;
  onReportImage?: (mediaId: string) => void;
  notice?: string;
  onClearNotice?: () => void;
}

export default function VideoCall({
  socket,
  sessionToken,
  onNext,
  onEnd,
  onReport,
  onBlock,
  messages = [],
  onSendMessage,
  onReportImage,
  notice,
  onClearNotice,
}: VideoCallProps) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [readyCount, setReadyCount] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [message, setMessage] = useState("");
  const [connectionType, setConnectionType] = useState<string>("Negotiating...");
  const [needsPlayback, setNeedsPlayback] = useState(false);

  // Side Chat states
  const [isChatOpen, setIsChatOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatDraft, setChatDraft] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const isUserNearBottomRef = useRef(true);
  const prevMessagesCountRef = useRef(messages.length);

  // Photo sharing states
  const [photoPreview, setPhotoPreview] = useState<ImageValidationResult | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<LightboxMedia | null>(null);
  const sidePhotoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage("");
    const result = await processSelectedPhoto(file);
    if (!result.valid && !result.previewUrl) {
      setMessage(result.error || "Invalid photo format or file too large.");
      if (sidePhotoInputRef.current) sidePhotoInputRef.current.value = "";
      return;
    }
    setPhotoPreview(result);
    setPhotoCaption("");
    if (sidePhotoInputRef.current) sidePhotoInputRef.current.value = "";
  };

  const handleCancelPhoto = useCallback(() => {
    setPhotoPreview(null);
    setPhotoCaption("");
    if (sidePhotoInputRef.current) sidePhotoInputRef.current.value = "";
  }, []);

  const handleSendPhoto = async () => {
    if (!photoPreview || !photoPreview.file) return;
    setUploadingPhoto(true);
    try {
      const token = sessionToken || sessionStorage.getItem("meetly-session") || "";
      const media = await uploadPhotoFile(photoPreview.file, token, {
        isFlagged: Boolean(photoPreview.safetyResult && !photoPreview.safetyResult.isSafe),
      });
      onSendMessage?.(photoCaption, media.mediaId);
      handleCancelPhoto();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Photo upload failed.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Monitor unread incoming messages when chat panel is closed
  useEffect(() => {
    if (messages.length > prevMessagesCountRef.current) {
      const newMessages = messages.slice(prevMessagesCountRef.current);
      const incomingFromStranger = newMessages.filter(m => !m.fromMe);
      if (!isChatOpen && incomingFromStranger.length > 0) {
        setUnreadCount(prev => prev + incomingFromStranger.length);
      }
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages, isChatOpen]);

  // Toggle chat panel and clear unread counter
  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => {
      const next = !prev;
      if (next) {
        setUnreadCount(0);
        setTimeout(() => chatInputRef.current?.focus(), 100);
      }
      return next;
    });
  }, []);

  // Track manual scroll position to preserve scroll when user reviews older messages
  const handleChatScroll = useCallback(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    isUserNearBottomRef.current = distanceToBottom < 80;
  }, []);

  // Auto-scroll to newest message if user is already near bottom
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    if (isUserNearBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  // Message submission
  const handleSendChatMessage = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatDraft.trim();
    if (!text || text.length > 500) return;
    if (onSendMessage) {
      onSendMessage(text);
      setChatDraft("");
    }
  }, [chatDraft, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
  }, [handleSendChatMessage]);

  const formatTime = (timestamp: number) => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(timestamp);
    } catch {
      return "";
    }
  };

  // Device selection states
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState<string>("");
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);

  // Safety & No-Nudity Screening states
  const [isScreening, setIsScreening] = useState(false);
  const [isSafetyObscured, setIsSafetyObscured] = useState(false);
  const [manualUnblur, setManualUnblur] = useState(false);
  const [safetyScore, setSafetyScore] = useState<number>(0);
  const [safetyViolation, setSafetyViolation] = useState<string | null>(null);
  const [noNudityAcknowledged, setNoNudityAcknowledged] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const permissionRequestRef = useRef(0);
  const screeningTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ]);

  // Enumerate hardware devices
  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === "audioinput");
      const videoInputs = devices.filter(d => d.kind === "videoinput");
      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);
      if (audioInputs[0] && !selectedAudioId) setSelectedAudioId(audioInputs[0].deviceId);
      if (videoInputs[0] && !selectedVideoId) setSelectedVideoId(videoInputs[0].deviceId);
    } catch (err) {
      console.warn("[MediaDevices] Enumeration failed:", err);
    }
  }, [selectedAudioId, selectedVideoId]);

  useEffect(() => {
    void refreshDevices();
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
      return () => {
        navigator.mediaDevices.removeEventListener("devicechange", refreshDevices);
      };
    }
  }, [refreshDevices]);

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
    if (screeningTimerRef.current) {
      clearInterval(screeningTimerRef.current);
      screeningTimerRef.current = null;
    }

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
      setIsAudioOnly(false);
      setNeedsPlayback(false);
      setConnectionType("Negotiating...");
      setIsSafetyObscured(false);
      setIsScreening(false);
      setManualUnblur(false);
      setSafetyViolation(null);
    }
  }, []);

  // Remote stream playback helper - no automatic obscuring restrictions
  const startRemoteScreening = useCallback(() => {
    if (screeningTimerRef.current) {
      clearInterval(screeningTimerRef.current);
      screeningTimerRef.current = null;
    }
    setIsScreening(false);
    setIsSafetyObscured(false);
    setSafetyViolation(null);

    const videoEl = remoteVideoRef.current;
    if (videoEl && videoEl.paused) {
      videoEl.play().catch(() => {});
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
          if (connection.remoteDescription && connection.remoteDescription.type) {
            await connection.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } else {
            pendingIceRef.current.push(signal.candidate);
          }
          return;
        }

        if (signal.kind === "description") {
          if (signal.descriptionType === "offer") {
            await connection.setRemoteDescription(
              new RTCSessionDescription({ type: "offer", sdp: signal.sdp })
            );

            const buffered = pendingIceRef.current.splice(0);
            for (const candidate of buffered) {
              try {
                await connection.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.warn("[WebRTC] Early candidate warning:", e);
              }
            }

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
            await connection.setRemoteDescription(
              new RTCSessionDescription({ type: "answer", sdp: signal.sdp })
            );

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

  // Initialize peer connection with both audio and video senders
  const createPeerConnection = useCallback(
    async (offerer: boolean) => {
      if (peerConnectionRef.current) return;
      const stream = localStreamRef.current;
      if (!stream) {
        setMessage("Allow microphone and camera access before joining.");
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
              .then(() => {
                setNeedsPlayback(false);
                startRemoteScreening();
              })
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
              setMessage("Direct connection failed. You can continue by text.");
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
        setMessage("Connection initialization failed. You can continue by text.");
      }
    },
    [inspectConnectionType, sendControl, startRemoteScreening, stopLocalMedia]
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
        setMessage(update.message || "Video stopped. The text chat is still active.");
      } else if (update.type === "video-error") {
        setMessage(update.message);
      }
    };

    const onClose = () => {
      stopLocalMedia();
      setReadyCount(0);
      setMessage("Chat connection closed. Microphone and camera are deactivated.");
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

  // Bind local stream to preview element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // Bind remote stream to partner video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current
        .play()
        .then(() => {
          setNeedsPlayback(false);
          startRemoteScreening();
        })
        .catch(() => setNeedsPlayback(true));
    }
  }, [remoteStream, startRemoteScreening]);

  // Join Video Call with robust audio & audio-only fallback
  const joinVideo = async () => {
    if (callState !== "idle") return;
    setMessage("");

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setMessage("Connecting to signaling network. Please wait a moment.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("Media devices not supported. Please use HTTPS or continue by text.");
      return;
    }

    const requestId = ++permissionRequestRef.current;
    setCallState("requesting");

    let stream: MediaStream | null = null;
    let fallbackToAudioOnly = false;

    try {
      // First attempt: Both Audio and Video
      const constraints: MediaStreamConstraints = {
        audio: selectedAudioId ? { deviceId: { exact: selectedAudioId } } : true,
        video: selectedVideoId
          ? { deviceId: { exact: selectedVideoId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
      };
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (firstError) {
      console.warn("[Media] Full audio+video capture failed, attempting audio-only fallback:", firstError);
      try {
        // Fallback: Audio-Only capture if camera is occupied or denied
        stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedAudioId ? { deviceId: { exact: selectedAudioId } } : true,
          video: false,
        });
        fallbackToAudioOnly = true;
      } catch (audioError) {
        sendControl({ type: "video-decline" });
        stopLocalMedia();
        const isDenied =
          audioError instanceof Error && /denied|permission|notallowed/i.test(audioError.message);
        setMessage(
          isDenied
            ? "Microphone access was denied. Allow microphone access in your browser settings to join call."
            : "Hardware capture failed. Please check microphone settings."
        );
        return;
      }
    }

    if (permissionRequestRef.current !== requestId || !stream) {
      stream?.getTracks().forEach(t => t.stop());
      return;
    }

    localStreamRef.current = stream;
    setLocalStream(stream);
    setIsAudioOnly(fallbackToAudioOnly);
    setCameraEnabled(stream.getVideoTracks().some(track => track.enabled));
    setMicEnabled(stream.getAudioTracks().some(track => track.enabled));

    if (localVideoRef.current && !fallbackToAudioOnly) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(() => {});
    }

    void refreshDevices();

    if (!sendControl({ type: "video-ready" })) {
      stream.getTracks().forEach(t => t.stop());
      stopLocalMedia();
      setMessage("Connection interrupted before call handshake. Please retry.");
      return;
    }
    setCallState("waiting");
  };

  // Seamless Audio Device Switching without tearing down WebRTC
  const switchAudioDevice = async (deviceId: string) => {
    setSelectedAudioId(deviceId);
    if (!localStreamRef.current) return;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });
      const newAudioTrack = newStream.getAudioTracks()[0];
      if (!newAudioTrack) return;

      const sender = peerConnectionRef.current
        ?.getSenders()
        .find(s => s.track && s.track.kind === "audio");
      if (sender) {
        await sender.replaceTrack(newAudioTrack);
      }

      const oldAudioTrack = localStreamRef.current.getAudioTracks()[0];
      if (oldAudioTrack) oldAudioTrack.stop();

      localStreamRef.current.removeTrack(oldAudioTrack);
      localStreamRef.current.addTrack(newAudioTrack);
      setMicEnabled(newAudioTrack.enabled);
    } catch (err) {
      console.warn("[Media Switch] Audio device switch failed:", err);
    }
  };

  // Seamless Video Device Switching without tearing down WebRTC
  const switchVideoDevice = async (deviceId: string) => {
    setSelectedVideoId(deviceId);
    if (!localStreamRef.current || isAudioOnly) return;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      const sender = peerConnectionRef.current
        ?.getSenders()
        .find(s => s.track && s.track.kind === "video");
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }

      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) oldVideoTrack.stop();

      localStreamRef.current.removeTrack(oldVideoTrack);
      localStreamRef.current.addTrack(newVideoTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setCameraEnabled(newVideoTrack.enabled);
    } catch (err) {
      console.warn("[Media Switch] Video device switch failed:", err);
    }
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicEnabled(track.enabled);
  };

  const toggleCamera = () => {
    if (isAudioOnly) return;
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraEnabled(track.enabled);
  };

  const handleNextClick = () => {
    stopLocalMedia(false);
    handleCancelPhoto();
    setLightboxMedia(null);
    if (onNext) onNext();
  };

  const handleEndClick = () => {
    stopLocalMedia(false);
    handleCancelPhoto();
    setLightboxMedia(null);
    if (onEnd) onEnd();
  };

  const partnerReady = readyCount > 0 && callState === "idle";
  const isVideoActive = callState === "active";
  const shouldObscure = isSafetyObscured && !manualUnblur;

  return (
    <div className={`video-call-layout ${isChatOpen ? "chat-open" : "chat-collapsed"}`}>
      <section className="video-main-panel" aria-label="Live audio and video chat">
        {/* Video Call Header */}
        <div className="video-call-heading">
          <div className="video-title-icon">
            <Video size={17} />
          </div>
          <div>
            <strong>Live Video Chat</strong>
            <span>Direct P2P connection</span>
          </div>
          <div className="video-header-actions">
            <button
              type="button"
              className={`video-chat-header-btn ${isChatOpen ? "active" : ""}`}
              onClick={toggleChat}
              title={isChatOpen ? "Collapse Chat Panel" : "Open Chat Panel"}
              aria-label={isChatOpen ? "Collapse Chat Panel" : "Open Chat Panel"}
            >
              <MessageSquare size={15} />
              <span>{isChatOpen ? "Hide Chat" : "Chat"}</span>
              {unreadCount > 0 && (
                <span className="unread-counter-badge" aria-label={`${unreadCount} unread messages`}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              className="video-settings-toggle"
              onClick={() => setShowSettings(!showSettings)}
              title="Audio / Video Device Settings"
              aria-label="Settings"
            >
              <Settings size={15} />
            </button>
            <span className="video-prototype-badge">
              {isVideoActive ? `● ${connectionType}` : "P2P WebRTC"}
            </span>
          </div>
        </div>

      {/* Device Selection Drawer */}
      {showSettings && (
        <div className="video-settings-drawer" role="region" aria-label="Device settings">
          <div className="settings-row">
            <label htmlFor="mic-select">
              <Mic size={14} /> Microphone:
            </label>
            <select
              id="mic-select"
              value={selectedAudioId}
              onChange={e => void switchAudioDevice(e.target.value)}
            >
              {audioDevices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone (${d.deviceId.slice(0, 8)})`}
                </option>
              ))}
            </select>
          </div>
          {!isAudioOnly && (
            <div className="settings-row">
              <label htmlFor="cam-select">
                <Camera size={14} /> Camera:
              </label>
              <select
                id="cam-select"
                value={selectedVideoId}
                onChange={e => void switchVideoDevice(e.target.value)}
              >
                {videoDevices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera (${d.deviceId.slice(0, 8)})`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Main Video Viewport Stage */}
      <div className="video-viewport-stage">
        {/* Remote Video Container */}
        <div
          className={`video-remote-container ${remoteStream ? "has-feed" : ""}`}
        >
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              aria-label="Partner live video feed"
              className="normal-video"
            />
          ) : (
            <div className="video-placeholder-hero">
              <div className="video-hero-icon">
                <Video size={38} />
              </div>
              <h4>
                {callState === "waiting"
                  ? "Waiting for partner to join audio/video..."
                  : partnerReady
                    ? "Your chat partner is ready! Click below to join."
                    : "Live Audio & Video Chat"}
              </h4>
              <p>
                {callState === "waiting"
                  ? "Your microphone and camera preview are active. Waiting for partner."
                  : partnerReady
                    ? "Your partner has enabled camera and microphone. Click to connect."
                    : "Microphone and camera are off. Click below to allow browser access and start."}
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

          {/* Connection Status Badge */}
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
                ? `Connected · ${isAudioOnly ? "Audio Only" : "Video"} · ${connectionType}`
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
            {!isAudioOnly ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                aria-label="Your local camera preview"
              />
            ) : (
              <div className="pip-audio-only">
                <Mic size={24} />
                <span>Audio Only</span>
              </div>
            )}
            {!cameraEnabled && !isAudioOnly && (
              <div className="pip-camera-off">
                <CameraOff size={16} />
                <span>Camera off</span>
              </div>
            )}
            {!micEnabled && (
              <div className="pip-mic-muted-badge">
                <MicOff size={12} /> Muted
              </div>
            )}
            <span className="pip-label">You (Local)</span>
          </div>
        )}

        {/* Video Control Bar Overlay */}
        {localStream && (
          <div className="video-controls-overlay" role="toolbar" aria-label="Call controls">
            <button
              type="button"
              className={`video-ctrl-btn ${micEnabled ? "active" : "muted"}`}
              onClick={toggleMic}
              title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
              aria-label={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
            >
              {micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            {!isAudioOnly && (
              <button
                type="button"
                className={`video-ctrl-btn ${cameraEnabled ? "active" : "muted"}`}
                onClick={toggleCamera}
                title={cameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
                aria-label={cameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
              >
                {cameraEnabled ? <Camera size={18} /> : <CameraOff size={18} />}
              </button>
            )}

            {/* Chat Toggle Button */}
            <button
              type="button"
              className={`video-ctrl-btn chat-btn ${isChatOpen ? "active" : ""}`}
              onClick={toggleChat}
              title={isChatOpen ? "Hide Text Chat" : "Open Text Chat"}
              aria-label={isChatOpen ? "Hide Text Chat" : "Open Text Chat"}
            >
              <MessageSquare size={18} />
              {unreadCount > 0 && (
                <span className="unread-counter-badge" aria-label={`${unreadCount} unread messages`}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              <span className="ctrl-btn-text">Chat</span>
            </button>

            {onNext && (
              <button
                type="button"
                className="video-ctrl-btn next"
                onClick={handleNextClick}
                title="Next Stranger"
                aria-label="Next Stranger"
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
                title="Report Abuse"
                aria-label="Report Abuse"
              >
                <Flag size={17} />
              </button>
            )}

            <button
              type="button"
              className="video-ctrl-btn end"
              onClick={handleEndClick}
              title="End Call"
              aria-label="End Call"
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

    {/* Side Chat Column (~30% on desktop, bottom drawer on mobile) */}
    <aside 
      className={`video-side-chat-column ${isChatOpen ? "open" : "collapsed"}`}
      aria-label="Live text messaging during call"
    >
      <div className="side-chat-header">
        <div className="side-chat-title">
          <MessageSquare size={16} className="side-chat-icon" />
          <div>
            <strong>Live Chat</strong>
            <span>Instant & temporary</span>
          </div>
        </div>
        <button
          type="button"
          className="side-chat-toggle-btn"
          onClick={toggleChat}
          title={isChatOpen ? "Collapse chat" : "Expand chat"}
          aria-label={isChatOpen ? "Collapse chat" : "Expand chat"}
        >
          <ChevronRight size={16} className="desktop-collapse-icon" />
          <X size={16} className="mobile-close-icon" />
        </button>
      </div>

      {/* Scrollable messages container */}
      <div
        className="side-chat-messages"
        ref={chatScrollRef}
        onScroll={handleChatScroll}
        aria-live="polite"
        aria-label="Conversation messages"
      >
        <div className="side-chat-start-notice">
          <Sparkles size={13} />
          <span>Connected in video and live text</span>
        </div>

        {messages.length === 0 && (
          <div className="side-chat-empty-state">
            <p>You can send messages while your video and audio continue.</p>
            <span className="side-chat-hint">Say hi!</span>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`side-chat-row ${msg.fromMe ? "mine" : "theirs"}`}
          >
            {msg.media ? (
              <ChatImageBubble
                media={msg.media}
                caption={msg.text}
                fromMe={msg.fromMe}
                sentAt={msg.sentAt}
                onOpenLightbox={setLightboxMedia}
                onReportImage={onReportImage}
              />
            ) : (
              <div className="side-chat-bubble">
                <span className="side-chat-sender-label">
                  {msg.fromMe ? "You" : "Stranger"}
                </span>
                <p className="side-chat-text">{msg.text}</p>
                {msg.sentAt && (
                  <time className="side-chat-timestamp">
                    {formatTime(msg.sentAt)}
                  </time>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Optional notice inside chat */}
      {notice && (
        <div className="side-chat-notice" role="status">
          <span>{notice}</span>
          {onClearNotice && (
            <button type="button" onClick={onClearNotice} aria-label="Dismiss notice">
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* Photo upload pre-send preview */}
      <PhotoUploadPreview
        preview={photoPreview}
        caption={photoCaption}
        onCaptionChange={setPhotoCaption}
        onCancel={handleCancelPhoto}
        onSend={handleSendPhoto}
        uploading={uploadingPhoto}
      />

      {/* Chat composer form */}
      <form className="side-chat-composer" onSubmit={handleSendChatMessage}>
        <input
          ref={sidePhotoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={handlePhotoSelect}
        />
        <div className="side-composer-input-wrapper">
          <button
            type="button"
            className="side-chat-photo-trigger-btn"
            onClick={() => sidePhotoInputRef.current?.click()}
            title="Send a photo (JPG, PNG, WebP)"
            aria-label="Send a photo"
            disabled={uploadingPhoto}
          >
            <ImageIcon size={16} />
          </button>
          <textarea
            ref={chatInputRef}
            value={chatDraft}
            onChange={e => setChatDraft(e.target.value.slice(0, 500))}
            onKeyDown={handleKeyDown}
            placeholder="Type a message (Enter to send)..."
            maxLength={500}
            rows={1}
            aria-label="Type a message"
          />
          <button
            type="submit"
            className="side-send-button"
            disabled={!chatDraft.trim()}
            title="Send message (Enter)"
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        </div>
        <div className="side-composer-meta">
          <span className="side-composer-hint">
            <LockKeyhole size={11} /> Shift+Enter for new line
          </span>
          <span className="side-composer-counter">{chatDraft.length}/500</span>
        </div>
      </form>
    </aside>

    {/* Mobile backdrop when side chat is open as drawer */}
    {isChatOpen && (
      <div
        className="mobile-side-chat-backdrop"
        onClick={toggleChat}
        aria-hidden="true"
      />
    )}

    {/* Fullscreen Photo Lightbox Modal */}
    <ImageLightboxModal
      media={lightboxMedia}
      onClose={() => setLightboxMedia(null)}
      onReport={onReportImage}
    />
  </div>
  );
}
