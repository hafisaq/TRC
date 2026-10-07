import { useEffect, useRef, useState } from "react";
import MoreDoodle from "../MoreDoodle";
import { t } from "../../lib/i18n";
import "./still-water.css";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// The wellness page's backdrop — the navigator's chart, after the wind
// has dropped: still water with slow rings spreading where something
// touched it, a river meandering through, an enso in place of the
// compass rose, reeds and a lotus sketched in at the margins, and leaves
// drifting across on the current. Same ink and gold as the atlas.
export default function StillWaterChart() {
  const INK = "rgba(22,36,60,.13)";
  const INK_SOFT = "rgba(22,36,60,.09)";
  const GOLD_INK = "rgba(143,114,49,.3)";
  const SAGE = "rgba(127,148,120,.32)";
  return (
    <>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {/* the river, drawn in on arrival, flowing ever after */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path className="sketch-line" pathLength={1} d="M -40 520 C 180 480, 300 600, 520 560 S 820 440, 1040 520 S 1340 640, 1500 580" stroke={INK} strokeWidth="1.4" />
          <path className="sketch-line" pathLength={1} style={{ animationDelay: "0.2s" }} d="M -40 548 C 180 508, 300 628, 520 588 S 820 468, 1040 548 S 1340 668, 1500 608" stroke={INK_SOFT} strokeWidth="1" />
          <path className="atlas-route" style={{ animationDuration: "40s" }} d="M -40 534 C 180 494, 300 614, 520 574 S 820 454, 1040 534 S 1340 654, 1500 594" stroke={SAGE} strokeWidth="1" strokeDasharray="2 10" />
          {/* the far shore and the near reeds */}
          <path className="sketch-line" pathLength={1} style={{ animationDelay: "0.5s" }} d="M -20 300 C 200 280, 420 310, 640 286 S 1040 240, 1460 270" stroke={INK_SOFT} strokeWidth="1.1" />
          <g className="sketch-late" style={{ animationDelay: "1.2s" }} stroke={INK} strokeWidth="1.1">
            {[[90, 740], [112, 752], [128, 736], [1300, 760], [1322, 748], [1344, 764]].map(([x, y], i) => (
              <path key={i} className="reed-sway" style={{ animationDelay: `${i * 0.6}s`, animationDuration: `${5 + (i % 3)}s` }} d={`M ${x} ${y + 60} C ${x + 2} ${y + 30}, ${x - 6} ${y + 12}, ${x} ${y}`} />
            ))}
          </g>
        </g>

        {/* rings spreading on still water */}
        <g fill="none" stroke={GOLD_INK} strokeWidth="1">
          {[[360, 410], [980, 640], [1180, 380]].map(([x, y], i) => (
            <g key={i}>
              {[0, 1].map((k) => (
                <circle key={k} className="water-ring" cx={x} cy={y} r="70" style={{ animationDelay: `${i * 3.1 + k * 7}s` }} />
              ))}
              <circle cx={x} cy={y} r="2" fill={GOLD_INK} stroke="none" />
            </g>
          ))}
        </g>

        {/* words on the water, old-map style */}
        <g className="sketch-late" style={{ animationDelay: "1.7s" }} fontFamily="var(--font-serif)" fontStyle="italic" fill="rgba(22,36,60,.16)" stroke="none">
          <text x="780" y="642" fontSize="17" letterSpacing="4">{t("still.stillness")}</text>
          <text x="880" y="250" fontSize="12" letterSpacing="3">{t("still.breath")}</text>
          <text x="220" y="470" fontSize="12" letterSpacing="3">{t("still.balance")}</text>
        </g>

        {/* a lotus at the margin, a stack of stones at the other */}
        <g className="sketch-late" style={{ animationDelay: "1.4s" }} fill="none" stroke={GOLD_INK} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" transform="translate(1160 700) scale(1.1)">
          <path d="M100 40 C 88 58, 86 80, 100 96 C 114 80, 112 58, 100 40 Z" />
          <path d="M100 96 C 78 92, 64 76, 66 56 C 84 62, 96 76, 100 96" />
          <path d="M100 96 C 122 92, 136 76, 134 56 C 116 62, 104 76, 100 96" />
          <path d="M100 96 C 74 100, 52 92, 44 76 C 64 74, 86 82, 100 96" />
          <path d="M100 96 C 126 100, 148 92, 156 76 C 136 74, 114 82, 100 96" />
        </g>
        <g className="sketch-late" style={{ animationDelay: "1.6s" }} fill="none" stroke={INK} strokeWidth="1.1" transform="translate(120 120) scale(0.9)">
          <path d="M60 100 C 60 86, 140 86, 140 100 C 140 110, 60 110, 60 100 Z" />
          <path d="M70 86 C 70 72, 130 72, 130 86 C 130 92, 70 92, 70 86 Z" />
          <path d="M82 72 C 82 60, 118 60, 118 72 C 118 76, 82 76, 82 72 Z" />
        </g>

        {/* the enso, where the compass rose was */}
        <g transform="translate(1268 148)" fill="none" stroke={GOLD_INK}>
          <path className="sketch-line" pathLength={1} style={{ animationDelay: "0.8s" }} d="M 18 -50 C 52 -40, 64 10, 36 38 C 8 66, -48 56, -56 14 C -64 -24, -34 -56, 0 -56" strokeWidth="2.2" strokeLinecap="round" />
          <circle className="atlas-rose-dash" r="64" strokeWidth="0.8" strokeDasharray="1 6" />
          <circle r="2.5" fill="rgba(143,114,49,.35)" stroke="none" />
        </g>

        {/* breath marks down the margins — four in, seven held, eight out */}
        <g stroke="rgba(22,36,60,.12)" strokeWidth="1">
          {[90, 210, 330, 450, 570, 690, 810].map((y) => (
            <line key={y} x1="0" y1={y} x2={y % 180 === 90 ? 22 : 12} y2={y} />
          ))}
          {[130, 320, 510, 700].map((y) => (
            <line key={`r${y}`} x1="1440" y1={y} x2="1424" y2={y} />
          ))}
        </g>
      </svg>
      {/* leaves on the current */}
      {[
        { path: 'path("M -60 560 C 400 520, 900 600, 1560 540")', dur: "70s", delay: "0s", size: 14, o: 0.5 },
        { path: 'path("M 1540 300 C 1000 260, 500 340, -80 290")', dur: "96s", delay: "22s", size: 11, o: 0.4 },
        { path: 'path("M -60 700 C 460 660, 1000 740, 1560 690")', dur: "84s", delay: "48s", size: 12, o: 0.42 }
      ].map((leaf, i) => (
        <div key={i} className="ambient-leaf absolute left-0 top-0" style={{ offsetPath: leaf.path, animationDuration: leaf.dur, animationDelay: leaf.delay }}>
          <svg className="leaf-turn" width={leaf.size * 1.6} height={leaf.size} viewBox="0 0 32 20" style={{ opacity: leaf.o }}>
            <path d="M2 18 C 6 6, 18 1, 30 2 C 28 12, 18 19, 2 18 Z" fill="rgba(127,148,120,.55)" stroke="rgba(22,36,60,.35)" strokeWidth="0.8" />
            <path d="M2 18 L 30 2" stroke="rgba(22,36,60,.35)" strokeWidth="0.8" />
          </svg>
        </div>
      ))}
    </>
  );
}

// The hero's breath: a hairline ring behind the cut-out name, swelling
// and settling on the eight-second count. No words here — the name is
// the only text the hero needs.
export function HeroBreath() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute left-1/2 top-[46%] h-[min(72vw,56vh)] w-[min(72vw,56vh)] -translate-x-1/2 -translate-y-1/2 sm:top-1/2">
        <div className="breath-ring absolute inset-0 rounded-full border border-gold-light/40" />
        <div className="breath-ring breath-ring--late absolute -inset-[7%] rounded-full border border-gold-light/20" style={{ borderStyle: "dashed" }} />
        <div className="breath-ring absolute inset-[9%] rounded-full" style={{ background: "radial-gradient(circle, rgba(127,148,120,.16), transparent 70%)" }} />
      </div>
    </div>
  );
}

// Still water, scroll-driven: a pinned moment where a single drop falls as
// you scroll, meets the water line and sends rings out across it. The
// heading is there from the start, so the screen never waits empty.
export function StillInterlude() {
  const ref = useRef<HTMLElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let last = -1;
    const apply = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
      const p = reduced ? 1 : clamp(-rect.top / scrollable, 0, 1);
      if (rect.top < window.innerHeight && rect.bottom > 0) setSeen(true);
      if (Math.abs(p - last) < 0.002) return;
      last = p;
      // the fall: 0–.3 · the touch: .3 · the rings: .3–1
      const fall = clamp(p / 0.3, 0, 1);
      const spread = clamp((p - 0.3) / 0.7, 0, 1);
      const eased = 1 - Math.pow(1 - spread, 2.2);
      if (dropRef.current) {
        // the fall starts just inside the top of the water box, whatever
        // its size on this screen, so the drop never sits over the heading
        const box = dropRef.current.parentElement;
        const from = box ? box.offsetHeight / 2 - 6 : 120;
        dropRef.current.style.transform = `translate(-50%, ${-from + fall * from}px) scaleY(${1 + fall * 0.3})`;
        dropRef.current.style.opacity = String(p < 0.3 ? 0.9 : clamp(1 - spread * 8, 0, 1));
      }
      if (ringsRef.current) {
        ringsRef.current.querySelectorAll<HTMLElement>("[data-ring]").forEach((ring, i) => {
          const lag = clamp((eased - i * 0.14) / (1 - i * 0.14), 0, 1);
          ring.style.transform = `translate(-50%, -50%) scale(${0.08 + lag * (1.1 + i * 0.35)})`;
          ring.style.opacity = String(p > 0.3 ? 1 - lag * 0.75 : 0);
        });
      }
      if (lineRef.current) {
        const dip = p > 0.3 ? Math.sin(Math.min(1, spread * 3) * Math.PI) * 10 : 0;
        lineRef.current.style.setProperty("--dip", `${dip.toFixed(1)}px`);
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(apply); };
    apply();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <section ref={ref} id="cd-breath" className="relative h-[190svh] w-full sm:h-[220svh]">
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pt-20 pb-[calc(env(safe-area-inset-bottom)+96px)] sm:pb-10">
        <div className="text-center">
          <div className="font-mono text-[8.5px] uppercase tracking-[0.34em] text-gold-deep">{t("wellness.glanceEyebrow")}</div>
          <h2 className="mt-3 font-serif text-[clamp(28px,4.4vw,48px)] font-light leading-[1.02] text-navy">{t("wellness.glanceTitle")}</h2>
        </div>

        <div className="relative mt-2 grid w-full max-w-[1100px] grid-cols-1 items-center justify-items-center lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
          <div className="hidden lg:block lg:justify-self-end">
            <MoreDoodle kind="meditate" tone="dark" className="w-[180px]" play={seen} />
          </div>
          <div className="relative h-[min(46vw,240px)] w-[min(92vw,620px)]">
            <div ref={lineRef} className="still-line absolute inset-x-0 top-1/2" />
            <div ref={ringsRef} className="absolute left-1/2 top-1/2 h-[min(44vw,220px)] w-[min(44vw,220px)]" style={{ transform: "translate(-50%, -50%)" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} data-ring className="absolute left-1/2 top-1/2 h-full w-full rounded-full border border-gold-deep/80 will-change-transform" style={{ transform: "translate(-50%, -50%) scale(0.08)", opacity: 0, borderStyle: i === 1 ? "dashed" : "solid" }} />
              ))}
            </div>
            <div ref={dropRef} className="absolute left-1/2 top-1/2 will-change-transform" style={{ transform: "translate(-50%, -120px)", opacity: 0, transformOrigin: "50% 100%" }}>
              {/* a drop: pointed at the top, round below, a catch of light */}
              <svg width="14" height="22" viewBox="0 0 14 22" aria-hidden="true" className="block">
                <defs>
                  <radialGradient id="still-drop-fill" cx="40%" cy="40%" r="65%">
                    <stop offset="0" stopColor="#f1dfa8" />
                    <stop offset="0.55" stopColor="#c8a24c" />
                    <stop offset="1" stopColor="#8f7231" />
                  </radialGradient>
                </defs>
                <path d="M7 1 C7 1 0.5 10 0.5 14.5 a6.5 6.5 0 0 0 13 0 C13.5 10 7 1 7 1 Z" fill="url(#still-drop-fill)" />
                <ellipse cx="5" cy="13" rx="1.4" ry="2.2" fill="rgba(255,255,255,.55)" transform="rotate(-20 5 13)" />
              </svg>
            </div>
          </div>
          <div className="hidden lg:block lg:justify-self-start">
            <MoreDoodle kind="enso" tone="dark" className="w-[180px]" play={seen} />
          </div>
        </div>

      </div>
    </section>
  );
}
