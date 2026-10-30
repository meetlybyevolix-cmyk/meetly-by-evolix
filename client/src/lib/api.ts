/**
 * Meetly Client API & WebSocket Endpoint Resolver
 * Supports both same-origin deployment (Render/VPS) and decoupled deployment (Cloudflare Pages/Workers/Netlify)
 */

export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
const DEFAULT_RENDER_BACKEND = "https://meetly-by-evolix.onrender.com";

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (BACKEND_URL) {
    return `${BACKEND_URL}${cleanPath}`;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // If running on Cloudflare (*.workers.dev, *.pages.dev) or decoupled domain, point to live Render backend
    if (host !== "localhost" && host !== "127.0.0.1" && !host.includes("meetly-by-evolix.onrender.com")) {
      return `${DEFAULT_RENDER_BACKEND}${cleanPath}`;
    }
  }
  return cleanPath;
}

export function getWsUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (BACKEND_URL) {
    const wsBase = BACKEND_URL.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
    return `${wsBase}${cleanPath}`;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // If running on Cloudflare (*.workers.dev, *.pages.dev) or decoupled domain, point to live Render backend
    if (host !== "localhost" && host !== "127.0.0.1" && !host.includes("meetly-by-evolix.onrender.com")) {
      return `wss://meetly-by-evolix.onrender.com${cleanPath}`;
    }
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${cleanPath}`;
}
