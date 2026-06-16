// Post-process the Expo web export so it can be hosted on static hosts (Netlify)
// that silently drop directories whose names start with a dot.
//
// pnpm stores packages under `node_modules/.pnpm/...`, and Expo hashes bundled
// assets (e.g. fonts) into paths like `assets/__node_modules/.pnpm/<pkg>/...`.
// Netlify does not upload dot-directories, so those font files 404 on deploy and
// the SPA fallback (`/* -> /index.html`) serves HTML instead, producing
// "Failed to decode downloaded font" / "OTS parsing error" in the browser.
//
// This script renames the dotted `.pnpm` asset directory to `pnpm` and rewrites
// the matching URL string inside the exported bundles so the references stay in
// sync. It is idempotent: re-running after a clean export is a no-op.

import { promises as fs } from "node:fs";
import path from "node:path";

const DIST = path.resolve(process.cwd(), "dist");
const OLD_DIR = path.join(DIST, "assets", "__node_modules", ".pnpm");
const NEW_DIR = path.join(DIST, "assets", "__node_modules", "pnpm");
const FROM = "__node_modules/.pnpm";
const TO = "__node_modules/pnpm";
const TEXT_EXT = new Set([".js", ".html", ".json", ".css", ".map"]);

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

async function main() {
  if (!(await exists(DIST))) {
    console.error(`[postexport-web] dist not found at ${DIST}`);
    process.exit(1);
  }

  if (await exists(OLD_DIR)) {
    // Guard against EEXIST if a stale target survived a previous run.
    if (await exists(NEW_DIR)) {
      await fs.rm(NEW_DIR, { recursive: true, force: true });
    }
    await fs.rename(OLD_DIR, NEW_DIR);
    console.log(`[postexport-web] renamed .pnpm asset dir -> pnpm`);
  } else {
    console.log(`[postexport-web] no .pnpm asset dir (already processed or none)`);
  }

  let patched = 0;
  for await (const file of walk(DIST)) {
    if (!TEXT_EXT.has(path.extname(file))) continue;
    const content = await fs.readFile(file, "utf8");
    if (!content.includes(FROM)) continue;
    await fs.writeFile(file, content.split(FROM).join(TO));
    patched += 1;
  }
  console.log(`[postexport-web] patched ${patched} file(s) referencing ${FROM}`);
}

main().catch((err) => {
  console.error("[postexport-web] failed:", err);
  process.exit(1);
});
