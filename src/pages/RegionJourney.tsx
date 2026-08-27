import { useMemo, useRef, useState } from "react";
import DotMap, { type DotMapHandle } from "../components/tier2/DotMap";
import Tier2FlightPath from "../components/tier2/Tier2FlightPath";
import RegionHero from "../components/tier2/RegionHero";
import Tier2Collection from "../components/tier2/Tier2Collection";
import Tier2Enquire, { type EnquiryOption } from "../components/tier2/Tier2Enquire";
import { useTier2Animations, type Tier2Stop } from "../hooks/useTier2Animations";
import { scrollToHash } from "../lib/scroll";
import type { Region } from "../data/regions/types";

// Generic region page — dark & cinematic (White Desert-style), carrying the
// SAME scroll-scrubbed flight-path plane as the main screen. Each country is
// a pinned chapter (Tier2Collection); the plane flies over all of them and
// drops a landing pulse as each country arrives.
export default function RegionJourney({ region }: { region: Region }) {
  const dotMapRef = useRef<DotMapHandle>(null);
  const [selectedInterest, setSelectedInterest] = useState<string | null>(region.title);
  const catalogId = `region-${region.slug}-catalog`;
  const heroId = `region-${region.slug}-hero`;

  const groupIdFor = (country: string) =>
    region.catalog.find((g) => g.label.toLowerCase() === country.toLowerCase())?.id;

  // The flight path lands once per country, on that country's chapter section
  // (Tier2Collection renders each as `#country-<groupId>`).
  const flightStops = useMemo<Tier2Stop[]>(
    () =>
      region.stops.flatMap((stop) => {
        const gid = groupIdFor(stop.country);
        return gid ? [{ id: `country-${gid}`, mapPos: stop.mapPos, theme: stop.theme, coords: stop.coords }] : [];
      }),
    [region]
  );

  useTier2Animations(dotMapRef, flightStops, { heroReady: true });

  const enquiryOptions = useMemo<EnquiryOption[]>(() => {
    const countryOptions = region.stops.map((stop, index) => ({
      id: `${stop.id}-enquiry`,
      interest: `${region.title} - ${stop.country}`,
      gate: `${region.slug.slice(0, 2).toUpperCase()}${index + 1}`
    }));
    const propertyOptions = region.catalog.flatMap((group) =>
      group.entries.map((entry, index) => ({
        id: `${group.id}-${index}-enquiry`,
        interest: entry.name,
        gate: group.label.slice(0, 2).toUpperCase()
      }))
    );
    return [
      { id: `${region.slug}-general-enquiry`, interest: region.title, gate: region.slug.slice(0, 3).toUpperCase() },
      ...countryOptions,
      ...propertyOptions
    ];
  }, [region]);

  const handleEnquire = (interest = region.title) => {
    setSelectedInterest(interest);
    scrollToHash("#tier2-enquire");
    history.replaceState(null, "", "#tier2-enquire");
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-ink font-sans text-white">
      <DotMap ref={dotMapRef} focus={region.focus} className="fixed inset-0 z-0 opacity-35 sm:opacity-100" />

      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-3 border-b border-white/10 bg-ink/78 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 backdrop-blur-md sm:gap-4 sm:px-8 sm:py-5">
        <a href="/" className="shrink-0 text-[9px] uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-gold-light sm:text-[10px]">
          ← The Retreat Collection
        </a>
        <nav className="flex max-w-[52vw] items-center gap-4 overflow-x-auto overscroll-x-contain no-scrollbar sm:max-w-none sm:gap-6" aria-label="Countries in this region">
          {region.stops.map((stop) => (
            <a
              key={stop.id}
              href={`#country-${groupIdFor(stop.country) ?? stop.id}`}
              className="shrink-0 text-[9px] uppercase tracking-[0.22em] text-white/60 transition-colors hover:text-gold-light sm:text-[10px]"
            >
              {stop.country}
            </a>
          ))}
          <button
            type="button"
            onClick={() => handleEnquire(region.title)}
            className="shrink-0 border-b border-gold-light/50 pb-1 text-[9px] uppercase tracking-[0.24em] text-gold-light transition-colors hover:text-white sm:text-[10px]"
          >
            Enquire
          </button>
        </nav>
      </header>
      <button
        type="button"
        onClick={() => handleEnquire(region.title)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+18px)] right-4 z-50 rounded-full border border-gold/45 bg-ink/72 px-4 py-3 text-[9px] uppercase tracking-[0.24em] text-gold-light backdrop-blur-md sm:hidden"
      >
        Enquire
      </button>

      <main id="tier2-journey" className="relative z-10">
        <Tier2FlightPath stops={flightStops} startId={heroId} />
        <RegionHero id={heroId} stop={region.stops[0]} title={region.title} intro={region.intro} />
        <Tier2Collection
          id={catalogId}
          catalog={region.catalog}
          index={1}
          total={region.catalog.length}
          eyebrow={`${region.title} collection`}
          heading={["Private", "places"]}
          intro={region.intro}
          onEnquire={handleEnquire}
        />
      </main>
      <div className="relative z-10 bg-ink text-white">
        <Tier2Enquire selectedInterest={selectedInterest} destinations={enquiryOptions} />
      </div>
    </div>
  );
}
