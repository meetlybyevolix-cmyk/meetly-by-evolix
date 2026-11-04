// Playwright CLI snippet; local built server on port 3100. Ads and GIS are mocked.
async page => {
  const base = "http://127.0.0.1:3100";
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("https://pagead2.googlesyndication.com/**", route => route.abort());
  await page.route("https://accounts.google.com/**", route => route.fulfill({status:200,contentType:"application/javascript",body:""}));
  await page.route("**/api/trpc/chat.stats*", route => route.fulfill({status:200,contentType:"application/json",body:JSON.stringify([{result:{data:{json:{onlineCount:2,activeSessions:2,activeRooms:0,queuedUsers:0,syntheticCount:0}}}}])}));
  const check = (test, message) => { if (!test) throw new Error(message); };
  const routes = [
    ["/", "Meetly | Make Friends Online & Talk to Strangers"],
    ["/make-friends-online", "Make Friends Online Free | Meetly Text & Video Chat"],
    ["/chat-with-strangers", "Talk to Strangers Online | Free Chat on Meetly"],
  ];
  for (const width of [1440,390]) {
    await page.setViewportSize({width,height:900});
    for (const [route,title] of routes) {
      await page.goto(base+route);
      await page.getByRole("region",{name:"Notifications alt+T"}).waitFor({state:"attached"});
      await page.evaluate(()=>document.fonts.ready);
      check(await page.title() === title, "Wrong title on "+route);
      check(await page.locator('link[rel="canonical"]').getAttribute("href") === "https://meet-ly.in"+route,"Wrong canonical on "+route);
      check(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),"Overflow on "+route);
      if (route==="/") await page.getByText("122 online now",{exact:true}).first().waitFor();
      else await page.getByRole("heading",{level:2,name:route==="/make-friends-online"?"Make friends online for free, one conversation at a time":"Talk to strangers online using text or video",exact:true}).waitFor();
    }
  }
  // Client-side navigation should update the canonical as well as direct loads.
  await page.getByRole("link",{name:"Meetly Home",exact:true}).click();
  await page.getByText("122 online now",{exact:true}).first().waitFor();
  check(await page.locator('link[rel="canonical"]').getAttribute("href")==="https://meet-ly.in/","Home canonical drifted after navigation");
  const notFound=await page.goto(base+"/not-a-real-seo-page");
  check(notFound.status()===404,"Unknown page is a soft 404");
  check((await page.content()).includes('noindex'),"Missing error-page noindex");
  check(errors.length===0,"Application errors: "+errors.join("; "));
  return {pageViewportChecks:6,counter:"120 baseline + 2 real sessions = 122",canonicalNavigation:"passed",missingPage:"404/noindex",applicationErrors:errors};
}
