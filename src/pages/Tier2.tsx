import { useEffect, useMemo, useRef, useState } from "react";
import DotMap, { type DotMapHandle } from "../components/tier2/DotMap";
import Tier2Nav from "../components/tier2/Tier2Nav";
import Tier2CollectionGrid from "../components/tier2/Tier2CollectionGrid";
import Tier2Hero from "../components/tier2/Tier2Hero";
import Tier2FlightPath from "../components/tier2/Tier2FlightPath";
import Stop from "../components/tier2/Stop";
import Tier2Enquire from "../components/tier2/Tier2Enquire";
import { useTier2Animations } from "../hooks/useTier2Animations";
import { scrollToHash } from "../lib/scroll";
import { DESTINATIONS, FLIGHT_STOPS } from "../data/tier2Destinations";
import { CATALOG } from "../data/tier2Catalog";
import CountryStrip from "../components/tier2/CountryStrip";
import { ASIA } from "../data/regions/asia";

export default function Tier2() {
  const dotMapRef = useRef<DotMapHandle>(null);
  const [activeStopId, setActiveStopId] = useState(DESTINATIONS[0].id);
  const [routeProgress, setRouteProgress] = useState(0);
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeDestination = useMemo(
    () => DESTINATIONS.find((s) => s.id === activeStopId) ?? DESTINATIONS[0],
    [activeStopId]
  );
  const stopTotal = useMemo(() => DESTINATIONS.filter((d) => d.kind !== "catalog").length, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 1150);
    return () => window.clearTimeout(timer);
  }, []);

  useTier2Animations(dotMapRef, DESTINATIONS, {
    onActiveStopChange: setActiveStopId,
    onProgressChange: setRouteProgress,
    heroReady: !isLoading
  });

  const handleEnquire = (interest?: string) => {
    if (interest) setSelectedInterest(interest);
    scrollToHash("#tier2-enquire");
    history.replaceState(null, "", "#tier2-enquire");
  };

  return (
    // overflow-x-clip, NOT overflow-hidden: hidden creates a scroll container
    // and silently kills every position:sticky descendant (pinned sections)
    <div className="relative bg-ink min-h-screen text-white font-sans overflow-x-clip">
      <DotMap ref={dotMapRef} className="fixed inset-0 z-0 opacity-70 sm:opacity-100" />
      <div className={`premium-loader ${isLoading ? "is-active" : ""}`} aria-hidden={!isLoading}>
        <img src="/media/brand/retreat-collection-logo-crop.png" alt="" className="premium-loader__logo" />
        <div className="premium-loader__mark">
          <span />
        </div>
        <div className="premium-loader__text">Preparing route</div>
      </div>
      <Tier2Nav
        destinations={DESTINATIONS}
        activeStopId={activeStopId}
        routeProgress={routeProgress}
        statusText={`TRC 001 · Approaching ${activeDestination.statusLabel}`}
        onEnquire={() => handleEnquire()}
      />
      <a
        id="mobile-enquire-cta"
        href="#tier2-enquire"
        onClick={(e) => {
          e.preventDefault();
          handleEnquire();
        }}
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+76px)] z-50 sm:hidden rounded-full border border-gold/45 bg-ink/72 px-4 py-3 text-[9px] tracking-[0.24em] uppercase text-gold-light backdrop-blur-md transition-opacity duration-300"
      >
        Enquire
      </a>

      <main id="tier2-journey" className="relative z-10">
        <Tier2FlightPath stops={FLIGHT_STOPS} />
        <Tier2Hero />
        {DESTINATIONS.map((s, i) =>
          s.kind === "catalog" ? (
            <Tier2CollectionGrid
              key={s.id}
              id={s.id}
              catalog={CATALOG}
              index={i + 1}
              total={DESTINATIONS.length}
              eyebrow="The wider collection"
              heading={["Every region,", "every stay"]}
              intro="Beyond the route above — the wider portfolio, organised by region. Each stay carries its own experience brochure to take away."
            />
          ) : (
            <div key={s.id} className="contents">
              <Stop
                id={s.id}
                index={i + 1}
                total={stopTotal}
                eyebrow={s.eyebrow}
                title={s.title}
                copy={s.copy}
                coords={s.coords}
                slug={s.slug}
                season={s.season}
                highlights={s.highlights}
                theme={s.theme}
                layout={s.layout}
                interest={s.interest}
                onEnquire={handleEnquire}
                ctaLabel={s.ctaLabel}
                ctaHref={s.ctaHref}
              />
              {/* right after the Asia stop: the scroll-glide country selector */}
              {s.id === "tier2-asia" && <CountryStrip region={ASIA} />}
            </div>
          )
        )}
      </main>
      <Tier2Enquire selectedInterest={selectedInterest} destinations={DESTINATIONS} />
    </div>
  );
}
