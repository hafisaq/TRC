import type { StopLayout, StopTheme } from "../components/tier2/Stop";
import type { Tier2Stop } from "../hooks/useTier2Animations";

export type Destination = Tier2Stop & {
  eyebrow: string;
  title: [string, string];
  copy: string;
  coords: string;
  slug: string;
  season: string;
  highlights: string[];
  theme: StopTheme;
  layout: StopLayout;
  navLabel: string;
  interest: string;
  gate: string;
  statusLabel: string;
  // When set, Stop's CTA becomes this link instead of "Enquire about this
  // route" — used for About Us (scrolls to the next stop) and region
  // overviews like Asia (a real page navigation to that region's journey).
  ctaLabel?: string;
  ctaHref?: string;
};

export const DESTINATIONS: Destination[] = [
  {
    id: "tier2-about",
    mapPos: [0.42, 0.22],
    eyebrow: "The Retreat Collection",
    title: ["Private travel,", "arranged with care"],
    copy: "We design journeys, not itineraries — each one built around the traveller, not a fixed package. Every stay in the collection is visited, vetted, and arranged directly, so what you see here is what you get.",
    coords: "About us",
    slug: "alpine-ridge",
    season: "Est. 2024",
    highlights: ["Bespoke routing", "Direct relationships", "No fixed packages"],
    theme: "white",
    layout: "split",
    navLabel: "About",
    interest: "General enquiry",
    gate: "A1",
    statusLabel: "About Us",
    ctaLabel: "Continue the journey ↓",
    ctaHref: "#tier2-asia"
  },
  {
    id: "tier2-asia",
    mapPos: [0.64, 0.4],
    eyebrow: "Coast, temple & garden",
    title: ["The region", "of Asia"],
    copy: "Bali's quiet coastlines, Maldivian reefs, Sri Lankan hill country, Rajasthan's forts — one region, four very different ways to disappear.",
    coords: "13.7°N 100.5°E",
    slug: "bali-coast",
    season: "Year-round",
    highlights: ["4 stays", "Private guide", "Custom routing"],
    theme: "gold",
    layout: "cinematic",
    navLabel: "Asia",
    interest: "Asia",
    gate: "AS1",
    statusLabel: "Asia"
  },
  {
    id: "tier2-alpine",
    mapPos: [0.48, 0.28],
    eyebrow: "Mountain & ice",
    title: ["High and", "quiet"],
    copy: "Alpine chalets, Patagonian lodges, and the far south when the season allows. Days built around light - first tracks at dawn, a slow lunch on a sun terrace, nothing scheduled after four.",
    coords: "46.8°N 9.8°E",
    slug: "alpine-ridge",
    season: "Dec - Mar",
    highlights: ["Private guide", "Heli access", "3-night minimum"],
    theme: "white",
    layout: "split",
    navLabel: "Mountains",
    interest: "Mountain & ice",
    gate: "M1",
    statusLabel: "Mountains"
  },
  {
    id: "tier2-bali",
    mapPos: [0.74, 0.58],
    eyebrow: "Coast & islands",
    title: ["The warm", "edge"],
    copy: "Private houses on quiet water, from the Aegean to the Andaman Sea. No resort schedule - a boat, a cook, and a stretch of coast nobody else has been told about.",
    coords: "8.5°S 115.2°E",
    slug: "bali-coast",
    season: "Apr - Oct",
    highlights: ["Private villa", "Boat included", "Chef on call"],
    theme: "gold",
    layout: "cinematic",
    navLabel: "Coast",
    interest: "Coast & islands",
    gate: "C1",
    statusLabel: "Coast"
  },
  {
    id: "tier2-desert",
    mapPos: [0.52, 0.5],
    eyebrow: "Desert & plain",
    title: ["Open", "country"],
    copy: "Mobile camps and long horizons - Namibia, Oman, the Serengeti in green season. The camp moves with you, so the view from the tent door is never the one from yesterday.",
    coords: "23.4°N 25.7°E",
    slug: "desert-ruins",
    season: "Jun - Sep",
    highlights: ["Mobile camp", "Star-bed nights", "4x4 included"],
    theme: "white",
    layout: "portal",
    navLabel: "Desert",
    interest: "Desert & plain",
    gate: "D1",
    statusLabel: "Desert"
  },
  {
    id: "tier2-cities",
    mapPos: [0.68, 0.32],
    eyebrow: "Cities & culture",
    title: ["Doors that", "open"],
    copy: "Kyoto, Seville, Jaipur - with the rooms, tables and hours other travellers don't get. A local designer walks every route with you before you arrive.",
    coords: "35.0°N 135.8°E",
    slug: "reef-dive",
    season: "Year-round",
    highlights: ["Private access", "Local designer", "No fixed hours"],
    theme: "gold",
    layout: "editorial",
    navLabel: "Cities",
    interest: "Cities & culture",
    gate: "K1",
    statusLabel: "Cities"
  }
];

// Call-time functions, NOT module constants: CMS hydration mutates
// DESTINATIONS in place before first render, and a snapshot taken at
// module evaluation would go stale.
export const flightStops = () => DESTINATIONS.map((s) => ({ id: s.id, theme: s.theme, coords: s.coords }));

// Geometry only, for Tier2FlightPath — the path continues past the last
// content stop and lands on the boarding pass's own plane icon (via its
// data-flight-node anchor). The hold pair (straight lane through the
// pinned country strip) is inserted after the Asia stop BY ID, so extra
// CMS-added stops don't shift it.
export const flightPathStops = () => {
  // every region selector pinned after a stop gets a hold pair — two
  // anchors sharing an x give the path a dead-straight lane through the
  // tall section instead of the plane drifting across its content
  const holdAfter: Record<string, string> = {
    "tier2-asia": "tier2-asia",
    "tier2-alpine": "tier2-alpine",
    "tier2-bali": "tier2-coast",
    "tier2-desert": "tier2-desert"
  };
  const out: Array<{ id: string; theme: "gold" | "white"; coords: string }> = [];
  for (const s of flightStops()) {
    out.push(s);
    const hold = holdAfter[s.id];
    if (hold) {
      out.push({ id: `${hold}-hold-in`, theme: "white", coords: "" });
      out.push({ id: `${hold}-hold-out`, theme: "white", coords: "" });
    }
  }
  out.push({ id: "tier2-enquire", theme: DESTINATIONS[DESTINATIONS.length - 1].theme, coords: "" });
  return out;
};
