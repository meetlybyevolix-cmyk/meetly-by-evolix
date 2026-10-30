/**
 * Meetly Client-Side Video Safety & No-Nudity Screening Classifier
 * Evolix Studio - Phase 6
 *
 * Provides on-device, privacy-preserving visual safety classification.
 * Analyzes video frames locally without storing or transmitting raw video to any server.
 */

export interface SafetyClassificationResult {
  isSafe: boolean;
  nudityProbability: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  flaggedCategory: "suspected_nudity" | "explicit_exposure" | "none";
  analyzedAt: number;
}

/**
 * Evaluates raw RGBA pixel data for skin-tone clustering and intimate exposure heuristics.
 * Uses standard YCbCr skin chrominance segmentation (Kovac / Peer et al.).
 */
export function classifyFramePixels(
  data: Uint8ClampedArray,
  width: number,
  height: number
): SafetyClassificationResult {
  const totalPixels = width * height;
  if (totalPixels === 0) {
    return {
      isSafe: true,
      nudityProbability: 0,
      riskLevel: "low",
      flaggedCategory: "none",
      analyzedAt: Date.now(),
    };
  }

  let skinPixels = 0;
  let lowerHalfSkinPixels = 0;
  const halfY = Math.floor(height / 2);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Convert RGB to YCbCr
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

    // Standard skin chrominance bounds
    const isSkin =
      cb >= 77 &&
      cb <= 135 &&
      cr >= 133 &&
      cr <= 180 &&
      y >= 50 &&
      r > g &&
      r > b &&
      r - g >= 15;

    if (isSkin) {
      skinPixels++;
      const pixelIndex = i / 4;
      const pixelY = Math.floor(pixelIndex / width);
      if (pixelY >= halfY) {
        lowerHalfSkinPixels++;
      }
    }
  }

  const skinRatio = skinPixels / totalPixels;
  const lowerSkinRatio = skinPixels > 0 ? lowerHalfSkinPixels / skinPixels : 0;

  // Compute composite nudity probability score
  // High concentration in lower/middle areas without clothing is a strong indicator
  let nudityScore = 0;
  if (skinRatio > 0.45) {
    nudityScore = Math.min(1.0, 0.65 + skinRatio * 0.35 + lowerSkinRatio * 0.15);
  } else if (skinRatio >= 0.25) {
    nudityScore = Math.min(0.85, 0.28 + skinRatio * 0.5 + lowerSkinRatio * 0.12);
  } else if (skinRatio > 0.15) {
    nudityScore = skinRatio * 1.5;
  } else {
    nudityScore = skinRatio * 0.5;
  }

  let riskLevel: "low" | "medium" | "high" | "critical" = "low";
  let flaggedCategory: "suspected_nudity" | "explicit_exposure" | "none" = "none";

  if (nudityScore >= 0.65) {
    riskLevel = "critical";
    flaggedCategory = "explicit_exposure";
  } else if (nudityScore >= 0.40) {
    riskLevel = "high";
    flaggedCategory = "suspected_nudity";
  } else if (nudityScore >= 0.20) {
    riskLevel = "medium";
    flaggedCategory = "none";
  }

  return {
    isSafe: nudityScore < 0.40,
    nudityProbability: Number(nudityScore.toFixed(3)),
    riskLevel,
    flaggedCategory,
    analyzedAt: Date.now(),
  };
}

/**
 * Captures a downscaled frame from an active video element and runs on-device classification.
 */
export function classifyVideoElement(
  video: HTMLVideoElement,
  offscreenCanvas?: HTMLCanvasElement
): SafetyClassificationResult {
  if (
    !video ||
    video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
    video.videoWidth === 0 ||
    video.videoHeight === 0
  ) {
    return {
      isSafe: true,
      nudityProbability: 0,
      riskLevel: "low",
      flaggedCategory: "none",
      analyzedAt: Date.now(),
    };
  }

  const canvas = offscreenCanvas || document.createElement("canvas");
  const sampleWidth = 120;
  const sampleHeight = 90;
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return {
      isSafe: true,
      nudityProbability: 0,
      riskLevel: "low",
      flaggedCategory: "none",
      analyzedAt: Date.now(),
    };
  }

  try {
    ctx.drawImage(video, 0, 0, sampleWidth, sampleHeight);
    const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
    return classifyFramePixels(imageData.data, sampleWidth, sampleHeight);
  } catch (error) {
    // Cross-origin or tainted canvas fallback
    console.warn("[Video Safety] Canvas classification exception:", error);
    return {
      isSafe: true,
      nudityProbability: 0,
      riskLevel: "low",
      flaggedCategory: "none",
      analyzedAt: Date.now(),
    };
  }
}
