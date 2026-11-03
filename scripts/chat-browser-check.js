// Playwright CLI snippet: local test backend with ALLOW_MOCK_GOOGLE_AUTH=true.
// Camera/audio are synthetic streams; no real accounts, webcam or public chat.
async page => {
  const browser = page.context().browser();
  const contexts = [];
  const people = [];
  const failures = [];
  let stage = "setup";
  const adSelector =
    'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]';
  try {
    for (const name of ["Alice", "Bob"]) {
      const context = await browser.newContext({
        viewport: { width: name === "Alice" ? 1440 : 390, height: 900 },
      });
      contexts.push(context);
      await context.route("https://accounts.google.com/**", route =>
        route.fulfill({
          status: 200,
          contentType: "application/javascript",
          body: "",
        })
      );
      await context.route("https://pagead2.googlesyndication.com/**", route =>
        route.abort()
      );
      await context.addInitScript(() => {
        window.__testMedia = [];
        navigator.mediaDevices.getUserMedia = async () => {
          const canvas = document.createElement("canvas");
          canvas.width = 320;
          canvas.height = 240;
          const draw = canvas.getContext("2d");
          draw.fillStyle = "#153c8a";
          draw.fillRect(0, 0, 320, 240);
          const video = canvas.captureStream(5);
          let frame = 0;
          setInterval(() => {
            draw.fillStyle = frame++ % 2 ? "#153c8a" : "#2046a0";
            draw.fillRect(0, 0, 320, 240);
          }, 150);
          const audio = new AudioContext();
          const destination = audio.createMediaStreamDestination();
          const oscillator = audio.createOscillator();
          oscillator.connect(destination);
          oscillator.start();
          void audio.resume();
          const stream = new MediaStream([
            ...video.getTracks(),
            ...destination.stream.getTracks(),
          ]);
          window.__testMedia.push(stream);
          return stream;
        };
      });
      const person = await context.newPage();
      await person.goto("http://127.0.0.1:3100/");
      const response = await context.request.post(
        "http://127.0.0.1:3100/api/auth/google",
        {
          data: {
            idToken: `mock-google-token:browser-${name}:${name}:${name.toLowerCase()}@example.test`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok())
        throw new Error(`Local mock auth failed: ${response.status()}`);
      await person.evaluate(data => {
        localStorage.setItem("meetly-auth-token", data.sessionToken);
        localStorage.setItem("meetly-user-profile", JSON.stringify(data.user));
      }, data);
      await person.reload();
      await person
        .getByRole("button", { name: "Start chatting", exact: true })
        .click();
      const find = person.getByRole("button", { name: /Find someone to/ });
      if (await find.isEnabled())
        failures.push("Matchmaking enabled without active consent");
      await person.getByRole("checkbox", { name: /I confirm I am 18/ }).check();
      people.push(person);
    }
    stage = "text chat";
    // First verify ordinary text chat and teardown.
    for (const person of people)
      await person.getByRole("button", { name: /Find someone to/ }).click();
    for (const person of people)
      await person
        .getByText("Connected with someone new", { exact: false })
        .first()
        .waitFor();
    await people[0]
      .getByRole("textbox", { name: "Type a message" })
      .fill("Hello from the desktop browser");
    await people[0]
      .getByRole("textbox", { name: "Type a message" })
      .press("Enter");
    await people[0].screenshot({
      path: "output/playwright/text-sender.png",
      fullPage: true,
    });
    await people[1].screenshot({
      path: "output/playwright/text-receiver.png",
      fullPage: true,
    });
    await people[1]
      .getByText("Hello from the desktop browser", { exact: false })
      .waitFor();
    for (const person of people) {
      if (await person.evaluate(() => window.adsbygoogle?.pauseAdRequests) !== 1)
        failures.push("Ad requests are not paused in text chat");
    }
    stage = "switching to video";
    // End and return to the same existing UI to select video.
    for (const person of people) {
      const leave = person.getByRole("button", {
        name: "End chat",
        exact: true,
      });
      if (await leave.count()) await leave.click();
      const cancel = person.getByRole("button", {
        name: "Cancel search",
        exact: true,
      });
      if (await cancel.count()) await cancel.click();
      await person.goto("http://127.0.0.1:3100/");
      await person
        .getByRole("button", { name: "Start chatting", exact: true })
        .click();
      await person.getByRole("button", { name: /Video chat/ }).click();
      await person.getByRole("checkbox", { name: /I confirm I am 18/ }).check();
    }
    for (const person of people)
      await person.getByRole("button", { name: /Find someone to/ }).click();
    stage = "remote video playback";
    for (const person of people) {
      await person.waitForFunction(
        () =>
          [...document.querySelectorAll("video")].some(
            video =>
              !video.muted &&
              video.srcObject?.getVideoTracks().length > 0 &&
              video.readyState >= 2
          ),
        null,
        { timeout: 20000 }
      );
      if (await person.evaluate(() => window.adsbygoogle?.pauseAdRequests) !== 1)
        failures.push("Ad requests are not paused in active video call");
    }
    await people[0].screenshot({
      path: "output/playwright/video-desktop.png",
      fullPage: true,
    });
    await people[1].screenshot({
      path: "output/playwright/video-mobile.png",
      fullPage: true,
    });
    await people[0]
      .getByRole("button", { name: "Mute Microphone", exact: true })
      .click();
    await people[0]
      .getByRole("button", { name: "Unmute Microphone", exact: true })
      .waitFor();
    await people[0]
      .getByRole("button", { name: "Turn Off Camera", exact: true })
      .click();
    await people[0]
      .getByRole("button", { name: "Turn On Camera", exact: true })
      .waitFor();
    await people[0]
      .getByRole("button", { name: "End Call", exact: true })
      .click();
    stage = "stopping devices after both users leave";
    // Existing behavior rematches the remaining partner and keeps media warm.
    // That user must cancel their search before all of their tracks should stop.
    await people[1]
      .getByRole("button", { name: "Cancel search", exact: true })
      .click();
    for (const person of people)
      await person.waitForFunction(() =>
        window.__testMedia
          .flatMap(stream => stream.getTracks())
          .every(track => track.readyState === "ended")
      );
    if (failures.length) throw new Error(failures.join("; "));
    return {
      consentGate: "passed",
      textDelivery: "passed",
      webRTCRemotePlayback: "passed for desktop and mobile",
      mediaStoppedOnLeave: "passed",
      noAdsInChatOrVideo: "passed",
      cameraAndMicrophoneControls: "passed",
    };
  } catch (error) {
    const state = [];
    for (const person of people) {
      if (person.isClosed()) continue;
      await person.screenshot({
        path: `output/playwright/call-failure-${state.length}.png`,
        fullPage: true,
      });
      state.push(
        await person.evaluate(() => ({
          text: document.querySelector("main")?.innerText.slice(0, 900),
          videos: [...document.querySelectorAll("video")].map(video => ({
            muted: video.muted,
            state: video.readyState,
            paused: video.paused,
            tracks: video.srcObject
              ?.getTracks()
              .map(track => ({
                kind: track.kind,
                state: track.readyState,
                muted: track.muted,
              })),
          })),
        }))
      );
    }
    throw new Error(`${stage}: ${error.message}; ${JSON.stringify(state)}`);
  } finally {
    for (const context of contexts) await context.close();
  }
};
