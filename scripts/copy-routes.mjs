// /tier2 is served as a real static route so a direct visit or refresh works
// on simple hosts that do not apply the rewrite rules in public/.htaccess.
//
// The "correct" fix is a server rewrite (see public/.htaccess), but that
// depends on the host actually honoring .htaccess — confirmed NOT the
// case on this Hostinger staging subdomain (a random nonsense path 404s
// the same way /tier2 does, meaning mod_rewrite isn't being applied at
// all here). So instead: physically duplicate the built index.html to
// dist/tier2/index.html. Now /tier2 is a real file the host can serve
// directly, no rewrite required.
import { copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const distDir = path.resolve(import.meta.dirname, "..", "dist");
const src = path.join(distDir, "index.html");
const routes = [
  "tier2", "asia",
  "asia/maldives", "asia/thailand", "asia/sri-lanka", "asia/india", "asia/malaysia",
  "alpine",
  "alpine/switzerland", "alpine/france", "alpine/italy", "alpine/finland", "alpine/antarctica",
  "coast",
  "coast/italy", "coast/france", "coast/greece", "coast/spain", "coast/seychelles", "coast/indonesia",
  "desert",
  "desert/oman", "desert/uae", "desert/qatar", "desert/saudi-arabia", "desert/morocco",
  "coast/caribbean", "alpine/andes",
  "cities/london", "cities/paris", "cities/geneva", "cities/zurich", "cities/milan",
  "cities/venice", "cities/florence", "cities/vienna-salzburg", "cities/dusseldorf", "cities/new-york"
];

if (!existsSync(src)) {
  console.error("[copy-routes] dist/index.html not found — did the build run first?");
  process.exit(1);
}

for (const route of routes) {
  const destDir = path.join(distDir, route);
  const dest = path.join(destDir, "index.html");
  await mkdir(destDir, { recursive: true });
  await copyFile(src, dest);
  console.log(`[copy-routes] wrote dist/${route}/index.html`);
}
