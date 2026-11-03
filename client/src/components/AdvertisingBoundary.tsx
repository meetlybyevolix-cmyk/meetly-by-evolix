import { useLayoutEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { advertising, initialDocumentPath, isAdvertisingPage } from "@/adsense";

/** Removing a script cannot unload third-party JS. Enter/leave an eligible article
 * with a fresh document before rendering any chat or camera controls in it.
 * Auto ads are account-controlled; there are no fabricated manual ad slots.
 */
export function AdvertisingBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const requiresNewDocument =
    advertising.enabled &&
    location !== initialDocumentPath &&
    (isAdvertisingPage(initialDocumentPath) || isAdvertisingPage(location));
  useLayoutEffect(() => {
    if (requiresNewDocument) window.location.reload();
  }, [requiresNewDocument]);
  return requiresNewDocument ? null : children;
}
