import { useRef } from "react";
import DotMap, { type DotMapHandle } from "../components/tier2/DotMap";
import Tier2Hero from "../components/tier2/Tier2Hero";
import Tier2FlightPath from "../components/tier2/Tier2FlightPath";
import Stop, { type StopTheme, type StopLayout } from "../components/tier2/Stop";
import Tier2Enquire from "../components/tier2/Tier2Enquire";
import { useTier2Animations, type Tier2Stop } from "../hooks/useTier2Animations";

type StopData = Tier2Stop & {
  eyebrow: string;
  title: [string, string];
  copy: string;
  coords: string;
  slug: string;
  season: string;
  highlights: string[];
  theme: StopTheme;
  layout: StopLayout;
};

const STOPS: StopData[] = [
  {
    id: "tier2-alpine",
    mapPos: [0.48, 0.28],
    eyebrow: "Mountain & ice",
    title: ["High and", "quiet"],
    copy: "Alpine chalets, Patagonian lodges, and the far south when the season allows. Days built around light — first tracks at dawn, a slow lunch on a sun terrace, nothing scheduled after four.",
    coords: "46.8°N 9.8°E",
    slug: "alpine-ridge",
    season: "Dec – Mar",
    highlights: ["Private guide", "Heli access", "3-night minimum"],
    theme: "white",
    layout: "split"
  },
  {
    id: "tier2-bali",
    mapPos: [0.74, 0.58],
    eyebrow: "Coast & islands",
    title: ["The warm", "edge"],
    copy: "Private houses on quiet water, from the Aegean to the Andaman Sea. No resort schedule — a boat, a cook, and a stretch of coast nobody else has been told about.",
    coords: "8.5°S 115.2°E",
    slug: "bali-coast",
    season: "Apr – Oct",
    highlights: ["Private villa", "Boat included", "Chef on call"],
    theme: "gold",
    layout: "cinematic"
  },
  {
    id: "tier2-desert",
    mapPos: [0.52, 0.5],
    eyebrow: "Desert & plain",
    title: ["Open", "country"],
    copy: "Mobile camps and long horizons — Namibia, Oman, the Serengeti in green season. The camp moves with you, so the view from the tent door is never the one from yesterday.",
    coords: "23.4°N 25.7°E",
    slug: "desert-ruins",
    season: "Jun – Sep",
    highlights: ["Mobile camp", "Star-bed nights", "4x4 included"],
    theme: "white",
    layout: "portal"
  },
  {
    id: "tier2-cities",
    mapPos: [0.68, 0.32],
    eyebrow: "Cities & culture",
    title: ["Doors that", "open"],
    copy: "Kyoto, Seville, Jaipur — with the rooms, tables and hours other travellers don't get. A local designer walks every route with you before you arrive.",
    coords: "35.0°N 135.8°E",
    slug: "reef-dive",
    season: "Year-round",
    highlights: ["Private access", "Local designer", "No fixed hours"],
    theme: "gold",
    layout: "editorial"
  }
];

// Computed once at module load — passing a freshly-mapped array as a prop
// on every render would re-trigger Tier2FlightPath's measurement effect
// (its useLayoutEffect depends on this array's identity) on every Tier2
// re-render, which destroys and recreates the GSAP-bound SVG elements.
const FLIGHT_STOPS = STOPS.map((s) => ({ id: s.id, theme: s.theme, coords: s.coords }));

export default function Tier2() {
  const dotMapRef = useRef<DotMapHandle>(null);
  useTier2Animations(dotMapRef, STOPS);

  return (
    <div className="relative bg-ink min-h-screen text-white font-sans overflow-hidden">
      <DotMap ref={dotMapRef} className="fixed inset-0 z-0 opacity-70 sm:opacity-100" />
      <a
        id="mobile-enquire-cta"
        href="#tier2-enquire"
        className="fixed right-4 bottom-4 z-50 sm:hidden rounded-full border border-gold/45 bg-ink/72 px-4 py-3 text-[9px] tracking-[0.24em] uppercase text-gold-light backdrop-blur-md"
      >
        Enquire
      </a>

      <main id="tier2-journey" className="relative z-10">
        <Tier2FlightPath stops={FLIGHT_STOPS} />
        <Tier2Hero />
        {STOPS.map((s, i) => (
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
          />
        ))}
      </main>
      <Tier2Enquire />
    </div>
  );
}
