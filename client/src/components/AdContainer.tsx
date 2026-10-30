import React, { useEffect, useState } from "react";

interface AdContainerProps {
  slotId?: string;
  format?: "auto" | "rectangle" | "horizontal";
  className?: string;
}

/**
 * AdContainer: Privacy-by-design Google AdSense & Publisher Advertising Component.
 *
 * Rules:
 * 1. NEVER active on live chat, video calling, searching, or error states.
 * 2. Active ONLY on eligible informational/legal pages.
 * 3. Does not load external scripts or display mock ads unless explicitly enabled
 *    in environment configuration with a valid publisher ID.
 */
export function AdContainer({
  slotId,
  format = "auto",
  className = "",
}: AdContainerProps) {
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [clientId, setClientId] = useState("");

  useEffect(() => {
    // Check legal configuration from server
    fetch("/api/legal-config")
      .then(r => (r.ok ? r.json() : null))
      .then(config => {
        if (config?.enableAds && config?.adsenseClientId) {
          setAdsEnabled(true);
          setClientId(config.adsenseClientId);
        }
      })
      .catch(() => {
        setAdsEnabled(false);
      });
  }, []);

  // If ads are disabled (the default), render nothing to keep the interface clean and tracker-free
  if (!adsEnabled || !clientId) {
    return null;
  }

  return (
    <div
      className={`ad-container-wrapper ${className}`}
      style={{
        margin: "24px 0",
        textAlign: "center",
        overflow: "hidden",
      }}
      aria-label="Sponsored Advertisement"
    >
      <div
        style={{
          fontSize: "11px",
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "4px",
        }}
      >
        Advertisement
      </div>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slotId || "0000000000"}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

