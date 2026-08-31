import type { Region } from "./types";

// Coast & Islands — CMS-only like Mountain & Ice: no bundled demo stops,
// the home selector simply doesn't render until hydration delivers.
export const COAST: Region = {
  slug: "coast",
  title: "Coast & islands",
  intro:
    "Private houses on quiet water, from the Aegean to the Andaman and beyond — a boat, a cook, and a stretch of coast nobody else has been told about.",
  focus: { cx: 0.5, cy: 0.45, zoom: 1.8 },
  stops: [],
  catalog: []
};
