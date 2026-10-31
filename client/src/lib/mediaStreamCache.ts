/**
 * Meetly Warm Media Stream Cache
 * Evolix Studio - Mobile WebRTC Acceleration
 *
 * Keeps camera and microphone media streams warm and active across skips/rematches.
 * Eliminates hardware camera re-initialization lag (1.5-3s on mobile) and starts
 * video calls instantly upon matching.
 */

let cachedStream: MediaStream | null = null;
let streamPromise: Promise<MediaStream> | null = null;

export interface StreamConstraintsOptions {
  audioDeviceId?: string;
  videoDeviceId?: string;
  audioOnly?: boolean;
}

export function buildMediaConstraints(options: StreamConstraintsOptions = {}): MediaStreamConstraints {
  const { audioDeviceId, videoDeviceId, audioOnly = false } = options;

  const audioConstraints: MediaTrackConstraints | boolean = audioDeviceId
    ? {
        deviceId: { exact: audioDeviceId },
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    : {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };

  if (audioOnly) {
    return { audio: audioConstraints, video: false };
  }

  const videoConstraints: MediaTrackConstraints = videoDeviceId
    ? {
        deviceId: { exact: videoDeviceId },
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        frameRate: { ideal: 24, max: 30 },
      }
    : {
        facingMode: "user",
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        frameRate: { ideal: 24, max: 30 },
      };

  return {
    audio: audioConstraints,
    video: videoConstraints,
  };
}

export function getCachedStream(): MediaStream | null {
  if (
    cachedStream &&
    cachedStream.active &&
    cachedStream.getTracks().some(t => t.readyState === "live")
  ) {
    return cachedStream;
  }
  return null;
}

export async function acquireWarmStream(
  options: StreamConstraintsOptions = {}
): Promise<MediaStream> {
  const existing = getCachedStream();
  if (existing) {
    return existing;
  }

  if (streamPromise) {
    return streamPromise;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Media devices not supported in this browser.");
  }

  streamPromise = (async () => {
    try {
      const constraints = buildMediaConstraints(options);
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn("[MediaStreamCache] Video acquisition failed, falling back to audio:", err);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: options.audioDeviceId
            ? { deviceId: { exact: options.audioDeviceId } }
            : { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false,
        });
      }
      cachedStream = stream;
      return stream;
    } finally {
      streamPromise = null;
    }
  })();

  return streamPromise;
}

export function stopWarmStream(): void {
  if (cachedStream) {
    cachedStream.getTracks().forEach(track => {
      try {
        track.stop();
      } catch {
        /* noop */
      }
    });
    cachedStream = null;
  }
}
