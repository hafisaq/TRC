// Replica (staging) deploy guard: overwrite dist/robots.txt so search
// engines never index the placeholder *.hostingersite.com site. The
// production build (`npm run build`) keeps public/robots.txt untouched —
// run `npm run build:replica` ONLY for the staging/replica deploy.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const out = resolve(process.cwd(), "dist/robots.txt");
writeFileSync(out, "User-agent: *\nDisallow: /\n");
console.log("[replica-guard] dist/robots.txt -> Disallow all (staging build)");
