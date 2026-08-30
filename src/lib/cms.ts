// Sanity hydration: one GROQ round-trip at boot pulls every content
// surface (home stops, the Asia region + stays, country pages) and
// rewrites the bundled data stores IN PLACE before first render — so
// every component keeps its exact types and code, and the bundled demo
// content remains the automatic fallback whenever Sanity is unreachable,
// slow (3s budget), or missing a piece. Media flows through the registry
// in lib/media.ts, so posters/films become CDN-managed transparently.
import { DESTINATIONS, type Destination } from "../data/tier2Destinations";
import { ASIA } from "../data/regions/asia";
import { setCountryPage, type CountryPageData } from "../data/regions/countryContent";
import type { CatalogEntry, CatalogGroup, PropertyAsset, RegionStop } from "../data/regions/types";
import { registerMedia } from "./media";

const PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID || "nvmppjc2";
const DATASET = import.meta.env.VITE_SANITY_DATASET || "production";
const API_VERSION = "2026-08-01";

type Media = { poster?: string | null; film?: string | null };
type TitlePair = { line1?: string; line2?: string };
type Fact = { label?: string; value?: string };

const MEDIA_PROJ = `{"poster": media.poster.asset->url, "film": media.film.asset->url}`;

const QUERY = `{
  "destinations": *[_type=="destination"]|order(order asc){
    _id, navLabel, eyebrow, title, copy, coords, season, highlights, theme,
    layout, mapPos, interest, gate, statusLabel, ctaLabel, ctaHref,
    "media": ${MEDIA_PROJ}
  },
  "region": *[_type=="region" && slug.current=="asia"][0]{
    title, intro, focus,
    stops[]{
      country, eyebrow, title, copy, coords, season, highlights, mapPos, theme,
      "media": ${MEDIA_PROJ}
    },
    catalog[]{
      id, label,
      entries[]->{
        name, location, description, coordinates, season, highlights,
        facts[]{label, value}, assets[]{title, category},
        "media": ${MEDIA_PROJ},
        "gallery": gallery[]{"poster": poster.asset->url, "film": film.asset->url}
      }
    }
  },
  "pages": *[_type=="countryPage"]{
    "slug": slug.current, country, tagline, priceLine, season, coords,
    quote{text, attribution},
    "heroMedia": {"poster": heroMedia.poster.asset->url, "film": heroMedia.film.asset->url},
    chapters[]{navLabel, eyebrow, title, paragraphs, light, "media": ${MEDIA_PROJ}},
    days[]{title, copy, details, "media": ${MEDIA_PROJ}},
    essentials[]{title, copy, points[]{label, value}}
  }
}`;

let mediaN = 0;
// register a media slot and return the key components will carry as "slug"
function mediaKey(media: Media | null | undefined, fallback: string): string {
  if (!media?.poster) return fallback;
  const key = `cms-${(mediaN++).toString(36)}`;
  registerMedia(key, { poster: media.poster, film: media.film ?? undefined });
  return key;
}

const pair = (t: TitlePair | null | undefined, fallback: [string, string]): [string, string] =>
  t?.line1 ? [t.line1, t.line2 ?? ""] : fallback;

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function hydrateFromCms(): Promise<boolean> {
  const url =
    `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}` +
    `?query=${encodeURIComponent(QUERY)}&perspective=published`;
  let data: {
    destinations?: Array<Record<string, unknown> & { _id: string; media?: Media; title?: TitlePair; mapPos?: { x: number; y: number } }>;
    region?: Record<string, unknown> | null;
    pages?: Array<Record<string, unknown>>;
  };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`sanity ${res.status}`);
    data = (await res.json()).result;
  } catch (err) {
    console.info("[cms] using bundled content:", (err as Error).message);
    return false;
  }

  try {
    // ---- home journey stops (update in place by id; append new ones) ----
    if (data.destinations?.length) {
      for (const d of data.destinations) {
        const id = `tier2-${d._id.replace(/^destination-/, "")}`;
        const mapped: Destination = {
          id,
          mapPos: [d.mapPos?.x ?? 0.5, d.mapPos?.y ?? 0.5],
          eyebrow: (d.eyebrow as string) ?? "",
          title: pair(d.title, ["", ""]),
          copy: (d.copy as string) ?? "",
          coords: (d.coords as string) ?? "",
          slug: mediaKey(d.media, "alpine-ridge"),
          season: (d.season as string) ?? "",
          highlights: (d.highlights as string[]) ?? [],
          theme: (d.theme as Destination["theme"]) ?? "gold",
          layout: (d.layout as Destination["layout"]) ?? "split",
          navLabel: (d.navLabel as string) ?? "",
          interest: (d.interest as string) ?? "",
          gate: (d.gate as string) ?? "",
          statusLabel: (d.statusLabel as string) ?? (d.navLabel as string) ?? "",
          ...(d.ctaLabel ? { ctaLabel: d.ctaLabel as string } : {}),
          ...(d.ctaHref ? { ctaHref: d.ctaHref as string } : {})
        };
        const existing = DESTINATIONS.find((x) => x.id === id);
        if (existing) {
          // assign can't remove fields the CMS unset — clear optionals first
          delete existing.ctaLabel;
          delete existing.ctaHref;
          Object.assign(existing, mapped);
        } else {
          DESTINATIONS.push(mapped);
        }
      }
    }

    // ---- the Asia region ----
    const r = data.region as
      | {
          title?: string;
          intro?: string;
          focus?: { cx: number; cy: number; zoom: number };
          stops?: Array<Record<string, unknown> & { media?: Media; title?: TitlePair; mapPos?: { x: number; y: number } }>;
          catalog?: Array<{ id?: string; label?: string; entries?: Array<Record<string, unknown> & { media?: Media; gallery?: Media[] }> }>;
        }
      | null
      | undefined;
    if (r) {
      if (r.title) ASIA.title = r.title;
      if (r.intro) ASIA.intro = r.intro;
      if (r.focus) ASIA.focus = r.focus;
      if (r.stops?.length) {
        const stops: RegionStop[] = r.stops.map((s) => {
          const country = (s.country as string) ?? "";
          const bundled = ASIA.stops.find((b) => b.country.toLowerCase() === country.toLowerCase());
          return {
            id: bundled?.id ?? `asia-${slugify(country)}`,
            mapPos: [s.mapPos?.x ?? 0.5, s.mapPos?.y ?? 0.5],
            country,
            eyebrow: (s.eyebrow as string) ?? "",
            title: pair(s.title, [country, ""]),
            copy: (s.copy as string) ?? "",
            coords: (s.coords as string) ?? "",
            slug: mediaKey(s.media, bundled?.slug ?? "bali-coast"),
            season: (s.season as string) ?? "",
            highlights: (s.highlights as string[]) ?? [],
            theme: ((s.theme as string) ?? bundled?.theme ?? "gold") as RegionStop["theme"]
          };
        });
        ASIA.stops.splice(0, ASIA.stops.length, ...stops);
      }
      if (r.catalog?.length) {
        const groups: CatalogGroup[] = r.catalog.map((g) => ({
          id: g.id ?? "",
          label: g.label ?? "",
          entries: (g.entries ?? []).filter(Boolean).map((e): CatalogEntry => {
            mediaKey(e.media, "bali-coast"); // registers the lead film for videoForPoster
            const gallery = (e.gallery ?? [])
              .filter((m) => m?.poster)
              .map((m) => {
                mediaKey(m, ""); // registers poster->film for videoForPoster
                return m.poster as string;
              });
            return {
              name: (e.name as string) ?? "",
              location: (e.location as string) ?? "",
              poster: e.media?.poster ?? `/media/poster/bali-coast.jpg`,
              ...(e.description ? { description: e.description as string } : {}),
              ...(e.coordinates ? { coordinates: e.coordinates as string } : {}),
              ...(e.season ? { season: e.season as string } : {}),
              ...((e.highlights as string[])?.length ? { highlights: e.highlights as string[] } : {}),
              ...((e.facts as Fact[])?.length
                ? { facts: (e.facts as Fact[]).map((f) => ({ label: f.label ?? "", value: f.value ?? "" })) }
                : {}),
              ...(gallery.length ? { gallery } : {}),
              ...((e.assets as PropertyAsset[])?.length ? { assets: e.assets as PropertyAsset[] } : {})
            };
          })
        }));
        ASIA.catalog.splice(0, ASIA.catalog.length, ...groups);
      }
    }

    // ---- country pages ----
    for (const p of (data.pages ?? []) as Array<Record<string, unknown>>) {
      const slug = p.slug as string;
      if (!slug) continue;
      const page: CountryPageData = {
        country: (p.country as string) ?? "",
        tagline: (p.tagline as string) ?? "",
        priceLine: (p.priceLine as string) ?? "",
        season: (p.season as string) ?? "",
        coords: (p.coords as string) ?? "",
        heroSlug: mediaKey(p.heroMedia as Media, "reef-dive"),
        chapters: ((p.chapters as Array<Record<string, unknown> & { media?: Media; title?: TitlePair }>) ?? []).map((c) => ({
          navLabel: (c.navLabel as string) ?? "",
          eyebrow: (c.eyebrow as string) ?? "",
          title: pair(c.title, ["", ""]),
          paragraphs: (c.paragraphs as string[]) ?? [],
          slug: mediaKey(c.media, "reef-dive"),
          ...(c.light ? { light: true } : {})
        })),
        quote: (p.quote as { text: string; attribution: string }) ?? { text: "", attribution: "" },
        days: ((p.days as Array<Record<string, unknown> & { media?: Media }>) ?? []).map((d) => ({
          title: (d.title as string) ?? "",
          copy: (d.copy as string) ?? "",
          slug: mediaKey(d.media, "reef-dive"),
          ...((d.details as string[])?.length ? { details: d.details as string[] } : {})
        })),
        essentials: ((p.essentials as Array<{ title?: string; copy?: string; points?: Fact[] }>) ?? []).map((c) => ({
          title: c.title ?? "",
          copy: c.copy ?? "",
          points: (c.points ?? []).map((f) => [f.label ?? "", f.value ?? ""] as [string, string])
        }))
      };
      setCountryPage(slug, page);
    }
    console.info("[cms] hydrated from Sanity");
    return true;
  } catch (err) {
    console.warn("[cms] hydration mapping failed, bundled content stands:", err);
    return false;
  }
}
