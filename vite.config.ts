import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { advertisingConfig, adsTxt } from "./shared/advertising";
import articles from "./content/blog/articles.json";

export default defineConfig(({ mode }) => {
  const settings = advertisingConfig({
    ...loadEnv(mode, import.meta.dirname, ""),
    ...process.env,
  });
  const advertisingPlugin: Plugin = {
    name: "meetly-advertising",
    transformIndexHtml() {
      return settings.publisherId
        ? [
            {
              tag: "meta",
              attrs: {
                name: "google-adsense-account",
                content: settings.publisherId,
              },
              injectTo: "head",
            },
            {
              tag: "script",
              attrs: { id: "meetly-ad-request-policy" },
              children: `window.adsbygoogle=window.adsbygoogle||[];window.adsbygoogle.pauseAdRequests=(${JSON.stringify(settings.enabled)}&&window.self===window.top&&${JSON.stringify(articles.filter(article => article.isPublished).map(article => `/blog/${article.slug}`))}.includes(window.location.pathname.replace(/\\/$/,"")))?0:1;`,
              injectTo: "head-prepend",
            },
            {
              tag: "script",
              attrs: {
                id: "meetly-adsense",
                async: true,
                src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.publisherId}`,
                crossorigin: "anonymous",
                onerror: "this.dataset.loadFailed='true'",
              },
              injectTo: "head",
            },
          ]
        : [];
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "ads.txt",
        source: adsTxt(settings.publisherId),
      });
    },
    configureServer(server) {
      server.middlewares.use("/ads.txt", (_req, res) => {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end(adsTxt(settings.publisherId));
      });
    },
  };
  return {
    plugins: [react(), tailwindcss(), advertisingPlugin],
    define: {
      __MEETLY_ADVERTISING__: JSON.stringify({
        ...settings,
        articlePaths: articles
          .filter(article => article.isPublished)
          .map(article => `/blog/${article.slug}`),
      }),
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
      },
    },
    envDir: path.resolve(import.meta.dirname),
    root: path.resolve(import.meta.dirname, "client"),
    publicDir: path.resolve(import.meta.dirname, "client", "public"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      host: true,
      port: 3000,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
