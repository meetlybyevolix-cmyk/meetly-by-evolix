import fs from "node:fs";
import path from "node:path";

const distPublic = path.resolve(process.cwd(), "dist", "public");
if (fs.existsSync(distPublic)) {
  fs.rmSync(distPublic, { recursive: true, force: true });
  console.log(`[Clean] Purged build cache at ${distPublic}`);
}
