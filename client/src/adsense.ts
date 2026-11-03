/** Head entry: never load advertising in the chat document or an embedded preview. */
declare const __MEETLY_ADVERTISING__: {
  publisherId: string;
  enabled: boolean;
  articlePaths: string[];
};

export const advertising = __MEETLY_ADVERTISING__;
export const initialDocumentPath = window.location.pathname;

export function isAdvertisingPage(path: string) {
  return advertising.articlePaths.includes(path.replace(/\/$/, ""));
}

export function loadAdvertising() {
  if (
    !advertising.enabled ||
    !isAdvertisingPage(window.location.pathname) ||
    window.self !== window.top
  )
    return;
  if (
    document.querySelector(
      'script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
    )
  )
    return;
  const script = document.createElement("script");
  script.id = "meetly-adsense";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${advertising.publisherId}`;
  script.onerror = () => {
    // Ad blockers/network failures must not affect authentication, navigation or chat.
    // Keep the element to prevent retry loops and duplicate requests.
    script.dataset.loadFailed = "true";
  };
  document.head.appendChild(script);
}

loadAdvertising();
