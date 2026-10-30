import { classifyFramePixels, type SafetyClassificationResult } from "./videoSafetyClassifier";
import { getApiUrl } from "./api";

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
  previewUrl?: string;
  width?: number;
  height?: number;
  safetyResult?: SafetyClassificationResult;
}

export const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Validates file type, size, dimensions, and performs on-device nudity screening.
 */
export async function processSelectedPhoto(file: File): Promise<ImageValidationResult> {
  if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Only JPEG, PNG, and WebP images are allowed. Vector, PDF, and binary files are rejected.",
    };
  }

  if (file.size > MAX_PHOTO_SIZE) {
    return {
      valid: false,
      error: `Photo is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 5 MB.`,
    };
  }

  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
          resolve({ valid: false, error: "Invalid image dimensions." });
          return;
        }

        if (width > 4096 || height > 4096) {
          resolve({
            valid: false,
            error: `Image dimensions (${width}x${height}) exceed the maximum permitted 4096x4096.`,
          });
          return;
        }

        // On-device privacy-preserving safety screening
        try {
          const canvas = document.createElement("canvas");
          const sampleWidth = 120;
          const sampleHeight = Math.round((height / width) * 120) || 90;
          canvas.width = sampleWidth;
          canvas.height = sampleHeight;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });

          let safetyResult: SafetyClassificationResult = {
            isSafe: true,
            nudityProbability: 0,
            riskLevel: "low",
            flaggedCategory: "none",
            analyzedAt: Date.now(),
          };

          if (ctx) {
            ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
            const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
            safetyResult = classifyFramePixels(imageData.data, sampleWidth, sampleHeight);
          }

          if (!safetyResult.isSafe && safetyResult.riskLevel === "critical") {
            resolve({
              valid: false,
              error:
                "Explicit content or suspected nudity detected. Meetly strictly prohibits adult/explicit photos under Community Guidelines.",
              previewUrl: dataUrl,
              width,
              height,
              safetyResult,
            });
            return;
          }

          resolve({
            valid: true,
            file,
            previewUrl: dataUrl,
            width,
            height,
            safetyResult,
          });
        } catch {
          resolve({
            valid: true,
            file,
            previewUrl: dataUrl,
            width,
            height,
          });
        }
      };

      img.onerror = () => {
        resolve({ valid: false, error: "Failed to load or parse image." });
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      resolve({ valid: false, error: "Failed to read file from disk." });
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a validated photo file to the secure backend endpoint.
 */
export async function uploadPhotoFile(
  file: File,
  sessionToken: string,
  options?: { isFlagged?: boolean; flagReason?: string }
): Promise<{
  mediaId: string;
  url: string;
  width: number;
  height: number;
  mimeType: string;
}> {
  const headers: Record<string, string> = {
    "Content-Type": file.type,
    "x-meetly-session": sessionToken,
  };

  const res = await fetch(getApiUrl("/api/chat/upload-image"), {
    method: "POST",
    headers,
    body: file,
  });

  if (!res.ok) {
    let errorMsg = "Photo upload failed.";
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
    } catch {}
    throw new Error(errorMsg);
  }

  const payload = await res.json();
  if (payload.url && !payload.url.startsWith("http")) {
    payload.url = getApiUrl(payload.url);
  }
  return payload;
}

