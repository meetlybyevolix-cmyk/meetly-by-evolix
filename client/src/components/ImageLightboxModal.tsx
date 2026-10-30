import React, { useEffect } from "react";
import { X, Flag, Download } from "lucide-react";

export interface LightboxMedia {
  id: string;
  url: string;
  mimeType?: string;
  width?: number;
  height?: number;
  fromMe?: boolean;
}

interface ImageLightboxModalProps {
  media: LightboxMedia | null;
  onClose: () => void;
  onReport?: (mediaId: string) => void;
}

export default function ImageLightboxModal({
  media,
  onClose,
  onReport,
}: ImageLightboxModalProps) {
  useEffect(() => {
    if (!media) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [media, onClose]);

  if (!media) return null;

  return (
    <div
      className="image-lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Full-size photo preview"
      onClick={onClose}
    >
      <div
        className="image-lightbox-container"
        onClick={e => e.stopPropagation()}
      >
        <div className="image-lightbox-header">
          <span className="image-lightbox-title">
            {media.fromMe ? "Photo sent by you" : "Photo from stranger"}
          </span>
          <div className="image-lightbox-actions">
            {!media.fromMe && onReport && (
              <button
                type="button"
                className="image-lightbox-btn report"
                onClick={() => onReport(media.id)}
                title="Report photo"
                aria-label="Report photo"
              >
                <Flag size={15} />
                <span>Report</span>
              </button>
            )}
            <button
              type="button"
              className="image-lightbox-btn close"
              onClick={onClose}
              title="Close preview (Esc)"
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="image-lightbox-body">
          <img
            src={media.url}
            alt="Full-size shared photo"
            className="image-lightbox-img"
            loading="eager"
          />
        </div>
      </div>
    </div>
  );
}

