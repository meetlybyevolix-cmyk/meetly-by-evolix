import { useEffect } from "react";

export interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: "website" | "article";
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  noindex?: boolean;
}

const BASE_URL = "https://meet-ly.in";

export default function SEOHead({
  title,
  description,
  canonicalPath = "",
  ogType = "website",
  jsonLd,
  noindex = false,
}: SEOHeadProps) {
  useEffect(() => {
    // 1. Update document title
    const prevTitle = document.title;
    document.title = title;

    // Helper to get or create a meta tag
    const setMeta = (attr: "name" | "property", key: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // 2. Standard Meta
    setMeta("name", "description", description);

    // 3. Robots
    setMeta("name", "robots", noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");

    // 4. Canonical
    const cleanPath = `/${canonicalPath.split(/[?#]/)[0].replace(/^\/+|\/+$/g, "")}`;
    const canonicalUrl = `${BASE_URL}${cleanPath}`;
    let canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute("href", canonicalUrl);

    // 5. Open Graph
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:type", ogType);

    // 6. Twitter
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:url", canonicalUrl);

    // 7. Structured Data (JSON-LD)
    let scriptEl: HTMLScriptElement | null = null;
    if (jsonLd) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.setAttribute("data-seo-component", "true");
      scriptEl.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(scriptEl);
    }

    return () => {
      document.title = prevTitle;
      if (scriptEl && scriptEl.parentNode) {
        scriptEl.parentNode.removeChild(scriptEl);
      }
    };
  }, [title, description, canonicalPath, ogType, jsonLd, noindex]);

  return null;
}

