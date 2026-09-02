import CountryDetail from "./CountryDetail";
import { ASIA } from "../data/regions/asia";
import { ALPINE } from "../data/regions/alpine";
import { COAST } from "../data/regions/coast";
import { DESERT } from "../data/regions/desert";
import { CITIES } from "../data/regions/cities";

const REGIONS = { asia: ASIA, alpine: ALPINE, coast: COAST, desert: DESERT, cities: CITIES } as const;

export default function CountryDetailRoute({ regionSlug, slug }: { regionSlug: string; slug: string }) {
  const region = REGIONS[regionSlug as keyof typeof REGIONS] ?? ASIA;
  return <CountryDetail region={region} slug={slug} />;
}
