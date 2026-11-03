import { afterEach, describe, expect, it, vi } from "vitest";
import {
  adsTxt,
  advertisingConfig,
  validPublisherId,
} from "../shared/advertising";
import fs from "node:fs";
import { transformSync } from "esbuild";

// Google's documentation example. Used only with a mocked DOM; never served as a real publisher.
const exampleId = "ca-pub-1234567890123456";
const articlePath = "/blog/example-guide";
const source = fs.readFileSync(
  new URL("../client/src/adsense.ts", import.meta.url),
  "utf8"
);

afterEach(() => vi.unstubAllGlobals());

function runLoader(
  path: string,
  enabled = true,
  framed = false,
  existing = false
) {
  const appendChild = vi.fn();
  const head = { appendChild };
  const doc = {
    head,
    querySelector: vi.fn(() => (existing ? {} : null)),
    createElement: () => ({ dataset: {} }),
  };
  const win = { location: { pathname: path }, self: {}, top: {} };
  if (!framed) win.top = win.self;
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", doc);
  const js = transformSync(source, {
    loader: "ts",
    format: "cjs",
    define: {
      __MEETLY_ADVERTISING__: JSON.stringify({
        publisherId: exampleId,
        enabled,
        articlePaths: [articlePath],
      }),
    },
  }).code;
  new Function("module", "exports", js)({ exports: {} }, {});
  return { appendChild, doc };
}

describe("Advertising configuration and isolation", () => {
  it("defaults off and never substitutes a publisher ID", () => {
    expect(advertisingConfig({})).toEqual({ publisherId: "", enabled: false });
    for (const id of [
      "ca-pub-XXXXXXXXXXXXXXXX",
      "pub-123",
      "ca-pub-0000000000000000",
      "<script>",
    ]) {
      expect(validPublisherId(id)).toBe("");
    }
    expect(() => advertisingConfig({ ENABLE_ADS: "true" })).toThrow(
      "ADSENSE_CLIENT_ID"
    );
    expect(adsTxt("")).not.toContain("google.com,");
  });
  it("requires both operator activation and confirmed CMP setup", () => {
    expect(
      advertisingConfig({ ADSENSE_CLIENT_ID: exampleId, ENABLE_ADS: "true" })
        .enabled
    ).toBe(false);
    expect(
      advertisingConfig({
        ADSENSE_CLIENT_ID: exampleId,
        ENABLE_ADS: "true",
        ADSENSE_CMP_READY: "true",
      }).enabled
    ).toBe(true);
    expect(adsTxt(exampleId)).toBe(
      "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n"
    );
  });
  it.each([
    "/",
    "/privacy",
    "/terms",
    "/safety",
    "/grievance",
    "/data-rights",
    "/blog",
    "/blog/missing",
    "/404",
  ])("never loads ads on %s", path => {
    expect(runLoader(path).appendChild).not.toHaveBeenCalled();
  });
  it("places exactly one async, anonymous script in head only for eligible top-level articles", () => {
    const { appendChild } = runLoader(articlePath);
    expect(appendChild).toHaveBeenCalledTimes(1);
    const script = appendChild.mock.calls[0][0];
    expect(script.src).toBe(
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${exampleId}`
    );
    expect(script.async).toBe(true);
    expect(script.crossOrigin).toBe("anonymous");
    expect(() => script.onerror()).not.toThrow();
    expect(script.dataset.loadFailed).toBe("true");
    expect(runLoader(articlePath, false).appendChild).not.toHaveBeenCalled();
    expect(
      runLoader(articlePath, true, true).appendChild
    ).not.toHaveBeenCalled();
    expect(
      runLoader(articlePath, true, false, true).appendChild
    ).not.toHaveBeenCalled();
  });
});
