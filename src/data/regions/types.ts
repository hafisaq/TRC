import type { StopTheme } from "../../components/tier2/Stop";

// One entry per country within a region's catalogue page. The page can use
// this as a country-level navigation layer while properties carry the deeper
// brochure and advisor content.
export type RegionStop = {
  id: string;
  mapPos: [number, number];
  country: string;
  eyebrow: string;
  title: [string, string];
  copy: string;
  coords: string;
  slug: string;
  season: string;
  highlights: string[];
  theme: StopTheme;
};

export type PropertyAsset = {
  category: "Brochures" | "Fact Sheets" | "Images" | "Presentations" | "Newsletter" | "Rates & Offers" | "Videos";
  title: string;
  label?: string;
  url?: string;
};

export type PropertyFact = { label: string; value: string };

export type CatalogEntry = {
  name: string;
  location: string;
  poster: string;
  description?: string;
  coordinates?: string;
  season?: string;
  highlights?: string[];
  facts?: PropertyFact[];
  gallery?: string[];
  assets?: PropertyAsset[];
};
export type CatalogGroup = { id: string; label: string; entries: CatalogEntry[] };

export type Region = {
  slug: string;
  title: string;
  intro: string;
  stops: RegionStop[];
  // Zoom the DotMap background in on this region instead of showing the
  // full world — cx/cy are the same 0-1 fractional coordinates as mapPos.
  focus: { cx: number; cy: number; zoom: number };
  // The "too much to fit in the scroll journey" overflow: grouped by
  // country here, each with as many properties as needed. Same pattern as
  // the main site's Collection section, one level down.
  catalog: CatalogGroup[];
};
