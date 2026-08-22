import { useRef } from "react";
import DotMap, { type DotMapHandle } from "../components/tier2/DotMap";
import Tier2Hero from "../components/tier2/Tier2Hero";
import Stop from "../components/tier2/Stop";
import Tier2Enquire from "../components/tier2/Tier2Enquire";
import { useTier2Animations, type Tier2Stop } from "../hooks/useTier2Animations";

type StopData = Tier2Stop & {
  eyebrow: string;
  title: [string, string];
  copy: string;
  coords: string;
  slug: string;
};

const STOPS: StopData[] = [
  {
    id: "tier2-alpine",
    mapPos: [0.48, 0.28],
    eyebrow: "Mountain & ice",
    title: ["High and", "quiet"],
    copy: "Alpine chalets, Patagonian lodges, and the far south when the season allows.",
    coords: "46.8°N 9.8°E",
    slug: "alpine-ridge"
  },
  {
    id: "tier2-bali",
    mapPos: [0.74, 0.58],
    eyebrow: "Coast & islands",
    title: ["The warm", "edge"],
    copy: "Private houses on quiet water, from the Aegean to the Andaman Sea.",
    coords: "8.5°S 115.2°E",
    slug: "bali-coast"
  },
  {
    id: "tier2-desert",
    mapPos: [0.52, 0.5],
    eyebrow: "Desert & plain",
    title: ["Open", "country"],
    copy: "Mobile camps and long horizons — Namibia, Oman, the Serengeti in green season.",
    coords: "23.4°N 25.7°E",
    slug: "desert-ruins"
  },
  {
    id: "tier2-cities",
    mapPos: [0.68, 0.32],
    eyebrow: "Cities & culture",
    title: ["Doors that", "open"],
    copy: "Kyoto, Seville, Jaipur — with the rooms, tables and hours other travellers don't get.",
    coords: "35.0°N 135.8°E",
    slug: "reef-dive"
  }
];

export default function Tier2() {
  const dotMapRef = useRef<DotMapHandle>(null);
  useTier2Animations(dotMapRef, STOPS);

  return (
    <div className="relative bg-ink min-h-screen text-white font-sans overflow-hidden">
      <DotMap ref={dotMapRef} className="fixed inset-0 z-0" />
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 42%, rgba(14,13,12,0), rgba(14,13,12,.75) 78%)" }}
      />

      <a
        href="/"
        className="fixed top-6 left-6 z-50 text-[10px] tracking-[0.3em] uppercase text-white/45 hover:text-gold-light transition-colors"
      >
        ← Main site
      </a>

      <main className="relative z-10">
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
          />
        ))}
        <Tier2Enquire />
      </main>
    </div>
  );
}
