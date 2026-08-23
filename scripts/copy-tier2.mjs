// /tier2 is routed client-side (see src/main.tsx) — the app checks
// window.location.pathname and decides which page to render. That works
// fine for in-app navigation, but a direct visit or refresh on /tier2
// hits the static host first, and it has no idea that path is valid.
//
// The "correct" fix is a server rewrite (see public/.htaccess), but that
// depends on the host actually honoring .htaccess — confirmed NOT the
// case on this Hostinger staging subdomain (a random nonsense path 404s
// the same way /tier2 does, meaning mod_rewrite isn't being applied at
// all here). So instead: physically duplicate the built index.html to
// dist/tier2/index.html. Now /tier2 is a real file the host can serve
// directly, no rewrite required — the JS bundle it loads is identical,
// and main.tsx's own pathname check still picks the right page.
import { copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const distDir = path.resolve(import.meta.dirname, "..", "dist");
const src = path.join(distDir, "index.html");
const destDir = path.join(distDir, "tier2");
const dest = path.join(destDir, "index.html");

if (!existsSync(src)) {
  console.error("[copy-tier2] dist/index.html not found — did the build run first?");
  process.exit(1);
}

await mkdir(destDir, { recursive: true });
await copyFile(src, dest);
console.log("[copy-tier2] wrote dist/tier2/index.html");
