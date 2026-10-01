import { useEffect, useRef, useState } from "react";
import "./more-doodle.css";

// The trailing "More" item of every country selector carries no footage,
// so it carries a doodle instead: a few gold strokes that sketch
// themselves in, in the manner of the section they close — a palm for the
// tropics, peaks for the mountains, a sail for the coast, dunes for the
// desert, a skyline for the cities. Pure SVG + CSS, no script, and the
// drawing stands still for anyone who prefers reduced motion.
// The wellness route has a whole set of its own — a lotus on still water,
// a figure sitting in meditation, a stack of stones, steam off a cup, an
// enso circle, the rings of a breath — used around its film and its page.
export type DoodleKind = "tropics" | "mountains" | "coast" | "desert" | "cities" | "wellness" | "lotus" | "meditate" | "stones" | "steam" | "enso" | "breath";

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
    { d: "M20 88 q 10 -6 20 0 q 8 4 14 2 C 56 88, 57 74, 61 73 C 65 73, 63 83, 58 89 C 60 92, 67 91, 67 87 C 67 84, 62 84, 62 88 C 62 91, 66 91, 70 88 C 72 85, 77 84, 79 86 C 80 89, 76 91, 74 90 C 72 88, 75 85, 78 85 C 80 86, 80 90, 82 90 C 84 90, 86 89, 87 87 C 88 87.25, 90 87.25, 90 88.35 L 90 90 C 91 88.35, 95 86.7, 97 87.8 C 98 88.9, 97 90, 99 90 C 100 88.9, 101 87.25, 102 87.25 C 102 88.9, 102 90.55, 105 90 C 107 89.45, 108 87.8, 109 87.25 C 109 88.9, 109 90.55, 112 90 C 114 89.45, 116 88.9, 118 88.9 q 12 -6 24 0 t 24 0 q 6 3 10 0", delay: 0, drift: "bob" },   // the sea — and, under the hull, a word for whoever looks twice,  // sea
    { d: "M84 80 L 84 30", delay: 0.6 },                                                 // mast
    { d: "M84 32 L 132 76 L 88 76 Z", delay: 0.9, drift: "sway" },                       // mainsail
    { d: "M80 40 L 52 76 L 80 76 Z", delay: 1.15, drift: "sway" },                       // jib
    { d: "M66 82 L 118 82 L 110 92 L 74 92 Z", delay: 1.4 },                             // hull
    { d: "M154 34 a10 10 0 1 1 0.1 0", delay: 1.7, drift: "rise" },                      // sun
  ],
  desert: [
    { d: "M10 100 C 50 80, 80 80, 110 96 S 170 104, 190 92", delay: 0 },                 // dunes
    { d: "M60 92 V 58 a 24 24 0 0 1 48 0 V 92", delay: 0.5 },                            // souq arch
    { d: "M66 92 V 60 a 18 18 0 0 1 36 0 V 92", delay: 0.8 },
    { d: "M84 34 V 46 M78 46 h 12 l -2 14 h -8 z M84 60 v 4", delay: 1.2, drift: "sway" }, // lantern
    { d: "M150 30 a 11 11 0 1 0 10 16 a 8 8 0 0 1 -10 -16 z", delay: 1.5, drift: "rise" }, // crescent
    { d: "M132 52 l 2 -4 l 2 4 l -4 0 M170 44 l 1.5 -3 l 1.5 3 z", delay: 1.8, drift: "twinkle" }, // stars
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
  wellness: [
    { d: "M30 104 q 10 -5 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0", delay: 0, drift: "bob" },       // still water
    { d: "M100 40 C 88 58, 86 80, 100 96 C 114 80, 112 58, 100 40 Z", delay: 0.5 },                      // lotus, heart petal
    { d: "M100 96 C 78 92, 64 76, 66 56 C 84 62, 96 76, 100 96", delay: 0.8, drift: "sway" },
    { d: "M100 96 C 122 92, 136 76, 134 56 C 116 62, 104 76, 100 96", delay: 0.95, drift: "sway" },
    { d: "M100 96 C 74 100, 52 92, 44 76 C 64 74, 86 82, 100 96", delay: 1.15 },
    { d: "M100 96 C 126 100, 148 92, 156 76 C 136 74, 114 82, 100 96", delay: 1.3 },
    { d: "M160 30 a9 9 0 1 1 0.1 0", delay: 1.7, drift: "rise" },                                         // sun
    { d: "M36 36 q 6 -5 12 0 M30 46 q 6 -5 12 0", delay: 2.0, drift: "twinkle" },                         // a breath of air
  ],
  lotus: [
    { d: "M100 40 C 88 58, 86 80, 100 96 C 114 80, 112 58, 100 40 Z", delay: 0 },
    { d: "M100 96 C 78 92, 64 76, 66 56 C 84 62, 96 76, 100 96", delay: 0.3, drift: "sway" },
    { d: "M100 96 C 122 92, 136 76, 134 56 C 116 62, 104 76, 100 96", delay: 0.45, drift: "sway" },
    { d: "M100 96 C 74 100, 52 92, 44 76 C 64 74, 86 82, 100 96", delay: 0.7 },
    { d: "M100 96 C 126 100, 148 92, 156 76 C 136 74, 114 82, 100 96", delay: 0.85 },
    { d: "M40 106 q 10 -5 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0", delay: 1.1, drift: "bob" },
  ],
  meditate: [
    { d: "M110 32 a10 10 0 1 1 -20 0 a10 10 0 1 1 20 0", delay: 0 },                                      // head
    { d: "M88 50 C 84 62, 82 74, 84 86 M112 50 C 116 62, 118 74, 116 86", delay: 0.4 },                   // torso
    { d: "M88 50 C 70 56, 58 70, 62 86 M112 50 C 130 56, 142 70, 138 86", delay: 0.7 },                   // arms to the knees
    { d: "M60 92 C 70 82, 90 80, 100 90 C 110 80, 130 82, 140 92", delay: 1.0 },                          // crossed legs
    { d: "M56 98 C 78 106, 122 106, 144 98", delay: 1.2 },                                                // the ground
    { d: "M62 86 a3 3 0 1 0 0.1 0 M138 86 a3 3 0 1 0 0.1 0", delay: 1.4, drift: "twinkle" },               // open hands
    { d: "M68 40 A 38 38 0 0 1 132 40", delay: 1.7, drift: "rise" },                                      // the breath above
  ],
  stones: [
    { d: "M60 100 C 60 86, 140 86, 140 100 C 140 110, 60 110, 60 100 Z", delay: 0 },
    { d: "M70 86 C 70 72, 130 72, 130 86 C 130 92, 70 92, 70 86 Z", delay: 0.35 },
    { d: "M82 72 C 82 60, 118 60, 118 72 C 118 76, 82 76, 82 72 Z", delay: 0.7 },
    { d: "M92 60 C 92 52, 108 52, 108 60 C 108 63, 92 63, 92 60 Z", delay: 1.0 },
    { d: "M150 60 C 160 44, 176 42, 182 50 C 176 64, 160 68, 150 60 Z M150 60 L 182 50", delay: 1.3, drift: "sway" }, // a leaf
    { d: "M24 110 q 8 -4 16 0 q 8 4 16 0", delay: 1.6, drift: "bob" },                                    // ripple
  ],
  steam: [
    { d: "M70 76 h 60 l -6 28 h -48 z", delay: 0 },                                                       // the cup
    { d: "M130 82 c 16 0 16 18 0 18", delay: 0.4 },                                                       // handle
    { d: "M58 110 h 84", delay: 0.6 },                                                                    // saucer
    { d: "M88 66 c -8 -10, 8 -18, 0 -28", delay: 0.9, drift: "rise" },                                    // steam
    { d: "M100 62 c -8 -10, 8 -18, 0 -28", delay: 1.1, drift: "rise" },
    { d: "M112 66 c -8 -10, 8 -18, 0 -28", delay: 1.3, drift: "rise" },
  ],
  enso: [
    { d: "M118 28 C 150 36, 164 70, 144 92 C 124 112, 70 112, 54 84 C 38 56, 62 24, 100 22", delay: 0 },  // the brush circle
    { d: "M100 60 a3 3 0 1 1 0.1 0", delay: 1.2, drift: "twinkle" },                                      // its centre
  ],
  breath: [
    { d: "M100 60 m -44 0 a44 44 0 1 0 88 0 a44 44 0 1 0 -88 0", delay: 0, drift: "rise" },
    { d: "M100 60 m -30 0 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0", delay: 0.3, drift: "rise" },
    { d: "M100 60 m -16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0", delay: 0.6, drift: "rise" },
    { d: "M100 60 a2 2 0 1 1 0.1 0", delay: 0.9, drift: "twinkle" },
  ],
};

// The strokes draw only while the doodle is on screen (and while the parent
// says the item is in play), and draw again each time it comes back — a
// card that sketched itself at page load, unseen, is no doodle at all.
export default function MoreDoodle({ kind, tone = "light", className = "", play = true }: { kind: DoodleKind; tone?: "light" | "dark"; className?: string; play?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setSeen(entries.some((e) => e.isIntersecting)), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const on = seen && play;
  return (
    <svg
      ref={ref}
      className={`more-doodle block more-doodle--${tone}${on ? " more-doodle--on" : ""} ${className}`}
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
