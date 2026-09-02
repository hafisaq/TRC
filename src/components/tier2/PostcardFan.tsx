import { useEffect, useRef, useState } from "react";
import type { Region } from "../../data/regions/types";
import { posterUrl, videoUrl, hasFilm, imgSized, lqipVar } from "../../lib/media";
import { useNearViewport } from "../../lib/useNearViewport";
import { isAr, t } from "../../lib/i18n";

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const countWord = (n: number) => WORDS[n] ?? String(n);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// Coast & Islands' selector — the third idiom. Asia glides cards in a row,
// Mountain & Ice stacks a dark altimeter board; here the countries are a
// hand of oversized POSTCARDS fanned on a sun-bleached table. Like the
// Asia strip, the section PINS and vertical scroll does the work: each
// notch of scroll deals the next postcard to the front. Clicking the
// front card mails you to that country.
export default function PostcardFan({ region }: { region: Region }) {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const { ref: nearRef, near } = useNearViewport<HTMLDivElement>();

  const n = region.stops.length;

  // scroll drives the deal: progress through the pinned section maps to
  // the active card index (same pin pattern as the Asia country strip —
  // the fan holds still while the scroll shuffles it)
  useEffect(() => {
    if (!n) return;
    const readTarget = () => {
      const section = sectionRef.current;
      if (!section || window.innerWidth < 1024) return;
      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = clamp(-rect.top / scrollable, 0, 1);
      // 0..1 → 0..n-1, with the ends held a beat longer
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

  // the front card's film wakes when it comes forward
  useEffect(() => {
    const stop = region.stops[active];
    if (!stop) return;
    const el = document.querySelector<HTMLVideoElement>(`#postcard-${stop.id} video`);
    if (el) {
      const src = el.querySelector<HTMLSourceElement>("source[data-src]");
      if (src && !src.src) {
        src.src = src.dataset.src || "";
        el.load();
      }
      const p = el.play();
      if (p) p.catch(() => undefined);
    }
    // rest the others
    region.stops.forEach((s, i) => {
      if (i === active) return;
      document.querySelector<HTMLVideoElement>(`#postcard-${s.id} video`)?.pause();
    });
  }, [active, region.stops, near]);

  if (!n) return null;

  const gidOf = (country: string) =>
    region.catalog.find((g) => g.label.toLowerCase() === country.toLowerCase())?.id;

  // tabs jump the PAGE to the scroll offset that deals that card
  const jumpTo = (i: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const scrollable = section.offsetHeight - window.innerHeight;
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (i / (n - 1)) * scrollable, behavior: "smooth" });
  };

  return (
    <section ref={sectionRef} id="tier2-coast-countries" className="relative bg-cream-deep text-navy lg:h-[280svh]">
      {/* flight-path hold markers: the plane holds a straight lane at the
          right edge while the scroll deals the postcards */}
      <span id="tier2-coast-hold-in" aria-hidden="true" className="absolute right-[6vw] top-[12%]">
        <span data-flight-node className="block h-px w-px" />
      </span>
      <span id="tier2-coast-hold-out" aria-hidden="true" className="absolute right-[6vw] top-[88%]">
        <span data-flight-node className="block h-px w-px" />
      </span>
      <div ref={nearRef} className="relative flex flex-col overflow-hidden pt-14 pb-[calc(env(safe-area-inset-bottom)+64px)] sm:pt-16 lg:sticky lg:top-0 lg:h-[100svh] lg:justify-between lg:pb-4 lg:pt-[calc(env(safe-area-inset-top)+96px)]">
        {/* sun-bleached wash + a faint horizon line through the middle */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#f7f4ee_0%,#eef0ec_55%,#e8ecea_100%)]" />
          <div className="absolute inset-x-0 top-[54%] h-px bg-[linear-gradient(90deg,transparent,rgba(22,36,60,.14),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_80%_0%,rgba(200,162,76,.10),transparent_60%)]" />
        </div>

        <div className="relative px-5 sm:px-10 lg:px-16">
          <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-deep">{t("fan.kicker")}</div>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <h3 className="font-serif text-[clamp(28px,4.6vw,52px)] font-light leading-[1.02] text-navy">
              {isAr() ? `${n} دول، ليتك كنت هنا` : <>{countWord(n)} countries,<br className="sm:hidden" /> wish you were here</>}
            </h3>
            <div className="hidden items-center gap-6 lg:flex">
              {region.stops.map((stop, i) => (
                <button
                  key={stop.id}
                  type="button"
                  onClick={() => jumpTo(i)}
                  className={`border-b pb-0.5 text-[9.5px] uppercase tracking-[0.22em] transition-colors duration-300 ${
                    active === i ? "border-gold text-gold-deep" : "border-transparent text-navy/45 hover:text-navy/70"
                  }`}
                >
                  {stop.country}
                </button>
              ))}
              <span className="font-mono text-[8.5px] uppercase tracking-[0.24em] text-navy/45">Scroll ↓</span>
            </div>
          </div>
        </div>

        {/* THE FAN — desktop: stacked, rotated postcards, dealt by scroll */}
        <div className="relative hidden min-h-0 flex-1 items-center justify-center lg:flex">
          {region.stops.map((stop, i) => {
            const gid = gidOf(stop.country);
            const off = i - active;
            const isActive = off === 0;
            const rot = isActive ? 0 : off * 4.5;
            const tx = isActive ? 0 : off * 120;
            const ty = isActive ? 0 : Math.abs(off) * 22;
            const scale = isActive ? 1 : 1 - Math.abs(off) * 0.06;
            return (
              <a
                key={stop.id}
                href={isActive && gid ? `/${region.slug}/${gid}` : undefined}
                onClick={(e) => {
                  if (!isActive) {
                    e.preventDefault();
                    jumpTo(i);
                  }
                }}
                id={`postcard-${stop.id}`}
                aria-label={`${stop.country} — ${stop.eyebrow}`}
                className={`absolute block w-[min(44vw,640px)] cursor-pointer border-[10px] border-white bg-white shadow-[0_30px_80px_rgba(22,36,60,.25)] transition-all duration-[650ms] ease-[cubic-bezier(.22,.8,.3,1)] ${
                  isActive ? "z-30" : "z-10 hover:brightness-105"
                }`}
                style={{ transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${scale})` }}
              >
                <div className="media-shell relative aspect-[16/10] overflow-hidden bg-ink" style={stop.slug ? lqipVar(stop.slug) : undefined}>
                  {!near ? null : stop.slug && hasFilm(stop.slug) ? (
                    <video muted loop playsInline preload="none" poster={near ? posterUrl(stop.slug, 1200) : undefined} className="absolute inset-0 h-full w-full object-cover">
                      <source data-src={videoUrl(stop.slug)} type="video/mp4" />
                    </video>
                  ) : stop.slug ? (
                    <img src={posterUrl(stop.slug, 1200)} alt="" loading="lazy" decoding="async" onLoad={(e) => e.currentTarget.classList.add("media-ready")} className="media-fade absolute inset-0 h-full w-full object-cover" />
                  ) : null}
                  <div className={`absolute inset-0 bg-ink/35 transition-opacity duration-500 ${isActive ? "opacity-0" : "opacity-100"}`} />
                  {/* postmark — coords in a dashed ring, like a cancelled stamp */}
                  <div className="absolute right-4 top-4 grid h-20 w-20 rotate-[8deg] place-items-center rounded-full border border-dashed border-white/70 bg-ink/20 text-center backdrop-blur-[2px]">
                    <div className="font-mono text-[7px] uppercase leading-[1.6] tracking-[0.14em] text-white/90">
                      TRC<br />{stop.coords}
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline justify-between gap-6 px-4 pb-2 pt-3">
                  <div>
                    <div className="text-[8.5px] uppercase tracking-[0.26em] text-gold-deep">{stop.eyebrow}</div>
                    <div className="mt-0.5 font-serif text-[30px] font-light leading-[1.05] text-navy">{stop.country}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-navy/45">{stop.season}</div>
                    <div className={`mt-1 border-b pb-0.5 text-[9px] uppercase tracking-[0.22em] transition-colors duration-300 ${isActive ? "border-gold text-gold-deep" : "border-transparent text-navy/0"}`}>
                      {t("strip.explore", { country: stop.country })}
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* mobile / tablet: the postcards in a snap row (same idiom as the
            Asia strip's mobile behavior) */}
        <div className="relative mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 no-scrollbar sm:px-10 lg:hidden">
          {region.stops.map((stop) => {
            const gid = gidOf(stop.country);
            return (
              <a
                key={stop.id}
                href={gid ? `/${region.slug}/${gid}` : "#tier2-enquire"}
                className="block w-[80vw] shrink-0 snap-center border-8 border-white bg-white shadow-[0_18px_50px_rgba(22,36,60,.2)] sm:w-[54vw]"
              >
                <div className="media-shell relative aspect-[16/10] overflow-hidden bg-ink" style={stop.slug ? lqipVar(stop.slug) : undefined}>
                  {near && stop.slug && (
                    <img src={imgSized(posterUrl(stop.slug, 900), 900)} alt="" loading="lazy" decoding="async" onLoad={(e) => e.currentTarget.classList.add("media-ready")} className="media-fade absolute inset-0 h-full w-full object-cover" />
                  )}
                  <div className="absolute right-3 top-3 grid h-14 w-14 rotate-[8deg] place-items-center rounded-full border border-dashed border-white/70 bg-ink/20 text-center">
                    <div className="font-mono text-[6px] uppercase leading-[1.5] tracking-[0.12em] text-white/90">TRC<br />{stop.coords}</div>
                  </div>
                </div>
                <div className="px-3 pb-2 pt-2.5">
                  <div className="text-[8px] uppercase tracking-[0.24em] text-gold-deep">{stop.eyebrow}</div>
                  <div className="mt-0.5 font-serif text-[24px] font-light leading-[1.05] text-navy">{stop.country}</div>
                  <div className="mt-1 font-mono text-[7.5px] uppercase tracking-[0.16em] text-navy/45">{stop.season}</div>
                </div>
              </a>
            );
          })}
        </div>

        <div className="relative hidden justify-center pb-8 lg:flex">
          <div className="font-mono text-[8px] uppercase tracking-[0.26em] text-navy/40">
            {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")} · {t("fan.hint")}
          </div>
        </div>
      </div>
    </section>
  );
}
