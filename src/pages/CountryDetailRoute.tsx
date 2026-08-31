import CountryDetail from "./CountryDetail";
import { ASIA } from "../data/regions/asia";
import { ALPINE } from "../data/regions/alpine";

const REGIONS = { asia: ASIA, alpine: ALPINE } as const;

export default function CountryDetailRoute({ regionSlug, slug }: { regionSlug: string; slug: string }) {
  const region = REGIONS[regionSlug as keyof typeof REGIONS] ?? ASIA;
  return <CountryDetail region={region} slug={slug} />;
}
