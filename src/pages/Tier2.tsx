import { useEffect, useMemo, useRef, useState } from "react";
import DotMap, { type DotMapHandle } from "../components/tier2/DotMap";
import Tier2Nav from "../components/tier2/Tier2Nav";
import Tier2Hero from "../components/tier2/Tier2Hero";
import Tier2FlightPath from "../components/tier2/Tier2FlightPath";
import Stop from "../components/tier2/Stop";
import Tier2Enquire from "../components/tier2/Tier2Enquire";
import { useTier2Animations } from "../hooks/useTier2Animations";
import { scrollToHash } from "../lib/scroll";
import { DESTINATIONS, FLIGHT_STOPS } from "../data/tier2Destinations";

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
    <div className="relative bg-ink min-h-screen text-white font-sans overflow-hidden">
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
        {DESTINATIONS.map((s, i) => (
          <Stop
            key={s.id}
            id={s.id}
            index={i + 1}
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
          />
        ))}
      </main>
      <Tier2Enquire selectedInterest={selectedInterest} destinations={DESTINATIONS} />
    </div>
  );
}
