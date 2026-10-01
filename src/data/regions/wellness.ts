import type { Region } from "./types";

// Wellness & Health — not a place but a way of travelling, so it is one
// route (/wellness) rather than a continent of countries. The region holds
// a single stop ("Wellness") and one catalog group of the retreats
// themselves; both arrive from the CMS at boot, like Mountain & Ice.
export const WELLNESS: Region = {
  slug: "wellness",
  title: "Wellness & Health",
  intro: "",
  focus: { cx: 0.55, cy: 0.36, zoom: 1.6 },
  stops: [],
  catalog: []
};

// The home selector and the page both read the retreats from here.
export const wellnessRetreats = () => WELLNESS.catalog.find((g) => g.id === "wellness")?.entries ?? [];
