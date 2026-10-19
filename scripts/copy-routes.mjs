// Every route of the site is served as a real static file (dist/<route>/
// index.html), because the host does not reliably apply rewrite rules —
// and each of those files gets its OWN head: title, description,
// canonical, Open Graph / Twitter cards and JSON-LD structured data, drawn
// from the published CMS content at build time. The sitemap is generated
// from the same list, with lastmod from the CMS.
//
// The site is a single-page app that hydrates from Sanity in the browser;
// crawlers that run JavaScript see the full page, and every crawler sees a
// correct head. If Sanity cannot be reached at build time the routes are
// still written from a bundled list, with the generic head.
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const distDir = path.resolve(import.meta.dirname, "..", "dist");
const src = path.join(distDir, "index.html");
const SITE = "__SITE_URL__"; // stamped by apply-site-url.mjs
const BRAND = "The Retreat Collection";
const OG_DEFAULT = "/media/brand/og-default.jpg";

// routes that must exist even when the CMS is unreachable
const FALLBACK_ROUTES = [
  "tier2", "about", "wellness",
  "asia/maldives", "asia/thailand", "asia/sri-lanka", "asia/india", "asia/malaysia", "asia/laos",
  "alpine/switzerland", "alpine/france", "alpine/italy", "alpine/finland", "alpine/antarctica", "alpine/andes",
  "coast/italy", "coast/france", "coast/greece", "coast/spain", "coast/seychelles", "coast/indonesia", "coast/caribbean",
  "desert/oman", "desert/uae", "desert/qatar", "desert/saudi-arabia", "desert/morocco",
  "cities/london", "cities/paris", "cities/geneva", "cities/zurich", "cities/milan",
  "cities/venice", "cities/florence", "cities/vienna-salzburg", "cities/dusseldorf", "cities/new-york"
];

const PROJECT = "nvmppjc2", DATASET = "production", API = "2026-08-01";
const QUERY = `{
  "regions": *[_type=="region"]{
    "slug": slug.current, title, intro, _updatedAt,
    stops[]{country, copy, coords, "poster": media.poster.asset->url},
    catalog[]{id, label, "entries": entries[]->{name, location, description, "poster": media.poster.asset->url, _updatedAt}}
  },
  "pages": *[_type=="countryPage"]{"slug": slug.current, country, tagline, priceLine, _updatedAt, "poster": heroMedia.poster.asset->url},
  "about": *[_id=="aboutPage"][0]{tagline, intro, _updatedAt, "poster": *[_id=="destination-about"][0].media.poster.asset->url},
  "home": *[_id=="destination-about"][0]{_updatedAt},
  "settings": *[_id=="siteSettings"][0]{contacts[]{type, value, show}, socials[]{network, url, show}}
}`;

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const text = (v) => (typeof v === "string" ? v : v?.line1 ? `${v.line1} ${v.line2 ?? ""}`.trim() : "");
const clip = (s, n = 158) => { s = (s || "").replace(/\s+/g, " ").trim(); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…"; };
const ogImage = (poster) => poster ? `${poster}?w=1200&h=630&fit=crop&auto=format&q=80` : `${SITE}${OG_DEFAULT}`;
const day = (iso) => (iso || new Date().toISOString()).slice(0, 10);

async function fetchCms() {
  const url = `https://${PROJECT}.apicdn.sanity.io/v${API}/data/query/${DATASET}?query=${encodeURIComponent(QUERY)}&perspective=published`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`sanity ${res.status}`);
  const { result } = await res.json();
  if (!result?.regions?.length) throw new Error("empty CMS response");
  return result;
}

// ---- the head for one route ----
function head({ title, description, pathname, image, type = "website", robots, jsonld }) {
  const url = `${SITE}${pathname}`;
  const lines = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="${robots ?? "index, follow, max-image-preview:large"}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:site_name" content="${BRAND}" />`,
    `<meta property="og:locale" content="en_GB" />`,
    `<meta property="og:locale:alternate" content="ar_AE" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`
  ];
  for (const block of jsonld ?? []) lines.push(`<script type="application/ld+json">${JSON.stringify(block)}</script>`);
  return lines.join("\n    ");
}

// swap the generic head lines of the built index.html for a route's own
function withHead(html, h) {
  return html
    .replace(/<title>[^<]*<\/title>\s*/i, "")
    .replace(/<meta name="description"[^>]*>\s*/i, "")
    .replace(/<meta name="robots"[^>]*>\s*/i, "")
    .replace(/<link rel="canonical"[^>]*>\s*/i, "")
    .replace(/<meta charset="UTF-8" \/>/i, `<meta charset="UTF-8" />\n    ${h}`);
}

function organization(settings) {
  const contacts = (settings?.contacts ?? []).filter((c) => c?.show !== false && c?.value);
  const phone = contacts.find((c) => c.type === "phone" || c.type === "whatsapp")?.value;
  const email = contacts.find((c) => c.type === "email")?.value;
  const sameAs = (settings?.socials ?? []).filter((s) => s?.show !== false && s?.url).map((s) => s.url);
  return {
    "@type": ["Organization", "TravelAgency"],
    "@id": `${SITE}/#organization`,
    name: BRAND,
    url: `${SITE}/`,
    logo: `${SITE}/media/brand/newaccentlogo-720.png`,
    image: `${SITE}${OG_DEFAULT}`,
    description: "A UAE-based luxury travel and wellbeing company curating hotels, retreats and journeys across the world, arranged one traveller at a time.",
    areaServed: ["AE", "SA", "QA", "KW", "BH", "OM"],
    availableLanguage: ["en", "ar"],
    ...(phone ? { telephone: phone } : {}),
    ...(email ? { email } : {}),
    ...(sameAs.length ? { sameAs } : {})
  };
}

function breadcrumbs(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, pathname], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE}${pathname}` }))
  };
}

// ---- every route, with its head ----
function plan(cms) {
  const org = organization(cms.settings);
  const graph = (...nodes) => [{ "@context": "https://schema.org", "@graph": nodes }];
  const routes = [];

  routes.push({
    route: "", pathname: "/", lastmod: day(cms.home?._updatedAt), priority: "1.0",
    head: head({
      title: `${BRAND} — Private travel, arranged one journey at a time`,
      description: "Private travel designed one journey at a time: wellness retreats, tropical coasts, mountains, deserts and grand cities — every stay visited, vetted and arranged directly.",
      pathname: "/", image: `${SITE}${OG_DEFAULT}`,
      jsonld: graph(org, { "@type": "WebSite", "@id": `${SITE}/#website`, url: `${SITE}/`, name: BRAND, publisher: { "@id": `${SITE}/#organization` }, inLanguage: ["en", "ar"] })
    })
  });

  // /tier2 is the same page as the home: keep it reachable, keep it out of the index
  routes.push({ route: "tier2", pathname: "/tier2/", skipSitemap: true, head: head({ title: `${BRAND}`, description: "The Retreat Collection.", pathname: "/", image: `${SITE}${OG_DEFAULT}`, robots: "noindex, follow" }) });

  const about = cms.about ?? {};
  const aboutDesc = clip((about.intro ?? [])[0] ?? text(about.tagline));
  routes.push({
    route: "about", pathname: "/about/", lastmod: day(about._updatedAt), priority: "0.7",
    head: head({
      title: `About — ${BRAND}`, description: aboutDesc, pathname: "/about/", image: ogImage(about.poster),
      jsonld: graph(org, { "@type": "AboutPage", "@id": `${SITE}/about/#page`, url: `${SITE}/about/`, name: `About ${BRAND}`, description: aboutDesc, about: { "@id": `${SITE}/#organization` } }, breadcrumbs([["Home", "/"], ["About", "/about/"]]))
    })
  });

  const pages = new Map((cms.pages ?? []).map((p) => [p.slug, p]));
  for (const region of cms.regions ?? []) {
    const regionTitle = text(region.title);
    for (const group of region.catalog ?? []) {
      if (!group?.id) continue;
      const wellness = region.slug === "wellness";
      const pathname = wellness ? "/wellness/" : `/${region.slug}/${group.id}/`;
      const route = wellness ? "wellness" : `${region.slug}/${group.id}`;
      const page = pages.get(group.id);
      const stop = (region.stops ?? []).find((s) => s?.country?.toLowerCase() === group.label?.toLowerCase());
      const entries = (group.entries ?? []).filter(Boolean);
      const name = page?.country ?? group.label;
      const title = wellness
        ? `Wellness & Health retreats — ${BRAND}`
        : `${name} — ${regionTitle} | ${BRAND}`;
      const description = clip(page?.tagline ?? stop?.copy ?? `${name}: private stays and routes, visited, vetted and arranged directly by ${BRAND}.`);
      const image = ogImage(page?.poster ?? stop?.poster ?? entries[0]?.poster);
      const lastmod = [page?._updatedAt, region._updatedAt, ...entries.map((e) => e._updatedAt)].filter(Boolean).sort().pop();
      const place = {
        "@type": wellness ? "CollectionPage" : "TouristDestination",
        "@id": `${SITE}${pathname}#place`,
        name: wellness ? "Wellness & Health retreats" : name,
        url: `${SITE}${pathname}`,
        description,
        image,
        ...(wellness ? {} : { touristType: ["luxury travel", "private travel"] })
      };
      const stays = entries.length ? {
        "@type": "ItemList",
        "@id": `${SITE}${pathname}#stays`,
        name: wellness ? "The retreats" : `The stays in ${name}`,
        numberOfItems: entries.length,
        itemListElement: entries.map((e, i) => ({
          "@type": "ListItem", position: i + 1,
          item: {
            "@type": wellness ? "HealthAndBeautyBusiness" : "LodgingBusiness",
            name: e.name,
            ...(e.location ? { address: e.location } : {}),
            ...(e.description ? { description: clip(e.description, 300) } : {}),
            ...(e.poster ? { image: `${e.poster}?w=1200&auto=format` } : {})
          }
        }))
      } : null;
      const crumbs = wellness
        ? breadcrumbs([["Home", "/"], ["Wellness & Health", pathname]])
        : breadcrumbs([["Home", "/"], [regionTitle, `/#tier2-${region.slug === "coast" ? "coast" : region.slug}-countries`], [name, pathname]]);
      routes.push({ route, pathname, lastmod: day(lastmod), priority: wellness ? "0.9" : "0.8",
        head: head({ title, description, pathname, image, jsonld: graph(org, place, ...(stays ? [stays] : []), crumbs) }) });
    }
  }
  return routes;
}

function sitemap(routes) {
  const urls = routes.filter((r) => !r.skipSitemap).map((r) =>
    `  <url>\n    <loc>${SITE}${r.pathname}</loc>\n    <lastmod>${r.lastmod}</lastmod>\n    <priority>${r.priority ?? "0.8"}</priority>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

async function main() {
  if (!existsSync(src)) {
    console.error("[copy-routes] dist/index.html not found — did the build run first?");
    process.exit(1);
  }
  const base = await readFile(src, "utf8");
  let cms = null;
  try { cms = await fetchCms(); } catch (e) { console.warn(`[copy-routes] CMS unreachable (${e.message}) — generic heads, bundled route list`); }

  if (!cms) {
    for (const route of FALLBACK_ROUTES) {
      await mkdir(path.join(distDir, route), { recursive: true });
      await copyFile(src, path.join(distDir, route, "index.html"));
    }
    console.log(`[copy-routes] wrote ${FALLBACK_ROUTES.length} routes (generic head)`);
    return;
  }

  const routes = plan(cms);
  for (const r of routes) {
    const dir = r.route ? path.join(distDir, r.route) : distDir;
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), withHead(base, r.head));
  }
  await writeFile(path.join(distDir, "sitemap.xml"), sitemap(routes));
  console.log(`[copy-routes] wrote ${routes.length} routes with their own heads, sitemap with ${routes.filter((r) => !r.skipSitemap).length} entries`);
}

main();
