import { useEffect, useRef, useState } from "react";
import type { Region } from "../../data/regions/types";
import { posterUrl, videoUrl, hasFilm, lqipVar, lqipStyle } from "../../lib/media";
import { useNearViewport } from "../../lib/useNearViewport";
import { isAr, t } from "../../lib/i18n";
import { withMore, isMoreStop, exploreLabel } from "../../lib/moreStop";
import MoreDoodle from "../MoreDoodle";
import { MediaVideo } from "../Media";
import { useIsPinnedLayout, useSnapIndex } from "../../lib/useSnapIndex";

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const countWord = (n: number) => WORDS[n] ?? String(n);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// Open Country's selector — the fourth idiom. Asia glides, the mountains
// stack a dark board, the coast deals postcards; the desert walks a
// CARAVAN ROUTE: a dune ridge silhouetted across the foot of the section,
// waypoints strung along its crest, and the active country's footage
// filling the whole sky above. Scroll walks the caravan from marker to
// marker (pinned, like the others).
export default function CaravanRoute({ region, onMore }: { region: Region; onMore?: () => void }) {
  // every list ends with a trailing "More" item that opens the enquiry
  const stops = withMore(region);
  // when More is the active row, the backdrop keeps the last real country
  const bgActiveOf = (i: number) => (isMoreStop(stops[i]) ? Math.max(0, i - 1) : i);
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const { ref: nearRef, near } = useNearViewport<HTMLDivElement>();

  const n = stops.length;
  // touch layouts: the swipe row picks the active country (the centred
  // card), so the sky behind follows the swipe
  const rowRef = useRef<HTMLDivElement | null>(null);
  const pinned = useIsPinnedLayout();
  const snap = useSnapIndex(rowRef, n);
  useEffect(() => {
    if (!pinned) setActive(clamp(snap, 0, Math.max(0, n - 1)));
  }, [pinned, snap, n]);

  useEffect(() => {
    if (!n) return;
    const readTarget = () => {
      const section = sectionRef.current;
      if (!section || window.innerWidth < 1024) return;
      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = clamp(-rect.top / scrollable, 0, 1);
      // equal shares of the scroll, so the last waypoint (More) holds the
      // screen as long as any country instead of flashing past at the end
      setActive(clamp(Math.floor(progress * n), 0, n - 1));
    };
    readTarget();
    window.addEventListener("scroll", readTarget, { passive: true });
    window.addEventListener("resize", readTarget);
    return () => {
      window.removeEventListener("scroll", readTarget);
      window.removeEventListener("resize", readTarget);
    };
  }, [n]);

  if (!n) return null;

  const gidOf = (country: string) =>
    region.catalog.find((g) => g.label.toLowerCase() === country.toLowerCase())?.id;

  const jumpTo = (i: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const scrollable = section.offsetHeight - window.innerHeight;
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + ((i + 0.5) / n) * scrollable, behavior: "smooth" });
  };

  // waypoints strung along the dune crest (x%, y% within the ridge band)
  // left to right in route order, so the trailing More is the last marker
  // on the ridge; heights follow the crest's rise and fall
  const CREST_Y = [58, 34, 52, 28, 46, 32, 50, 30, 44, 34];
  const crestAt = (i: number): [number, number] => [n > 1 ? 10 + (i * 82) / (n - 1) : 50, CREST_Y[i % CREST_Y.length]];
  const activeStop = stops[active];
  const activeGid = activeStop ? gidOf(activeStop.country) : undefined;

  return (
    <section ref={sectionRef} id="tier2-desert-countries" className="relative bg-ink text-white lg:h-[280svh]">
      {/* flight-path lane */}
      <span id="tier2-desert-hold-in" aria-hidden="true" className="absolute right-[6vw] top-[12%]">
        <span data-flight-node className="block h-px w-px" />
      </span>
      <span id="tier2-desert-hold-out" aria-hidden="true" className="absolute right-[6vw] top-[88%]">
        <span data-flight-node className="block h-px w-px" />
      </span>

      <div ref={nearRef} className="relative flex flex-col overflow-hidden pt-14 pb-[calc(env(safe-area-inset-bottom)+64px)] sm:pt-16 lg:sticky lg:top-0 lg:h-[100svh] lg:justify-between lg:pb-0 lg:pt-[calc(env(safe-area-inset-top)+96px)]">
        {/* THE SKY — active country's footage, crossfaded */}
        <div aria-hidden="true" className="absolute inset-0">
          {stops.map((stop, i) => (
            <div
              key={stop.id}
              id={`caravan-sky-${stop.id}`}
              className="absolute inset-0 transition-opacity duration-[900ms] ease-out"
              style={{ opacity: bgActiveOf(active) === i ? 1 : 0, ...(stop.slug ? lqipStyle(stop.slug) : undefined) }}
            >
              {/* on touch layouts the centred CARD plays the film; the sky
                  only crossfades its still, so one film decodes at a time */}
              {near && Math.abs(active - i) <= 1 && stop.slug && <MediaVideo
                src={pinned && hasFilm(stop.slug) ? videoUrl(stop.slug) : undefined}
                poster={posterUrl(stop.slug)} active={active === i} />}
            </div>
          ))}
          {/* dusk veil for legibility */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,13,12,.78)_0%,rgba(14,13,12,.25)_38%,rgba(14,13,12,.15)_60%,rgba(14,13,12,.86)_100%)]" />
          {/* More owns the sky: the last country's film dims away and the
              souq doodle sketches itself across the right of the screen */}
          <div className={`absolute inset-0 hidden bg-ink/85 transition-opacity duration-700 lg:block ${isMoreStop(activeStop) ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <MoreDoodle kind="desert" play={isMoreStop(activeStop)} className="absolute right-[8vw] top-[42%] w-[min(44vw,720px)] -translate-y-1/2" />
          </div>
        </div>

        <div className="relative px-5 sm:px-10 lg:px-16">
          <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-light">{t("caravan.kicker")}</div>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
            <h3 className="font-serif text-[clamp(28px,4.6vw,52px)] font-light leading-[1.02] text-white">
              {region.title}
            </h3>
            <span className="hidden font-mono text-[8.5px] uppercase tracking-[0.24em] text-white/50 lg:block">{t("hint.scrollDown")}</span>
          </div>
        </div>

        {/* the active country's plate — name, copy, and the way in */}
        <div className="relative mt-8 max-w-[560px] px-5 sm:px-10 lg:mt-0 lg:px-16">
          {activeStop && (
            <div key={activeStop.id} className="hidden lg:block">
              <div className="font-mono text-[8.5px] uppercase tracking-[0.26em] text-gold-light">
                {String(active + 1).padStart(2, "0")} · {activeStop.eyebrow} · {activeStop.coords}
              </div>
              <a
                href={activeGid ? `/${region.slug}/${activeGid}` : "#tier2-enquire"}
                className="group mt-2 block"
              >
                <span className="font-serif text-[clamp(44px,6vw,84px)] font-light leading-[0.98] text-white transition-colors duration-300 group-hover:text-gold-light">
                  {activeStop.country}
                </span>
              </a>
              <p className="mt-4 text-[13.5px] font-light leading-[1.8] text-white/75">{activeStop.copy}</p>
              <div className="mt-4 flex items-center gap-4">
                <a
                  href={activeGid ? `/${region.slug}/${activeGid}` : "#tier2-enquire"}
                  onClick={(e) => { if (isMoreStop(activeStop)) { e.preventDefault(); onMore?.(); } }}
                  className="border-b border-gold-light/60 pb-0.5 text-[9.5px] uppercase tracking-[0.24em] text-gold-light transition-colors hover:border-gold-light hover:text-white"
                >
                  {exploreLabel(activeStop)}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* THE DUNES — layered ridges with the waypoints on the crest */}
        <div className="relative hidden h-[26svh] min-h-[170px] lg:block">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,120 C120,70 260,150 420,110 C580,72 700,150 830,105 C900,82 960,95 1000,80 L1000,200 L0,200 Z" fill="rgba(30,26,20,.92)" />
            <path d="M0,160 C180,120 340,180 520,150 C700,122 840,175 1000,140 L1000,200 L0,200 Z" fill="rgba(14,13,12,.97)" />
          </svg>
          {/* waypoints along the crest */}
          <div className="absolute inset-0">
            {stops.map((stop, i) => {
              const [x, y] = crestAt(i);
              const isActive = i === active;
              return (
                <button
                  key={stop.id}
                  type="button"
                  onClick={() => jumpTo(i)}
                  className="group absolute -translate-x-1/2 -translate-y-1/2 text-center"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <span
                    className={`mx-auto block rotate-45 border transition-all duration-500 ${
                      isActive
                        ? "h-3 w-3 border-gold bg-gold shadow-[0_0_14px_rgba(200,162,76,.8)]"
                        : "h-2 w-2 border-gold/50 bg-transparent group-hover:bg-gold/40"
                    }`}
                  />
                  <span
                    className={`mt-2 block text-[9px] uppercase tracking-[0.22em] transition-colors duration-500 ${
                      isActive ? "text-gold-light" : "text-white/45 group-hover:text-white/75"
                    }`}
                  >
                    {stop.country}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* mobile: waypoint cards in a snap row */}
        <div ref={rowRef} className="relative mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 no-scrollbar sm:px-10 lg:hidden">
          {stops.map((stop, i) => {
            const gid = gidOf(stop.country);
            return (
              <a
                key={stop.id}
                href={gid ? `/${region.slug}/${gid}` : "#tier2-enquire"}
                onClick={(e) => { if (isMoreStop(stop)) { e.preventDefault(); onMore?.(); } }}
                style={stop.slug ? lqipVar(stop.slug) : undefined}
                className="media-shell relative block h-[46svh] min-h-[300px] w-[76vw] shrink-0 snap-center overflow-hidden rounded-sm border border-gold/40 sm:w-[52vw]"
              >
                {near && !pinned && stop.slug && (
                  <MediaVideo src={hasFilm(stop.slug) ? videoUrl(stop.slug) : undefined} poster={posterUrl(stop.slug, 800)}
                    active={i === active} sizes="(min-width: 640px) 52vw, 76vw" />
                )}
                {isMoreStop(stop) && (
                  <div className="absolute inset-0 grid place-items-center">
                    <MoreDoodle kind="desert" className="w-[62%]" />
                  </div>
                )}
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(14,13,12,.78),rgba(14,13,12,.08)_55%)]" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="flex items-center gap-2 text-[8px] uppercase tracking-[0.2em] text-gold-light">
                    <span className="block h-1.5 w-1.5 rotate-45 bg-gold" />
                    {String(i + 1).padStart(2, "0")} · {stop.eyebrow}
                  </div>
                  <div className="mt-1.5 font-serif text-[32px] font-light leading-[1.0] text-white">{stop.country}</div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
