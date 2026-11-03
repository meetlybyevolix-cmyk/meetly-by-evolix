// Run any Playwright CLI snippet without Windows shell argument rewriting.
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const cli = process.env.PLAYWRIGHT_CLI_PATH;
if (!cli)
  throw new Error(
    "Set PLAYWRIGHT_CLI_PATH to the installed @playwright/cli entry point."
  );
const result = spawnSync(
  process.execPath,
  [
    cli,
    "-s=meetly-adsense",
    "run-code",
    fs.readFileSync(process.argv[2], "utf8").trim().replace(/;$/, ""),
  ],
  { stdio: "inherit" }
);
process.exit(result.status ?? 1);
