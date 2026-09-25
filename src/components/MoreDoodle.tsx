import "./more-doodle.css";

// The trailing "More" item of every country selector carries no footage,
// so it carries a doodle instead: a few gold strokes that sketch
// themselves in, in the manner of the section they close — a palm for the
// tropics, peaks for the mountains, a sail for the coast, dunes for the
// desert, a skyline for the cities. Pure SVG + CSS, no script, and the
// drawing stands still for anyone who prefers reduced motion.
export type DoodleKind = "tropics" | "mountains" | "coast" | "desert" | "cities";

type Stroke = { d: string; delay?: number; drift?: "sway" | "bob" | "rise" | "twinkle" };

const ART: Record<DoodleKind, Stroke[]> = {
  tropics: [
    { d: "M28 96 C 44 90, 120 90, 172 96", delay: 0 },                                  // shoreline
    { d: "M150 40 a14 14 0 1 1 0.1 0", delay: 0.2, drift: "rise" },                      // sun
    { d: "M72 96 C 74 74, 78 52, 84 34", delay: 0.6 },                                   // trunk
    { d: "M84 34 C 100 22, 118 26, 130 44", delay: 1.0, drift: "sway" },                 // fronds
    { d: "M84 34 C 68 22, 50 26, 38 44", delay: 1.15, drift: "sway" },
    { d: "M84 34 C 96 42, 106 54, 110 66", delay: 1.3, drift: "sway" },
    { d: "M84 34 C 72 42, 62 54, 58 66", delay: 1.45, drift: "sway" },
    { d: "M84 34 C 82 22, 88 14, 98 12", delay: 1.6, drift: "sway" },
    { d: "M34 82 q 10 -6 20 0 q 10 6 20 0", delay: 1.9, drift: "bob" },                  // wave
  ],
  mountains: [
    { d: "M14 98 L 62 34 L 92 72 L 120 26 L 186 98", delay: 0 },                        // ridge
    { d: "M50 50 l 8 -6 l 6 8 l 8 -10", delay: 0.9 },                                    // snow line
    { d: "M110 44 l 8 -8 l 6 10 l 8 -12", delay: 1.05 },
    { d: "M150 30 a10 10 0 1 1 0.1 0", delay: 1.3, drift: "rise" },                      // sun
    { d: "M36 98 l 8 -16 l 8 16 M40 90 l 4 -8 l 4 8", delay: 1.6 },                      // pine
  ],
  coast: [
    { d: "M20 88 q 12 -8 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0", delay: 0, drift: "bob" },  // sea
    { d: "M84 80 L 84 30", delay: 0.6 },                                                 // mast
    { d: "M84 32 L 132 76 L 88 76 Z", delay: 0.9, drift: "sway" },                       // mainsail
    { d: "M80 40 L 52 76 L 80 76 Z", delay: 1.15, drift: "sway" },                       // jib
    { d: "M66 82 L 118 82 L 110 92 L 74 92 Z", delay: 1.4 },                             // hull
    { d: "M154 34 a10 10 0 1 1 0.1 0", delay: 1.7, drift: "rise" },                      // sun
  ],
  desert: [
    { d: "M10 92 C 50 70, 80 70, 110 88 S 170 98, 190 84", delay: 0 },                   // dunes
    { d: "M40 100 C 70 84, 120 82, 190 100", delay: 0.5 },
    { d: "M136 36 a14 14 0 1 1 0.1 0", delay: 0.9, drift: "rise" },                      // sun
    { d: "M116 36 l -8 0 M156 36 l 8 0 M136 16 l 0 -8 M122 22 l -6 -6 M150 22 l 6 -6", delay: 1.3, drift: "twinkle" }, // rays
    { d: "M46 86 C 47 74, 49 64, 52 56", delay: 1.6 },                                   // palm
    { d: "M52 56 C 62 48, 74 50, 80 60 M52 56 C 42 48, 30 50, 24 60 M52 56 C 60 62, 66 70, 68 78 M52 56 C 44 62, 38 70, 36 78 M52 56 C 51 48, 55 42, 62 40", delay: 1.8, drift: "sway" },
  ],
  cities: [
    { d: "M14 96 L 186 96", delay: 0 },                                                  // ground
    { d: "M30 96 V 62 h 22 V 96", delay: 0.4 },                                          // blocks
    { d: "M60 96 V 40 h 18 V 96", delay: 0.6 },
    { d: "M86 96 V 52 h 26 V 96", delay: 0.8 },
    { d: "M120 96 V 28 h 14 V 96", delay: 1.0 },
    { d: "M142 96 V 58 h 24 V 96", delay: 1.2 },
    { d: "M127 28 V 16", delay: 1.4 },                                                   // spire
    { d: "M36 70 h 4 M44 70 h 4 M36 80 h 4 M66 50 h 4 M72 60 h 4 M94 62 h 4 M102 72 h 4 M148 68 h 4 M156 78 h 4", delay: 1.7, drift: "twinkle" }, // windows
    { d: "M164 26 a 9 9 0 1 0 8 14 a 7 7 0 0 1 -8 -14 z", delay: 2.0, drift: "rise" },   // moon
  ],
};

export default function MoreDoodle({ kind, tone = "light", className = "" }: { kind: DoodleKind; tone?: "light" | "dark"; className?: string }) {
  return (
    <svg
      className={`more-doodle block more-doodle--${tone} ${className}`}
      viewBox="0 0 200 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ART[kind].map((s, i) => (
        <path key={i} d={s.d} pathLength={1} className={`more-doodle__stroke${s.drift ? ` more-doodle__stroke--${s.drift}` : ""}`}
          style={{ animationDelay: `${s.delay ?? 0}s, ${(s.delay ?? 0) + 2.6}s` }} />
      ))}
    </svg>
  );
}
