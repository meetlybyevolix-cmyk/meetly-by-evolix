import React from "react";
import { X, Send, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import type { ImageValidationResult } from "../lib/imageUpload";

interface PhotoUploadPreviewProps {
  preview: ImageValidationResult | null;
  caption: string;
  onCaptionChange: (caption: string) => void;
  onCancel: () => void;
  onSend: () => void;
  uploading: boolean;
}

export default function PhotoUploadPreview({
  preview,
  caption,
  onCaptionChange,
  onCancel,
  onSend,
  uploading,
}: PhotoUploadPreviewProps) {
  if (!preview || !preview.previewUrl) return null;

  const isBlocked = !preview.valid;

  return (
    <div className="photo-preview-card" role="region" aria-label="Photo pre-send preview">
      <div className="photo-preview-thumb-wrap">
        <img
          src={preview.previewUrl}
          alt="Selected preview"
          className="photo-preview-thumbnail"
        />
        <button
          type="button"
          className="photo-preview-close"
          onClick={onCancel}
          disabled={uploading}
          title="Discard photo"
          aria-label="Discard photo"
        >
          <X size={14} />
        </button>
      </div>

      <div className="photo-preview-details">
        <div className="photo-preview-meta">
          <span className="photo-file-name">
            {preview.file?.name || "Selected photo"}
          </span>
          {preview.file && (
            <span className="photo-file-size">
              {(preview.file.size / 1024).toFixed(0)} KB
            </span>
          )}
          {preview.width && preview.height && (
            <span className="photo-file-dims">
              {preview.width}x{preview.height}
            </span>
          )}
        </div>

        {isBlocked ? (
          <div className="photo-safety-alert danger">
            <AlertTriangle size={14} />
            <span>{preview.error || "This image cannot be sent."}</span>
          </div>
        ) : (
          <div className="photo-safety-alert success">
            <ShieldCheck size={13} />
            <span>EXIF stripped · Adults-only & no-nudity policy applies</span>
          </div>
        )}

        <div className="photo-preview-caption-row">
          <input
            type="text"
            className="photo-preview-caption-input"
            placeholder="Add a caption (optional)..."
            value={caption}
            onChange={e => onCaptionChange(e.target.value.slice(0, 500))}
            maxLength={500}
            disabled={uploading || isBlocked}
          />
          <button
            type="button"
            className="photo-preview-send-btn"
            onClick={onSend}
            disabled={uploading || isBlocked}
            title={uploading ? "Uploading..." : "Send photo"}
            aria-label="Send photo"
          >
            {uploading ? (
              <Loader2 size={15} className="photo-spinner" />
            ) : (
              <Send size={15} />
            )}
            <span>{uploading ? "Sending..." : "Send"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

