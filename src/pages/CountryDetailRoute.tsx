import CountryDetail from "./CountryDetail";
import { ASIA } from "../data/regions/asia";

export default function CountryDetailRoute({ slug }: { slug: string }) {
  return <CountryDetail region={ASIA} slug={slug} />;
}
