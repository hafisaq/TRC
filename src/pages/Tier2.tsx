import { useEffect, useMemo, useRef, useState } from "react";
import DotMap, { type DotMapHandle } from "../components/tier2/DotMap";
import Tier2Nav from "../components/tier2/Tier2Nav";
import Tier2Hero from "../components/tier2/Tier2Hero";
import Tier2FlightPath from "../components/tier2/Tier2FlightPath";
import Stop from "../components/tier2/Stop";
import Tier2Enquire from "../components/tier2/Tier2Enquire";
import { useTier2Animations } from "../hooks/useTier2Animations";
import { scrollToHash } from "../lib/scroll";
import { DESTINATIONS, flightPathStops } from "../data/tier2Destinations";
import CountryStrip from "../components/tier2/CountryStrip";
import { ASIA } from "../data/regions/asia";

// The loader's night sky: deterministic pseudo-random star placements (a
// seeded hash, not Math.random, so every visit renders the same sky and
// React never fights over positions).
const LOADER_STARS = Array.from({ length: 46 }, (_, i) => {
  const a = Math.sin(i * 127.1 + 1) * 43758.5453;
  const b = Math.sin(i * 311.7 + 7) * 12543.2107;
  const r1 = a - Math.floor(a);
  const r2 = b - Math.floor(b);
  return {
    left: `${(r1 * 100).toFixed(1)}%`,
    top: `${(r2 * 100).toFixed(1)}%`,
    size: 1 + (i % 3),
    delay: `${(r1 * 2.4).toFixed(2)}s`,
    duration: `${(1.8 + r2 * 2.4).toFixed(2)}s`,
    gold: i % 5 === 0
  };
});

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
  const stopTotal = DESTINATIONS.length;

  useEffect(() => {
    // long enough for one full orbit of the plane to read (2.4s spin —
    // the fade-out overlaps its second lap)
    const timer = window.setTimeout(() => setIsLoading(false), 1700);
    return () => window.clearTimeout(timer);
  }, []);

  // DESTINATIONS plus the country strip's hold waypoint — passive, so the
  // plane pulses a landing and wears a visible gold accent through the
  // cream strip, without the hold ever becoming the nav's "active stop".
  // Built at render time (after CMS hydration), inserted after Asia by id.
  const animationStops = useMemo(() => {
    const asiaIdx = DESTINATIONS.findIndex((d) => d.id === "tier2-asia");
    const cut = asiaIdx >= 0 ? asiaIdx + 1 : Math.min(2, DESTINATIONS.length);
    return [
      ...DESTINATIONS.slice(0, cut),
      { id: "tier2-asia-hold-in", mapPos: [0.66, 0.44] as [number, number], theme: "white" as const, coords: "", passive: true },
      ...DESTINATIONS.slice(cut)
    ];
  }, []);

  useTier2Animations(dotMapRef, animationStops, {
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
        {/* the night sky: twinkling stars + a shooting star */}
        <div className="premium-loader__stars" aria-hidden="true">
          {LOADER_STARS.map((star, i) => (
            <span
              key={i}
              className="loader-star"
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                background: star.gold ? "#e3c682" : "#cfd8e6",
                animationDelay: star.delay,
                animationDuration: star.duration
              }}
            />
          ))}
          <span className="loader-shoot" />
        </div>
        <img
          src="/media/brand/GOLD.png"
          alt=""
          width={697}
          height={226}
          className="premium-loader__logo"
        />
        {/* the compass: plane orbits the ring trailing a gold comet arc */}
        <div className="premium-loader__mark">
          <div className="premium-loader__orbit">
            <span className="premium-loader__sweep" />
            <span className="premium-loader__plane">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21,16V14L13,9V3.5C13,2.67 12.33,2 11.5,2C10.67,2 10,2.67 10,3.5V9L2,14V16L10,13.5V19L7.5,20.5V22L11.5,21L15.5,22V20.5L13,19V13.5L21,16Z"
                />
              </svg>
            </span>
          </div>
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
      <main id="tier2-journey" className="relative z-10">
        <Tier2FlightPath stops={flightPathStops()} />
        <Tier2Hero />
        {DESTINATIONS.map((s, i) => (
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
        ))}
        {/* inside main so the journey's scroll range — and the flight
            path's own height — extend through it; otherwise the path/plane
            hit their end exactly at the last stop and the plane appears to
            stop abruptly instead of flying down to land here */}
        <Tier2Enquire selectedInterest={selectedInterest} destinations={DESTINATIONS} />
      </main>
    </div>
  );
}
