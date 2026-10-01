import { useEffect, useRef, useState } from "react";
import type { CatalogEntry, Region } from "../../data/regions/types";
import { filmForPoster, imgSized, lqipVarForPoster } from "../../lib/media";
import { isAr, t } from "../../lib/i18n";
import MoreDoodle, { type DoodleKind } from "../MoreDoodle";
import { MediaVideo } from "../Media";
import { useIsPinnedLayout, useSnapIndex } from "../../lib/useSnapIndex";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const countWord = (n: number) => WORDS[n] ?? String(n);
export const staySlug = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Wellness & Health's selector — the sixth idiom. The retreats are
// STEPPING STONES across still water: a pinned glide (the grammar every
// selector shares) where the cards sit at rising and falling heights on a
// path that draws itself across the board as you scroll, and small
// meditation doodles sketch in between the stones. Dark ground, so the
// cream sanctuary stop above it reads as the light and this as the hush.
const MARKS: DoodleKind[] = ["enso", "lotus", "steam", "stones", "breath"];

export default function SteppingStones({ region, entries, onMore }: { region: Region; entries: CatalogEntry[]; onMore?: () => void }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const wakeRef = useRef<SVGPathElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const pinned = useIsPinnedLayout();
  const n = entries.length + 1; // + the trailing More stone
  const snap = useSnapIndex(rowRef, n, innerRef);
  const [drawn, setDrawn] = useState(false);

  // the rise and fall of the stones: a slow wave, in px, desktop only
  const lift = (i: number) => Math.round(Math.sin(i * 1.05) * 34);

  useEffect(() => {
    let maxShift = 0;
    let target = 0;
    let current = -1;
    let raf = 0;
    let length = 1;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // the path threads the centre of every stone; measured from layout so
    // it lands exactly however wide the cards are on this screen
    const trace = () => {
      const inner = innerRef.current;
      const svg = svgRef.current;
      const path = pathRef.current;
      if (!inner || !svg || !path) return;
      const kids = Array.from(inner.children).filter((k) => (k as HTMLElement).dataset.stone) as HTMLElement[];
      if (kids.length < 2) return;
      const w = inner.scrollWidth;
      const h = inner.offsetHeight;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
      const pts = kids.map((k) => [k.offsetLeft + k.offsetWidth / 2, k.offsetTop + k.offsetHeight * 0.5] as const);
      let d = `M ${pts[0][0] - 180} ${pts[0][1] + 40} C ${pts[0][0] - 60} ${pts[0][1]}, ${pts[0][0] - 40} ${pts[0][1]}, ${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1];
        const [x1, y1] = pts[i];
        const cx = (x0 + x1) / 2;
        d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
      }
      const [lx, ly] = pts[pts.length - 1];
      d += ` C ${lx + 60} ${ly}, ${lx + 120} ${ly - 30}, ${lx + 220} ${ly - 50}`;
      path.setAttribute("d", d);
      wakeRef.current?.setAttribute("d", d);
      length = path.getTotalLength() || 1;
      path.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length);
      setDrawn(true);
    };

    const measure = () => {
      current = -1;
      const inner = innerRef.current;
      const outer = rowRef.current;
      if (!inner || !outer || window.innerWidth < 1024) {
        maxShift = 0;
        if (inner) inner.style.transform = "";
        return;
      }
      const kids = Array.from(inner.children) as HTMLElement[];
      if (!kids.length) return;
      const gap = parseFloat(getComputedStyle(inner).columnGap || "0") || 0;
      const contentW = kids.reduce((acc, k) => acc + k.offsetWidth, 0) + gap * (kids.length - 1);
      const cs = getComputedStyle(outer);
      const avail = outer.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      maxShift = Math.max(0, contentW - avail);
      trace();
    };

    const readTarget = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
      target = clamp(-rect.top / scrollable, 0, 1);
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      raf = 0;
      const next = reducedMotion ? target : current + (target - current) * 0.14;
      const settled = Math.abs(next - target) < 0.0004;
      const value = settled ? target : next;
      if (value === current) return;
      current = value;
      if (maxShift > 0 && innerRef.current) {
        innerRef.current.style.transform = `translate3d(${-maxShift * current}px, 0, 0)`;
      }
      if (barRef.current) barRef.current.style.width = `${current * 100}%`;
      // the path draws a little ahead of the glide, so the next stone is
      // always already joined by the time it reaches the centre
      if (pathRef.current && maxShift > 0) {
        pathRef.current.style.strokeDashoffset = String(length * (1 - clamp(current * 1.15 + 0.12, 0, 1)));
      }
      if (!settled) raf = requestAnimationFrame(tick);
    };

    measure();
    readTarget();
    const onResize = () => { measure(); readTarget(); };
    window.addEventListener("scroll", readTarget, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", readTarget);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onResize);
    };
  }, [entries.length]);

  if (!entries.length) return null;

  return (
    <section ref={sectionRef} id="tier2-wellness-retreats" className="relative overflow-hidden bg-ink text-white lg:h-[300svh]">
      {/* the water: a slow sage glow breathing under the stones */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_70%,rgba(127,148,120,.16),transparent_70%),linear-gradient(180deg,#0e0d0c,#121a28_60%,#0e0d0c)]" />
      {/* flight-path hold markers (see CountryStrip): one straight lane
          down the pinned section */}
      <span id="tier2-wellness-hold-in" aria-hidden="true" className="absolute right-[7vw] top-[16%]">
        <span data-flight-node className="block h-px w-px" />
      </span>
      <span id="tier2-wellness-hold-out" aria-hidden="true" className="absolute right-[7vw] top-[84%]">
        <span data-flight-node className="block h-px w-px" />
      </span>

      <div className="relative flex flex-col justify-center gap-7 pt-14 pb-[calc(env(safe-area-inset-bottom)+104px)] sm:gap-8 sm:py-16 lg:sticky lg:top-0 lg:h-[100svh] lg:gap-4 lg:pt-[110px] lg:pb-6">
        <div className="px-5 sm:px-10 lg:px-16">
          <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-light">{t("wellness.choose")}</div>
          <div className="mt-2 flex items-end justify-between gap-6">
            <h3 className="font-serif text-[clamp(28px,4.6vw,52px)] font-light leading-[1.02] text-white">
              {region.title}
              <span className="ml-4 align-middle font-mono text-[9px] uppercase tracking-[0.26em] text-white/45">
                {isAr() ? String(entries.length) : countWord(entries.length)} {t("wellness.retreatsCount")}
              </span>
            </h3>
            <div className="hidden h-px flex-1 bg-white/15 lg:block">
              <div ref={barRef} className="h-full bg-gold-light shadow-[0_0_10px_rgba(227,198,130,.5)]" style={{ width: "0%" }} />
            </div>
            <div className="hidden font-mono text-[8.5px] uppercase tracking-[0.24em] text-white/45 lg:block">{t("hint.scrollAcross")}</div>
          </div>
        </div>

        <div ref={rowRef} className="flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain px-5 pt-6 pb-10 no-scrollbar sm:gap-6 sm:px-10 lg:snap-none lg:overflow-visible lg:px-16 lg:pt-4 lg:pb-6">
          <div ref={innerRef} className="relative flex items-start gap-5 sm:gap-6 lg:will-change-transform">
            {/* the path between the stones, drawn by the scroll */}
            <svg ref={svgRef} aria-hidden="true" className={`pointer-events-none absolute left-0 top-0 hidden lg:block transition-opacity duration-700 ${drawn ? "opacity-100" : "opacity-0"}`} fill="none">
              <path ref={pathRef} stroke="rgba(227,198,130,.55)" strokeWidth="1.2" strokeDasharray="1" strokeLinecap="round" style={{ strokeDashoffset: 1 }} />
              <path ref={wakeRef} className="stones-wake" stroke="rgba(127,148,120,.4)" strokeWidth="1" strokeDasharray="2 9" />
            </svg>
            {entries.map((entry, i) => {
              const slug = staySlug(entry.name);
              const mark = MARKS[i % MARKS.length];
              const gold = i % 2 === 0;
              return (
                <a
                  key={entry.name}
                  data-stone
                  href={`/wellness?stay=${slug}`}
                  style={{ ...(lqipVarForPoster(entry.poster) ?? {}), ["--lift" as string]: `${lift(i)}px` }}
                  className={`stone media-shell group relative h-[50svh] min-h-[330px] w-[72vw] shrink-0 snap-center overflow-hidden rounded-[22px] border transition-all duration-500 hover:-translate-y-1.5 sm:h-[54svh] sm:min-h-[360px] sm:w-[46vw] lg:h-[46svh] lg:min-h-[300px] lg:w-[24vw] lg:min-w-[280px] lg:max-w-[340px] ${
                    gold ? "border-gold/45 shadow-[0_22px_60px_rgba(200,162,76,.14)]" : "border-white/15 shadow-[0_22px_60px_rgba(0,0,0,.45)]"
                  } hover:border-gold-light`}
                >
                  <MediaVideo src={filmForPoster(entry.poster)} poster={imgSized(entry.poster, 900)}
                    hover={pinned} active={pinned || i === snap} sizes="(min-width: 1024px) 24vw, (min-width: 640px) 46vw, 72vw"
                    className="transition-transform duration-[1400ms] ease-out group-hover:scale-[1.07]" />
                  <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(14,13,12,.82),rgba(14,13,12,.08)_52%,rgba(14,13,12,.22))] transition-opacity duration-500 group-hover:opacity-80" />
                  <div className={`absolute left-4 top-4 flex items-center gap-3 rounded-sm px-2.5 py-1.5 font-mono text-[8.5px] uppercase tracking-[0.22em] ${gold ? "bg-gold/85 text-white" : "bg-cream/85 text-gold-deep"}`}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <span className={`h-px w-5 ${gold ? "bg-white/60" : "bg-gold/60"}`} />
                    <span>{entry.coordinates || entry.location.split(",").pop()?.trim()}</span>
                  </div>
                  <MoreDoodle kind={mark} tone="light" className="absolute right-3 top-3 w-[64px] opacity-80" />
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <div className="text-[9px] uppercase tracking-[0.26em] text-gold-light">{entry.location}</div>
                    <div className="mt-2 font-serif text-[clamp(26px,3vw,36px)] font-light leading-[1.02] text-white">{entry.name}</div>
                    {entry.highlights?.[0] && (
                      <div className="mt-2 text-[11px] font-light leading-[1.5] text-white/65">{entry.highlights[0]}</div>
                    )}
                    <div className="mt-3 flex items-center gap-3 text-[9px] uppercase tracking-[0.22em] text-white/80">
                      <span className="border-b border-white/50 pb-0.5 transition-colors group-hover:border-gold-light group-hover:text-gold-light">
                        {t("wellness.openRetreat")}
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
            {/* the last stone: the whole route, and the door to ask */}
            <a
              data-stone
              href="/wellness"
              onClick={(e) => { if (!onMore) return; e.preventDefault(); onMore(); }}
              style={{ ["--lift" as string]: `${lift(entries.length)}px` }}
              className="stone group relative h-[50svh] min-h-[330px] w-[72vw] shrink-0 snap-center overflow-hidden rounded-[22px] border border-gold/40 bg-ink transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-light sm:h-[54svh] sm:min-h-[360px] sm:w-[46vw] lg:h-[46svh] lg:min-h-[300px] lg:w-[24vw] lg:min-w-[280px] lg:max-w-[340px]"
            >
              <div className="absolute inset-0 grid place-items-center">
                <MoreDoodle kind="wellness" className="w-[70%] max-w-[260px]" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <div className="text-[9px] uppercase tracking-[0.26em] text-gold-light">{t("more.eyebrow")}</div>
                <div className="mt-2 font-serif text-[clamp(26px,3vw,36px)] font-light leading-[1.02] text-white">{t("more.label")}</div>
                <div className="mt-3 text-[9px] uppercase tracking-[0.22em] text-white/80">
                  <span className="border-b border-white/50 pb-0.5 transition-colors group-hover:border-gold-light group-hover:text-gold-light">{t("more.cta")}</span>
                </div>
              </div>
            </a>
          </div>
        </div>
        <div className="px-5 sm:px-10 lg:px-16">
          <a href="/wellness" className="inline-block border-b border-gold-light/50 pb-1.5 text-[9px] uppercase tracking-[0.26em] text-gold-light transition-colors hover:border-white hover:text-white">
            {t("wellness.allRetreats")}
          </a>
        </div>
      </div>
    </section>
  );
}
