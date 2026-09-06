import type { Region, RegionStop } from "../data/regions/types";
import { t } from "./i18n";

// Every country selector ends with one extra card/row — "More" — for the
// traveller whose destination isn't on the list. It carries no media and
// no country page; it opens the enquiry boarding pass instead.
const SUFFIX = "--more";

export const isMoreStop = (stop: RegionStop) => stop.id.endsWith(SUFFIX);

export function withMore(region: Region): RegionStop[] {
  const more: RegionStop = {
    id: `${region.slug}${SUFFIX}`,
    mapPos: [0.5, 0.5],
    country: t("more.label"),
    eyebrow: t("more.eyebrow"),
    title: [t("more.label"), ""],
    copy: t("more.copy"),
    coords: "",
    slug: "",
    season: "",
    highlights: [],
    theme: "gold"
  };
  return [...region.stops, more];
}

// the card/row link label: "Explore France →" for a country, "Ask us →"
// for the trailing More item
export const exploreLabel = (stop: RegionStop) =>
  isMoreStop(stop) ? t("more.cta") : t("strip.explore", { country: stop.country });
