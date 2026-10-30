import React, { useState } from "react";
import { Flag, Eye, EyeOff, ShieldAlert } from "lucide-react";
import type { LightboxMedia } from "./ImageLightboxModal";

export interface ChatImageItem {
  id: string;
  url: string;
  mimeType?: string;
  width?: number;
  height?: number;
  isFlagged?: boolean;
}

interface ChatImageBubbleProps {
  media: ChatImageItem;
  caption?: string;
  fromMe: boolean;
  sentAt?: number;
  onOpenLightbox: (media: LightboxMedia) => void;
  onReportImage?: (mediaId: string) => void;
}

export default function ChatImageBubble({
  media,
  caption,
  fromMe,
  sentAt,
  onOpenLightbox,
  onReportImage,
}: ChatImageBubbleProps) {
  const [revealed, setRevealed] = useState(!media.isFlagged);
  const [isReported, setIsReported] = useState(false);

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReported(true);
    setRevealed(false);
    onReportImage?.(media.id);
  };

  const handleImageClick = () => {
    if (!revealed) {
      setRevealed(true);
      return;
    }
    onOpenLightbox({
      id: media.id,
      url: media.url,
      mimeType: media.mimeType,
      width: media.width,
      height: media.height,
      fromMe,
    });
  };

  const isObscured = !revealed || isReported;

  return (
    <div className={`chat-image-bubble-container ${fromMe ? "mine" : "theirs"}`}>
      <div
        className={`chat-image-wrap ${isObscured ? "obscured" : ""}`}
        onClick={handleImageClick}
        title={isObscured ? "Click to reveal photo" : "Click to enlarge photo"}
      >
        <img
          src={media.url}
          alt={caption || "Shared chat photo"}
          className={`chat-inline-img ${isObscured ? "blurred" : ""}`}
          loading="lazy"
        />

        {isObscured && (
          <div className="chat-image-obscured-overlay">
            <ShieldAlert size={20} className="obscured-icon" />
            <span className="obscured-title">
              {isReported ? "Reported photo" : "Flagged sensitive photo"}
            </span>
            <button
              type="button"
              className="obscured-reveal-btn"
              onClick={e => {
                e.stopPropagation();
                setRevealed(true);
              }}
            >
              <Eye size={12} />
              <span>Reveal photo</span>
            </button>
          </div>
        )}

        {!fromMe && !isReported && onReportImage && (
          <button
            type="button"
            className="chat-image-quick-report"
            onClick={handleReport}
            title="Report photo"
            aria-label="Report photo"
          >
            <Flag size={12} />
          </button>
        )}
      </div>

      {caption && <p className="chat-image-caption">{caption}</p>}

      {sentAt && (
        <time className="chat-image-timestamp">
          {new Intl.DateTimeFormat(undefined, {
            hour: "numeric",
            minute: "2-digit",
          }).format(sentAt)}
        </time>
      )}
    </div>
  );
}

