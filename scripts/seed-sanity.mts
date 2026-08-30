// Converts the repo's hardcoded demo content into Sanity documents as
// NDJSON, with media uploaded straight from public/media via the
// `_sanityAsset` import syntax. Deterministic _ids make the import
// idempotent — re-running replaces documents instead of duplicating.
//
//   npx tsx scripts/seed-sanity.mts        -> writes seed/content.ndjson
//   cd studio-trc && npx sanity dataset import ../seed/content.ndjson production --replace
//
// Only the Maldives country page is seeded (it's the only authored one);
// the other countries keep their generated fallback until real content
// exists — matching the site's own fallback behaviour.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { DESTINATIONS } from "../src/data/tier2Destinations";
import { ASIA } from "../src/data/regions/asia";
import { getCountryPage } from "../src/data/regions/countryContent";

const ROOT = resolve(import.meta.dirname, "..");
const abs = (publicPath: string) => `file://${resolve(ROOT, "public" + publicPath)}`;

let keyN = 0;
const key = () => `k${(keyN++).toString(36).padStart(4, "0")}`;

const slugId = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const titlePair = ([line1, line2]: [string, string]) => ({ _type: "titlePair", line1, line2 });

// media from a demo slug: poster always, film when the mp4 exists
const mediaFromSlug = (slug: string) => {
  const media: Record<string, unknown> = {
    _type: "mediaSlot",
    poster: { _type: "image", _sanityAsset: `image@${abs(`/media/poster/${slug}.jpg`)}` }
  };
  if (existsSync(resolve(ROOT, `public/media/video/${slug}.mp4`))) {
    media.film = { _type: "file", _sanityAsset: `file@${abs(`/media/video/${slug}.mp4`)}` };
  }
  return media;
};

// media from a poster PATH (gallery entries store paths, not slugs)
const mediaFromPosterPath = (path: string) => {
  const slug = path.match(/\/media\/poster\/([a-z0-9-]+)\./i)?.[1];
  return slug ? mediaFromSlug(slug) : { _type: "mediaSlot", poster: { _type: "image", _sanityAsset: `image@${abs(path)}` } };
};

const docs: Array<Record<string, unknown>> = [];

// ---- home journey stops ----
DESTINATIONS.forEach((d, i) => {
  docs.push({
    _id: `destination-${d.id.replace(/^tier2-/, "")}`,
    _type: "destination",
    order: i + 1,
    navLabel: d.navLabel,
    eyebrow: d.eyebrow,
    title: titlePair(d.title),
    copy: d.copy,
    coords: d.coords,
    media: mediaFromSlug(d.slug),
    season: d.season,
    highlights: d.highlights,
    theme: d.theme,
    layout: d.layout,
    mapPos: { x: d.mapPos[0], y: d.mapPos[1] },
    interest: d.interest,
    gate: d.gate,
    statusLabel: d.statusLabel,
    ...(d.ctaLabel ? { ctaLabel: d.ctaLabel } : {}),
    ...(d.ctaHref ? { ctaHref: d.ctaHref } : {})
  });
});

// ---- stays (referenced by the region catalog) ----
const stayId = (name: string) => `stay-${slugId(name)}`;
for (const group of ASIA.catalog) {
  for (const e of group.entries) {
    docs.push({
      _id: stayId(e.name),
      _type: "stay",
      name: e.name,
      location: e.location,
      media: mediaFromPosterPath(e.poster),
      ...(e.description ? { description: e.description } : {}),
      ...(e.coordinates ? { coordinates: e.coordinates } : {}),
      ...(e.season ? { season: e.season } : {}),
      ...(e.highlights?.length ? { highlights: e.highlights } : {}),
      ...(e.facts?.length
        ? { facts: e.facts.map((f) => ({ _type: "fact", _key: key(), label: f.label, value: f.value })) }
        : {}),
      ...(e.gallery?.length
        ? { gallery: e.gallery.map((g) => ({ ...mediaFromPosterPath(g), _key: key() })) }
        : {}),
      ...(e.assets?.length
        ? { assets: e.assets.map((a) => ({ _type: "object", _key: key(), title: a.title, category: a.category })) }
        : {})
    });
  }
}

// ---- the Asia region ----
docs.push({
  _id: "region-asia",
  _type: "region",
  slug: { _type: "slug", current: ASIA.slug },
  title: ASIA.title,
  intro: ASIA.intro,
  focus: ASIA.focus,
  stops: ASIA.stops.map((s) => ({
    _type: "regionStop",
    _key: key(),
    country: s.country,
    eyebrow: s.eyebrow,
    title: titlePair(s.title),
    copy: s.copy,
    coords: s.coords,
    media: mediaFromSlug(s.slug),
    season: s.season,
    highlights: s.highlights,
    mapPos: { x: s.mapPos[0], y: s.mapPos[1] },
    theme: s.theme
  })),
  catalog: ASIA.catalog.map((g) => ({
    _type: "catalogGroup",
    _key: key(),
    id: g.id,
    label: g.label,
    entries: g.entries.map((e) => ({ _type: "reference", _key: key(), _ref: stayId(e.name) }))
  }))
});

// ---- the authored country page (Maldives) ----
const maldives = getCountryPage(ASIA, "maldives");
if (!maldives) throw new Error("maldives page not found");
const page = maldives.page;
docs.push({
  _id: "countryPage-maldives",
  _type: "countryPage",
  country: page.country,
  slug: { _type: "slug", current: "maldives" },
  tagline: page.tagline,
  priceLine: page.priceLine,
  season: page.season,
  coords: page.coords,
  heroMedia: mediaFromSlug(page.heroSlug),
  chapters: page.chapters.map((c) => ({
    _type: "chapter",
    _key: key(),
    navLabel: c.navLabel,
    eyebrow: c.eyebrow,
    title: titlePair(c.title),
    paragraphs: c.paragraphs,
    media: mediaFromSlug(c.slug),
    light: !!c.light
  })),
  quote: page.quote,
  days: page.days.map((d) => ({
    _type: "day",
    _key: key(),
    title: d.title,
    copy: d.copy,
    media: mediaFromSlug(d.slug),
    ...(d.details?.length ? { details: d.details } : {})
  })),
  essentials: page.essentials.map((c) => ({
    _type: "essentialCard",
    _key: key(),
    title: c.title,
    copy: c.copy,
    points: c.points.map(([label, value]) => ({ _type: "fact", _key: key(), label, value }))
  }))
});

mkdirSync(resolve(ROOT, "seed"), { recursive: true });
const out = resolve(ROOT, "seed/content.ndjson");
writeFileSync(out, docs.map((d) => JSON.stringify(d)).join("\n") + "\n");
console.log(`wrote ${docs.length} documents -> ${out}`);
console.log("types:", [...new Set(docs.map((d) => d._type))].join(", "));
