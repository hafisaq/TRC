import { useState } from "react";
import type { Region } from "../../data/regions/types";
import { posterUrl, videoUrl, hasFilm, imgSized } from "../../lib/media";

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const countWord = (n: number) => WORDS[n] ?? String(n);

// Coast & Islands' selector — the third idiom. Asia glides cards in a row,
// Mountain & Ice stacks a dark altimeter board; here the countries are a
// hand of oversized POSTCARDS fanned on a sun-bleached table. The active
// card sits upright and plays its footage; the others lean behind it at
// lazy angles. Clicking a leaning card brings it forward; clicking the
// front card mails you to that country.
export default function PostcardFan({ region }: { region: Region }) {
  const [active, setActive] = useState(0);

  if (!region.stops.length) return null;

  const gidOf = (country: string) =>
    region.catalog.find((g) => g.label.toLowerCase() === country.toLowerCase())?.id;

  return (
    <section id="tier2-coast-countries" className="relative overflow-hidden bg-cream-deep text-navy">
      {/* sun-bleached wash + a faint horizon line through the middle */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f7f4ee_0%,#eef0ec_55%,#e8ecea_100%)]" />
        <div className="absolute inset-x-0 top-[54%] h-px bg-[linear-gradient(90deg,transparent,rgba(22,36,60,.14),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_80%_0%,rgba(200,162,76,.10),transparent_60%)]" />
      </div>

      <div className="relative px-5 pt-16 sm:px-10 sm:pt-20 lg:px-16">
        <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-deep">Postcards from the coast</div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <h3 className="font-serif text-[clamp(28px,4.6vw,52px)] font-light leading-[1.02] text-navy">
            {countWord(region.stops.length)} countries,<br className="sm:hidden" /> wish you were here
          </h3>
          {/* the address book: quick country tabs, doubling as fan controls */}
          <div className="hidden flex-wrap gap-x-6 gap-y-2 lg:flex">
            {region.stops.map((stop, i) => (
              <button
                key={stop.id}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className={`border-b pb-0.5 text-[9.5px] uppercase tracking-[0.22em] transition-colors duration-300 ${
                  active === i ? "border-gold text-gold-deep" : "border-transparent text-navy/45 hover:text-navy/70"
                }`}
              >
                {stop.country}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* THE FAN — desktop: stacked, rotated postcards */}
      <div className="relative hidden h-[72svh] min-h-[520px] items-center justify-center lg:flex">
        {region.stops.map((stop, i) => {
          const gid = gidOf(stop.country);
          const off = i - active;
          const isActive = off === 0;
          // leaning cards fan out to alternating sides behind the front one
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
                  setActive(i);
                }
              }}
              onMouseEnter={() => {
                if (!isActive) return;
                const v = document.querySelector<HTMLVideoElement>(`#postcard-${stop.id} video`);
                if (v) {
                  const src = v.querySelector<HTMLSourceElement>("source[data-src]");
                  if (src && !src.src) {
                    src.src = src.dataset.src || "";
                    v.load();
                  }
                  const p = v.play();
                  if (p) p.catch(() => undefined);
                }
              }}
              id={`postcard-${stop.id}`}
              aria-label={`${stop.country} — ${stop.eyebrow}`}
              className={`absolute block w-[min(46vw,680px)] cursor-pointer border-[10px] border-white bg-white shadow-[0_30px_80px_rgba(22,36,60,.25)] transition-all duration-[650ms] ease-[cubic-bezier(.22,.8,.3,1)] ${
                isActive ? "z-30" : "z-10 hover:brightness-105"
              }`}
              style={{ transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${scale})` }}
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-ink">
                {stop.slug && hasFilm(stop.slug) ? (
                  <video muted loop playsInline preload="none" poster={posterUrl(stop.slug, 1200)} className="absolute inset-0 h-full w-full object-cover">
                    <source data-src={videoUrl(stop.slug)} type="video/mp4" />
                  </video>
                ) : stop.slug ? (
                  <img src={posterUrl(stop.slug, 1200)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                ) : null}
                <div className={`absolute inset-0 bg-ink/35 transition-opacity duration-500 ${isActive ? "opacity-0" : "opacity-100"}`} />
                {/* postmark — coords in a dashed ring, like a cancelled stamp */}
                <div className="absolute right-4 top-4 grid h-20 w-20 rotate-[8deg] place-items-center rounded-full border border-dashed border-white/70 bg-ink/20 text-center backdrop-blur-[2px]">
                  <div className="font-mono text-[7px] uppercase leading-[1.6] tracking-[0.14em] text-white/90">
                    TRC<br />{stop.coords}
                  </div>
                </div>
              </div>
              {/* the written side, in miniature: caption strip */}
              <div className="flex items-baseline justify-between gap-6 px-4 pb-2 pt-3">
                <div>
                  <div className="text-[8.5px] uppercase tracking-[0.26em] text-gold-deep">{stop.eyebrow}</div>
                  <div className="mt-0.5 font-serif text-[30px] font-light leading-[1.05] text-navy">{stop.country}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-navy/45">{stop.season}</div>
                  <div className={`mt-1 border-b pb-0.5 text-[9px] uppercase tracking-[0.22em] transition-colors duration-300 ${isActive ? "border-gold text-gold-deep" : "border-transparent text-navy/0"}`}>
                    Explore {stop.country} →
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* mobile / tablet: the postcards laid out in a snap row */}
      <div className="relative mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-16 no-scrollbar sm:px-10 lg:hidden">
        {region.stops.map((stop) => {
          const gid = gidOf(stop.country);
          return (
            <a
              key={stop.id}
              href={gid ? `/${region.slug}/${gid}` : "#tier2-enquire"}
              className="block w-[80vw] shrink-0 snap-center border-8 border-white bg-white shadow-[0_18px_50px_rgba(22,36,60,.2)] sm:w-[54vw]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-ink">
                {stop.slug && (
                  <img src={imgSized(posterUrl(stop.slug, 900), 900)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
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

      <div className="relative hidden justify-center pb-14 lg:flex">
        <div className="font-mono text-[8px] uppercase tracking-[0.26em] text-navy/40">
          {String(active + 1).padStart(2, "0")} / {String(region.stops.length).padStart(2, "0")} · click the front card to travel
        </div>
      </div>
    </section>
  );
}
