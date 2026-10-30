/**
 * Meetly Client API & WebSocket Endpoint Resolver
 * Supports both same-origin deployment (Render/VPS) and decoupled deployment (Cloudflare Pages/Netlify)
 */

export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (BACKEND_URL) {
    return `${BACKEND_URL}${cleanPath}`;
  }
  // If hosted on Cloudflare Pages without a proxy, point to the live Render backend
  if (typeof window !== "undefined" && window.location.hostname.endsWith(".pages.dev") && !BACKEND_URL) {
    return `https://meetly-by-evolix.onrender.com${cleanPath}`;
  }
  return cleanPath;
}

export function getWsUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (BACKEND_URL) {
    const wsBase = BACKEND_URL.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
    return `${wsBase}${cleanPath}`;
  }
  // If hosted on Cloudflare Pages, connect WebSocket directly to the live Render backend
  if (typeof window !== "undefined" && window.location.hostname.endsWith(".pages.dev")) {
    return `wss://meetly-by-evolix.onrender.com${cleanPath}`;
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${cleanPath}`;
}

