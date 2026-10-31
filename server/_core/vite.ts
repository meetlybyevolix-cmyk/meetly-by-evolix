import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const candidates = [
        path.resolve(import.meta.dirname, "../../client/index.html"),
        path.resolve(import.meta.dirname, "../client/index.html"),
        path.resolve(process.cwd(), "client/index.html"),
      ];
      const clientTemplate =
        candidates.find(c => fs.existsSync(c)) ||
        path.resolve(process.cwd(), "client/index.html");

      // always reload the index.html file from disk in case it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const candidates = [
    path.resolve(import.meta.dirname, "public"),
    path.resolve(import.meta.dirname, "../dist/public"),
    path.resolve(import.meta.dirname, "../../dist/public"),
    path.resolve(process.cwd(), "dist/public"),
  ];
  const distPath =
    candidates.find(c => fs.existsSync(c)) ||
    path.resolve(process.cwd(), "dist/public");

  if (!fs.existsSync(distPath)) {
    console.warn(
      `[Static Serving] Could not find static directory: ${distPath}. Make sure to build client first.`
    );
  }

  // Explicit robots.txt and sitemap.xml endpoints with proper Content-Type and caching
  app.get("/robots.txt", (_req, res) => {
    const robotsPath = path.resolve(distPath, "robots.txt");
    if (fs.existsSync(robotsPath)) {
      res.type("text/plain").set("Cache-Control", "public, max-age=86400").sendFile(robotsPath);
    } else {
      res.type("text/plain").send("User-agent: *\nAllow: /\nSitemap: https://meet-ly.in/sitemap.xml\n");
    }
  });

  app.get("/sitemap.xml", (_req, res) => {
    const sitemapPath = path.resolve(distPath, "sitemap.xml");
    if (fs.existsSync(sitemapPath)) {
      res.type("application/xml").set("Cache-Control", "public, max-age=86400").sendFile(sitemapPath);
    } else {
      res.status(404).end();
    }
  });

  app.use(express.static(distPath));

  // the app's not-found page keeps a real 404 status for crawlers
  app.get("/404", (_req, res) => {
    res.status(404).sendFile(path.resolve(distPath, "index.html"));
  });

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
