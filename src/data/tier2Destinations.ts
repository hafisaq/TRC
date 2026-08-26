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
};

export const DESTINATIONS: Destination[] = [
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

export const FLIGHT_STOPS = DESTINATIONS.map((s) => ({ id: s.id, theme: s.theme, coords: s.coords }));
