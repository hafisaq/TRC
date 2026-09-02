import { useEffect, useRef, useState } from "react";
import type { Region } from "../../data/regions/types";

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const countWord = (n: number) => WORDS[n] ?? String(n);
import { posterUrl, videoUrl, hasFilm, imgSized, lqipVar, lqipStyle } from "../../lib/media";
import { useNearViewport } from "../../lib/useNearViewport";
import { isAr, t } from "../../lib/i18n";

// The Mountain & Ice country selector — deliberately NOT the Asia strip.
// Where Asia glides bright cards sideways across cream, this is a dark
// altimeter board: countries stack as huge serif rows beside a ticked
// altitude rail, and pointing at a row swaps the footage behind the whole
// section. Vertical, typographic, lit from within — read by headlamp.
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export default function DescentBoard({ region }: { region: Region }) {
  const [active, setActive] = useState(0);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const sectionRef = useRef<HTMLElement | null>(null);
  const { ref: nearRef, near } = useNearViewport<HTMLDivElement>();

  const n = region.stops.length;

  // scroll drives the descent: the section pins and vertical scroll walks
  // the rows top to bottom (same pattern as the postcard fan and caravan)
  useEffect(() => {
    if (!n) return;
    const readTarget = () => {
      const section = sectionRef.current;
      if (!section || window.innerWidth < 1024) return;
      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = clamp(-rect.top / scrollable, 0, 1);
      setActive(clamp(Math.round(progress * (n - 1)), 0, n - 1));
    };
    readTarget();
    window.addEventListener("scroll", readTarget, { passive: true });
    window.addEventListener("resize", readTarget);
    return () => {
      window.removeEventListener("scroll", readTarget);
      window.removeEventListener("resize", readTarget);
    };
  }, [n]);

  // active row's film wakes; the rest pause
  useEffect(() => {
    videoRefs.current.forEach((v, j) => {
      if (!v) return;
      if (j === active) {
        const source = v.querySelector<HTMLSourceElement>("source[data-src]");
        if (source && !source.src) {
          source.src = source.dataset.src || "";
          v.load();
        }
        const tryPlay = () => { const p = v.play(); if (p) p.catch(() => undefined); };
        tryPlay();
        v.addEventListener("canplay", tryPlay, { once: true });
      } else {
        v.pause();
      }
    });
  }, [active, near]);

  if (!n) return null;

  return (
    <section ref={sectionRef} id="tier2-alpine-countries" className="relative bg-ink text-white lg:h-[300svh]">
      {/* flight-path hold markers: a straight lane down the board's right
          edge, so the plane tracks past the rows instead of drifting
          through them (same pattern as the Asia strip) */}
      <span id="tier2-alpine-hold-in" aria-hidden="true" className="absolute right-[6vw] top-[10%]">
        <span data-flight-node className="block h-px w-px" />
      </span>
      <span id="tier2-alpine-hold-out" aria-hidden="true" className="absolute right-[6vw] top-[90%]">
        <span data-flight-node className="block h-px w-px" />
      </span>
      <div ref={nearRef} className="relative overflow-hidden lg:sticky lg:top-0 lg:h-[100svh]">
      {/* footage layer — one media element per country, crossfaded by row */}
      <div aria-hidden="true" className="absolute inset-0">
        {region.stops.map((stop, i) => (
          <div
            key={stop.id}
            className="absolute inset-0 transition-opacity duration-[900ms] ease-out"
            style={{ opacity: active === i ? 1 : 0, ...(stop.slug ? lqipStyle(stop.slug) : undefined) }}
          >
            {!near ? null : stop.slug && hasFilm(stop.slug) ? (
              <>
              <img src={posterUrl(stop.slug, 1600)} alt="" aria-hidden="true" decoding="async" onLoad={(e) => e.currentTarget.classList.add("media-ready")} className="media-fade absolute inset-0 h-full w-full object-cover" />
              <video
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                muted
                loop
                playsInline
                preload="none"
                poster={posterUrl(stop.slug, 1600)}
                className="absolute inset-0 z-[1] h-full w-full object-cover"
              >
                <source data-src={videoUrl(stop.slug)} type="video/mp4" />
              </video>
              </>
            ) : stop.slug ? (
              <img
                src={posterUrl(stop.slug, 1600)}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
          </div>
        ))}
        {/* legibility veil — heavier on the text side, open on the right */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,13,12,.92)_0%,rgba(14,13,12,.78)_44%,rgba(14,13,12,.35)_75%,rgba(14,13,12,.55)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,13,12,.85),transparent_18%,transparent_82%,rgba(14,13,12,.9))]" />
      </div>

      <div className="relative mx-auto grid max-w-[1380px] gap-10 px-5 py-20 sm:px-10 sm:py-24 lg:h-full lg:grid-cols-[auto_1fr] lg:gap-16 lg:px-16 lg:pb-8 lg:pt-[calc(env(safe-area-inset-top)+96px)]">
        {/* the altitude rail — ticks, a running line, and the section head
            rotated into it on large screens */}
        <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-4 lg:pt-2">
          <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-light/80 [writing-mode:vertical-rl]">
            {t("board.choose")}
          </div>
          <div className="relative w-px flex-1 bg-gold/25">
            {region.stops.map((_, i) => (
              <span
                key={i}
                className={`absolute left-1/2 h-px -translate-x-1/2 transition-all duration-500 ${
                  active === i ? "w-5 bg-gold shadow-[0_0_8px_rgba(200,162,76,.7)]" : "w-2.5 bg-gold/40"
                }`}
                style={{ top: `${((i + 0.5) / region.stops.length) * 100}%` }}
              />
            ))}
          </div>
          <div className="font-mono text-[8px] tracking-[0.2em] text-white/35 [writing-mode:vertical-rl]">
            {region.stops[active]?.coords}
          </div>
        </div>

        <div>
          <div className="mb-10 sm:mb-12 lg:mb-[clamp(12px,3svh,40px)]">
            <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-light lg:hidden">{t("board.choose")}</div>
            <h3 className="mt-2 font-serif text-[clamp(28px,4.6vw,52px)] font-light leading-[1.02] text-white lg:mt-0">
              {isAr()
                ? `${region.stops.length} دول، من الألب إلى الجليد`
                : <>{countWord(region.stops.length)} countries,<br className="sm:hidden" /> from the Alps to the ice</>}
            </h3>
          </div>

          <div className="flex flex-col">
            {region.stops.map((stop, i) => {
              const gid = region.catalog.find((g) => g.label.toLowerCase() === stop.country.toLowerCase())?.id;
              const isActive = active === i;
              return (
                <a
                  key={stop.id}
                  href={gid ? `/${region.slug}/${gid}` : "#tier2-enquire"}
                  className={`group grid grid-cols-[auto_1fr] items-baseline gap-x-5 border-t border-white/[0.09] py-6 transition-colors duration-500 last:border-b sm:grid-cols-[auto_1fr_auto] sm:gap-x-8 sm:py-7 lg:py-[clamp(10px,2.4svh,26px)] ${
                    isActive ? "" : "opacity-100"
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] transition-colors duration-500 ${
                      isActive ? "text-gold" : "text-white/30"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-[8.5px] uppercase tracking-[0.28em] transition-colors duration-500 ${
                        isActive ? "text-gold-light" : "text-white/35"
                      }`}
                    >
                      {stop.eyebrow}
                    </span>
                    <span
                      className={`mt-1 block font-serif text-[clamp(30px,5.2vw,58px)] font-light leading-[1.02] lg:text-[clamp(26px,min(4.6vw,6.4svh),56px)] transition-all duration-500 ${
                        isActive ? "translate-x-1.5 text-white" : "text-white/45"
                      }`}
                    >
                      {stop.country}
                    </span>
                    {/* mobile: inline still so the rows aren't blind */}
                    {stop.slug && (
                      <span className="media-shell relative mt-3 block h-24 w-full overflow-hidden rounded-sm border border-white/10 sm:hidden" style={lqipVar(stop.slug)}>
                        <img src={imgSized(posterUrl(stop.slug, 800), 800)} alt="" loading="lazy" decoding="async" onLoad={(e) => e.currentTarget.classList.add("media-ready")} className="media-fade h-full w-full object-cover" />
                      </span>
                    )}
                  </span>
                  <span className="hidden text-right sm:block">
                    <span className={`block font-mono text-[8.5px] tracking-[0.2em] transition-colors duration-500 ${isActive ? "text-gold-light" : "text-white/30"}`}>
                      {stop.coords}
                    </span>
                    <span className="mt-1.5 block text-[8.5px] uppercase tracking-[0.2em] text-white/35">{stop.season}</span>
                    <span
                      className={`mt-2 inline-block border-b pb-0.5 text-[9px] uppercase tracking-[0.22em] transition-all duration-500 ${
                        isActive ? "border-gold-light text-gold-light" : "border-transparent text-white/0"
                      }`}
                    >
                      {t("strip.explore", { country: stop.country })}
                    </span>
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
