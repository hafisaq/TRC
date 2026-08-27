import { useCallback, useEffect, useRef, useState } from "react";
import type { Region } from "../../data/regions/types";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// The country selector inside the main page's Asia moment: a light, gold-on-
// cream band (the brand's white-bg/gold-text side) where scrolling glides a
// row of country cards horizontally past the viewport. Hovering a card wakes
// its footage; clicking flies you to that country's own page.
export default function CountryStrip({ region }: { region: Region }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [maxShift, setMaxShift] = useState(0);

  const updateFromScroll = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
    setProgress((current) => {
      const next = clamp(-rect.top / scrollable, 0, 1);
      return Math.abs(current - next) > 0.002 ? next : current;
    });
  }, []);

  // How far the row must glide for the last card to fully enter view.
  // offsetWidth (layout truth, immune to both transforms and the
  // scrollWidth-collapses-under-overflow-visible quirk) — not scrollWidth.
  const measure = useCallback(() => {
    const inner = innerRef.current;
    const outer = rowRef.current;
    if (!inner || !outer || window.innerWidth < 1024) {
      setMaxShift(0);
      return;
    }
    const kids = Array.from(inner.children) as HTMLElement[];
    if (!kids.length) return;
    const gap = parseFloat(getComputedStyle(inner).columnGap || "0") || 0;
    const contentW = kids.reduce((acc, k) => acc + k.offsetWidth, 0) + gap * (kids.length - 1);
    const cs = getComputedStyle(outer);
    const avail = outer.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    setMaxShift(Math.max(0, contentW - avail));
  }, []);

  useEffect(() => {
    updateFromScroll();
    measure();
    window.addEventListener("scroll", updateFromScroll, { passive: true });
    window.addEventListener("resize", updateFromScroll);
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    return () => {
      window.removeEventListener("scroll", updateFromScroll);
      window.removeEventListener("resize", updateFromScroll);
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
    };
  }, [updateFromScroll, measure]);

  const shift = maxShift * progress;

  const wakeVideo = (card: HTMLElement, play: boolean) => {
    const video = card.querySelector<HTMLVideoElement>("video");
    if (!video) return;
    const source = video.querySelector<HTMLSourceElement>("source[data-src]");
    if (source && !source.src) {
      source.src = source.dataset.src || "";
      video.load();
    }
    if (play) {
      const p = video.play();
      if (p) p.catch(() => undefined);
    } else {
      video.pause();
    }
  };

  return (
    <section ref={sectionRef} id="tier2-asia-countries" className="relative bg-cream-deep text-navy lg:h-[280svh]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(200,162,76,.14),transparent_36%),linear-gradient(180deg,rgba(250,248,244,.9),rgba(243,239,231,.98))]" />
      <div className="relative flex flex-col justify-center gap-7 overflow-hidden pt-14 pb-[calc(env(safe-area-inset-bottom)+104px)] sm:gap-8 sm:py-16 lg:sticky lg:top-0 lg:h-[100svh] lg:py-0">
        <div className="px-5 sm:px-10 lg:px-16">
          <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-deep">Choose your route</div>
          <div className="mt-2 flex items-end justify-between gap-6">
            <h3 className="font-serif text-[clamp(28px,4.6vw,52px)] font-light leading-[1.02] text-navy">
              Four countries,<br className="sm:hidden" /> four ways in
            </h3>
            <div className="hidden h-px flex-1 bg-gold/25 lg:block">
              <div className="h-full bg-gold shadow-[0_0_10px_rgba(200,162,76,.5)] transition-[width] duration-150 ease-out" style={{ width: `${progress * 100}%` }} />
            </div>
            <div className="hidden font-mono text-[8.5px] uppercase tracking-[0.24em] text-navy/45 lg:block">Scroll →</div>
          </div>
        </div>

        <div
          ref={rowRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-5 no-scrollbar sm:gap-6 sm:px-10 lg:snap-none lg:overflow-visible lg:px-16"
        >
          <div
            ref={innerRef}
            className="flex gap-4 sm:gap-6 lg:will-change-transform"
            style={{ transform: maxShift > 0 ? `translateX(${-shift}px)` : undefined, transition: "transform 120ms linear" }}
          >
            {region.stops.map((stop, i) => {
              const gid = region.catalog.find((g) => g.label.toLowerCase() === stop.country.toLowerCase())?.id;
              const goldCard = i % 2 === 0;
              return (
                <a
                  key={stop.id}
                  href={gid ? `/${region.slug}/${gid}` : `/${region.slug}`}
                  className={`group relative h-[48svh] min-h-[310px] w-[76vw] shrink-0 snap-center overflow-hidden rounded-sm border transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_28px_60px_rgba(22,36,60,.22)] sm:h-[54svh] sm:min-h-[340px] sm:w-[52vw] lg:w-[34vw] ${
                    goldCard ? "border-gold/50 shadow-[0_16px_44px_rgba(200,162,76,.18)]" : "border-navy/15 shadow-[0_16px_44px_rgba(22,36,60,.12)]"
                  } hover:border-gold`}
                  onMouseEnter={(e) => wakeVideo(e.currentTarget, true)}
                  onMouseLeave={(e) => wakeVideo(e.currentTarget, false)}
                >
                  <video muted loop playsInline preload="none" poster={`/media/poster/${stop.slug}.jpg`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.07]">
                    <source data-src={`/media/video/${stop.slug}.mp4`} type="video/mp4" />
                  </video>
                  {/* lighter than before — just enough for legibility */}
                  <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(14,13,12,.72),rgba(14,13,12,.06)_52%,rgba(14,13,12,.16))] transition-opacity duration-500 group-hover:opacity-75" />
                  <div className={`absolute left-5 top-5 flex items-center gap-3 rounded-sm px-2.5 py-1.5 font-mono text-[8.5px] uppercase tracking-[0.22em] backdrop-blur-sm ${
                    goldCard ? "bg-gold/85 text-white" : "bg-cream/85 text-gold-deep"
                  }`}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <span className={`h-px w-6 ${goldCard ? "bg-white/60" : "bg-gold/60"}`} />
                    <span>{stop.coords}</span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                    <div className="text-[9px] uppercase tracking-[0.26em] text-gold-light">{stop.eyebrow}</div>
                    <div className="mt-2 font-serif text-[clamp(34px,4.4vw,58px)] font-light leading-[0.98] text-white">{stop.country}</div>
                    <div className="mt-3 flex items-center gap-3 text-[9px] uppercase tracking-[0.22em] text-white/80">
                      <span className="border-b border-white/50 pb-0.5 transition-colors group-hover:border-gold-light group-hover:text-gold-light">
                        Explore {stop.country} →
                      </span>
                      <span className="font-mono text-[8px] text-white/50">{stop.season}</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
