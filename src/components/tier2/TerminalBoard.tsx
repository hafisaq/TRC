import { useEffect, useRef, useState } from "react";
import type { Region } from "../../data/regions/types";
import { posterUrl, videoUrl, hasFilm, imgSized } from "../../lib/media";
import { useNearViewport } from "../../lib/useNearViewport";
import { isAr, t } from "../../lib/i18n";

// The Grand Cities selector — a split-flap departures board. Where the
// mountains got an altimeter and the desert a caravan line, the cities
// read as an airport hall at night: flight rows with gates and a live
// clock, "BOARDING" walking down the board as you scroll, and the active
// city's footage playing in a terminal window beside it.
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const countWord = (n: number) => WORDS[n] ?? String(n);

const FLAP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ ·";

// One destination name as split-flap tiles. On activation the letters
// spin through the alphabet and settle left to right. Arabic renders as
// plain connected text — per-letter tiles would break the script.
function FlapText({ text, active }: { text: string; active: boolean }) {
  const [display, setDisplay] = useState(text);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (isAr()) {
      setDisplay(text);
      return;
    }
    const target = text.toUpperCase();
    if (!active) {
      setDisplay(target);
      return;
    }
    let tick = 0;
    const settleAt = (i: number) => 3 + i * 1.6; // ticks until letter i settles
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      tick += 1;
      let out = "";
      let done = true;
      for (let i = 0; i < target.length; i++) {
        if (target[i] === " ") {
          out += " ";
          continue;
        }
        if (tick >= settleAt(i)) {
          out += target[i];
        } else {
          done = false;
          out += FLAP_CHARS[Math.floor(Math.random() * 26)];
        }
      }
      setDisplay(out);
      if (done) window.clearInterval(timer.current);
    }, 34);
    return () => window.clearInterval(timer.current);
  }, [text, active]);

  if (isAr()) {
    return <span className="font-serif font-light">{display}</span>;
  }
  return (
    <span className="inline-flex flex-wrap gap-[3px]" aria-label={text}>
      {display.split("").map((ch, i) =>
        ch === " " ? (
          <span key={i} className="w-2" />
        ) : (
          <span
            key={i}
            className="relative inline-flex h-[1.5em] w-[0.95em] items-center justify-center rounded-[3px] bg-white/[0.07] font-mono leading-none shadow-[inset_0_-1px_0_rgba(0,0,0,.5)] after:absolute after:left-0 after:right-0 after:top-1/2 after:h-px after:bg-black/40"
          >
            {ch}
          </span>
        )
      )}
    </span>
  );
}

export default function TerminalBoard({ region }: { region: Region }) {
  const [active, setActive] = useState(0);
  const [clock, setClock] = useState("");
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const sectionRef = useRef<HTMLElement | null>(null);
  const { ref: nearRef, near } = useNearViewport<HTMLDivElement>();

  const n = region.stops.length;

  // scroll pins the hall and walks BOARDING down the rows
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

  // the hall clock
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    };
    tick();
    const id = window.setInterval(tick, 20_000);
    return () => window.clearInterval(id);
  }, []);

  // only the active window's film runs
  useEffect(() => {
    videoRefs.current.forEach((v, j) => {
      if (!v) return;
      if (j === active) {
        const source = v.querySelector<HTMLSourceElement>("source[data-src]");
        if (source && !source.src) {
          source.src = source.dataset.src || "";
          v.load();
        }
        const p = v.play();
        if (p) p.catch(() => undefined);
      } else {
        v.pause();
      }
    });
  }, [active, near]);

  if (!n) return null;
  const activeStop = region.stops[active];
  const gidOf = (country: string) =>
    region.catalog.find((g) => g.label.toLowerCase() === country.toLowerCase())?.id;

  return (
    <section ref={sectionRef} id="tier2-cities-countries" className="relative bg-ink text-white lg:h-[340svh]">
      {/* flight-path hold lane down the right edge, same as every selector */}
      <span id="tier2-cities-hold-in" aria-hidden="true" className="absolute right-[6vw] top-[10%]">
        <span data-flight-node className="block h-px w-px" />
      </span>
      <span id="tier2-cities-hold-out" aria-hidden="true" className="absolute right-[6vw] top-[90%]">
        <span data-flight-node className="block h-px w-px" />
      </span>

      <div ref={nearRef} className="relative overflow-hidden lg:sticky lg:top-0 lg:h-[100svh]">
        {/* hall backdrop — a faint wash of the active city behind the board */}
        <div aria-hidden="true" className="absolute inset-0">
          {near &&
            region.stops.map((stop, i) => (
              <div
                key={stop.id}
                className="absolute inset-0 transition-opacity duration-[900ms] ease-out"
                style={{ opacity: active === i ? 0.22 : 0 }}
              >
                {stop.slug && (
                  <img
                    src={posterUrl(stop.slug, 1600)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>
            ))}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,13,12,.94),rgba(14,13,12,.82)_30%,rgba(14,13,12,.86))]" />
        </div>

        <div className="relative mx-auto max-w-[1380px] px-5 py-20 sm:px-10 sm:py-24 lg:flex lg:h-full lg:flex-col lg:px-16 lg:pb-10 lg:pt-[calc(env(safe-area-inset-top)+92px)]">
          {/* the hall's header strip */}
          <div className="mb-8 flex items-end justify-between gap-6 border-b border-gold/25 pb-4 sm:mb-10 lg:mb-[clamp(14px,2.6svh,34px)]">
            <div>
              <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-light">{t("terminal.kicker")}</div>
              <h3 className="mt-2 font-serif text-[clamp(28px,4.6vw,50px)] font-light leading-[1.05] text-white lg:text-[clamp(22px,min(3.4vw,4.4svh),44px)]">
                {isAr()
                  ? `${n} مدن، والصعود مفتوح`
                  : <>{countWord(n)} cities,<br className="sm:hidden" /> now boarding</>}
              </h3>
            </div>
            <div className="hidden text-right sm:block">
              <div className="font-mono text-[22px] tracking-[0.14em] text-gold-light tabular-nums">{clock}</div>
              <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.26em] text-white/40">{t("terminal.local")}</div>
            </div>
          </div>

          <div className="lg:flex lg:min-h-0 lg:flex-1 lg:gap-12">
            {/* the board */}
            <div className="lg:min-w-0 lg:flex-[1.35]">
              {/* column headings */}
              <div className="hidden grid-cols-[64px_1fr_64px_110px] gap-x-5 border-b border-white/10 pb-2 font-mono text-[8px] uppercase tracking-[0.26em] text-white/35 sm:grid">
                <span>{t("terminal.flight")}</span>
                <span>{t("terminal.destination")}</span>
                <span>{t("terminal.gate")}</span>
                <span className="text-right">{t("terminal.status")}</span>
              </div>
              <div className="flex flex-col">
                {region.stops.map((stop, i) => {
                  const gid = gidOf(stop.country);
                  const isActive = active === i;
                  return (
                    <a
                      key={stop.id}
                      href={gid ? `/${region.slug}/${gid}` : "#tier2-enquire"}
                      onMouseEnter={() => setActive(i)}
                      className="group grid grid-cols-[1fr_auto] items-center gap-x-4 border-b border-white/[0.07] py-4 sm:grid-cols-[64px_1fr_64px_110px] sm:gap-x-5 lg:py-[clamp(4px,1.1svh,11px)]"
                    >
                      <span className={`hidden font-mono text-[10px] tracking-[0.12em] transition-colors duration-500 sm:block ${isActive ? "text-gold" : "text-white/30"}`}>
                        TRC {String(i + 1).padStart(2, "0")}0
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block text-[clamp(17px,2.1vw,24px)] transition-colors duration-500 lg:text-[clamp(13px,min(1.6vw,2.2svh),20px)] ${
                            isActive ? "text-white" : "text-white/45"
                          }`}
                        >
                          <FlapText text={stop.country} active={isActive} />
                        </span>
                        {/* on the pinned desktop board only the boarding row
                            carries its eyebrow — ten full rows must fit 100svh */}
                        <span className={`mt-1 block text-[8px] uppercase tracking-[0.24em] transition-colors duration-500 ${isActive ? "text-gold-light" : "text-white/30 lg:hidden"}`}>
                          {stop.eyebrow}
                        </span>
                        {/* mobile inline still */}
                        {stop.slug && (
                          <span className="media-shell mt-3 block h-24 w-full overflow-hidden rounded-sm border border-white/10 sm:hidden">
                            <img src={imgSized(posterUrl(stop.slug, 800), 800)} alt="" loading="lazy" decoding="async" onLoad={(e) => e.currentTarget.classList.add("media-ready")} className="media-fade h-full w-full object-cover" />
                          </span>
                        )}
                      </span>
                      <span className={`hidden font-mono text-[10px] tracking-[0.12em] transition-colors duration-500 sm:block ${isActive ? "text-gold-light" : "text-white/30"}`}>
                        {String.fromCharCode(65 + (i % 4))}{(i % 9) + 1}
                      </span>
                      <span className="text-right">
                        <span
                          className={`inline-block font-mono text-[9px] uppercase tracking-[0.2em] transition-colors duration-500 ${
                            isActive ? "animate-pulse text-gold" : "text-white/30"
                          }`}
                        >
                          {isActive ? t("terminal.boarding") : t("terminal.onTime")}
                        </span>
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* the terminal window — active city's footage + dossier */}
            <div className="hidden lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:justify-center">
              <div className="relative overflow-hidden rounded-xl border border-white/12 bg-ink shadow-[0_30px_80px_rgba(0,0,0,.5)]">
                <div className="media-shell relative aspect-[16/10]">
                  {near &&
                    region.stops.map((stop, i) => (
                      <div
                        key={stop.id}
                        className="absolute inset-0 transition-opacity duration-700"
                        style={{ opacity: active === i ? 1 : 0 }}
                      >
                        {stop.slug && hasFilm(stop.slug) ? (
                          <video
                            ref={(el) => {
                              videoRefs.current[i] = el;
                            }}
                            muted
                            loop
                            playsInline
                            preload="none"
                            poster={posterUrl(stop.slug, 1280)}
                            className="absolute inset-0 h-full w-full object-cover"
                          >
                            <source data-src={videoUrl(stop.slug)} type="video/mp4" />
                          </video>
                        ) : stop.slug ? (
                          <img
                            src={posterUrl(stop.slug, 1280)}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                    ))}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(14,13,12,.82))]" />
                  <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-5">
                    <div>
                      <div className="font-mono text-[8px] uppercase tracking-[0.26em] text-gold-light">{activeStop?.coords}</div>
                      <div className="mt-1 font-serif text-[26px] font-light leading-tight text-white">{activeStop?.country}</div>
                    </div>
                    <div className="text-right text-[8.5px] uppercase tracking-[0.2em] text-white/60">{activeStop?.season}</div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-[12.5px] font-light leading-[1.8] text-white/70">{activeStop?.copy}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeStop?.highlights?.slice(0, 3).map((h) => (
                      <span key={h} className="border border-white/15 px-2.5 py-1 text-[8px] uppercase tracking-[0.16em] text-white/60">
                        {h}
                      </span>
                    ))}
                  </div>
                  {gidOf(activeStop?.country ?? "") && (
                    <a
                      href={`/${region.slug}/${gidOf(activeStop.country)}`}
                      className="mt-4 inline-block border-b border-gold-light pb-0.5 text-[9px] uppercase tracking-[0.22em] text-gold-light"
                    >
                      {t("strip.explore", { country: activeStop.country })}
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-4 text-center font-mono text-[8px] uppercase tracking-[0.26em] text-white/30">
                {t("terminal.hint")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
