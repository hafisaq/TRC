// Stamps the __SITE_URL__ token (used in index.html, robots.txt and
// sitemap.xml sources) with the real site URL from site.config.mjs.
// Runs after copy-routes so every duplicated route index.html is stamped
// too. Source files keep the token; only dist/ output carries the URL.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { SITE_URL } from "./site.config.mjs";

const dist = join(process.cwd(), "dist");
const targets = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/(^|\/)(index\.html|robots\.txt|sitemap\.xml)$/.test(p)) targets.push(p);
  }
};
walk(dist);

let stamped = 0;
for (const file of targets) {
  const before = readFileSync(file, "utf8");
  const after = before.replaceAll("__SITE_URL__", SITE_URL.replace(/\/$/, ""));
  if (after !== before) {
    writeFileSync(file, after);
    stamped++;
  }
}
console.log(`[apply-site-url] stamped ${stamped} file(s) with ${SITE_URL}`);
