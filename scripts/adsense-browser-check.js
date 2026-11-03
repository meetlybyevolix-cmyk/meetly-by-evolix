// Playwright CLI run-code snippet. Run against the local, built server on port 3100.
// For activation tests, use Google's documented example ID in a LOCAL build only,
// ENABLE_ADS=true and ADSENSE_CMP_READY=true. All Google ad requests are intercepted.
async page => {
  const base = "http://127.0.0.1:3100";
  const guide = "/blog/how-to-chat-safely-with-strangers-online";
  const adSelector =
    'head script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]';
  const failures = [];
  let adRequests = 0;
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("https://accounts.google.com/**", route =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "",
    })
  );
  await page.route("https://pagead2.googlesyndication.com/**", route => {
    adRequests++;
    return route.abort();
  });
  const check = (value, message) => {
    if (!value) failures.push(message);
  };
  const routes = [
    "/",
    "/about",
    "/privacy",
    "/terms",
    "/community-guidelines",
    "/safety",
    "/cookies",
    "/grievance",
    "/data-rights",
    "/blog",
    "/make-friends-online",
    "/talk-to-someone-online",
    "/chat-with-strangers",
    "/random-video-chat",
    "/anonymous-text-chat",
    "/blog/not-a-guide",
    "/404",
    guide,
  ];
  const layouts = [];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(base + route, { waitUntil: "domcontentloaded" });
      await page
        .getByRole("region", { name: "Notifications alt+T" })
        .waitFor({ state: "attached" });
      await page.getByRole("heading", { level: 1 }).first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      const result = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        title: document.title,
        canonical: document
          .querySelector('link[rel="canonical"]')
          ?.getAttribute("href"),
        viewport: document
          .querySelector('meta[name="viewport"]')
          ?.getAttribute("content"),
      }));
      check(!result.overflow, `${width}px horizontal overflow on ${route}`);
      check(!result.viewport.includes("maximum-scale"), "Zoom is restricted");
      const count = await page.locator(adSelector).count();
      check(
        count === 1,
        `${route}: unexpected AdSense count ${count}`
      );
      check(await page.evaluate(() => window.adsbygoogle.pauseAdRequests) === (route === guide ? 0 : 1), `Incorrect ad request policy on ${route}`);
      if (route === guide) {
        await page.waitForFunction(
          () =>
            document.getElementById("meetly-adsense")?.dataset.loadFailed ===
            "true"
        );
        check(
          (await page.locator(adSelector).getAttribute("async")) !== null,
          "Missing async"
        );
        check(
          (await page.locator(adSelector).getAttribute("crossorigin")) ===
            "anonymous",
          "Missing crossorigin"
        );
        await page.screenshot({
          path: `output/playwright/guide-${width}.png`,
          fullPage: true,
        });
      }
      layouts.push({ route, width, overflow: result.overflow });
    }
  }
  // A user navigation from an advertising document must unload that document.
  await page.goto(base + guide);
  await page.evaluate(() => {
    window.__meetlyAdDocumentSentinel = true;
  });
  await page.getByRole("link", { name: "Meetly Home", exact: true }).click();
  await page.waitForFunction(
    () => location.pathname === "/" && !window.__meetlyAdDocumentSentinel
  );
  check(
    (await page.evaluate(() => window.adsbygoogle.pauseAdRequests)) === 1,
    "Ad requests are not paused in chat"
  );
  await page.goBack();
  await page.locator(adSelector).waitFor({ state: "attached" });
  check(
    (await page.locator(adSelector).count()) === 1,
    "History duplicated advertising"
  );
  const txt = await page.request.get(base + "/ads.txt");
  check(
    txt.status() === 200 &&
      txt.headers()["content-type"].includes("text/plain"),
    "ads.txt not plain text 200"
  );
  const home = await page.request.get(base + "/");
  check(
    (await home.text()).includes('name="google-adsense-account"'),
    "Verification meta missing from server HTML"
  );
  check(
    home.headers()["x-frame-options"] === "DENY",
    "Framing protection removed"
  );
  check(errors.length === 0, `Application errors: ${errors.join("; ")}`);
  if (failures.length) throw new Error(JSON.stringify(failures));
  return {
    checks: layouts.length,
    adRequestsIntercepted: adRequests,
    applicationErrors: errors,
    navigationIsolation: "passed",
    adsTxt: await txt.text(),
  };
};
