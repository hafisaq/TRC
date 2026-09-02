import type { MouseEvent } from "react";
import { posterUrl, videoUrl, lqipStyle } from "../../lib/media";
import { useNearViewport } from "../../lib/useNearViewport";
import { t as tr } from "../../lib/i18n";

export type StopTheme = "gold" | "white";
export type StopLayout = "split" | "cinematic" | "portal" | "editorial";

type StopProps = {
  id: string;
  index: number;
  total?: number;
  eyebrow: string;
  title: [string, string];
  copy: string;
  coords: string;
  slug: string;
  season: string;
  highlights: string[];
  theme: StopTheme;
  layout: StopLayout;
  interest: string;
  onEnquire: (interest: string) => void;
  // When set, the CTA becomes a plain link (hash anchor or a real page
  // path) instead of the enquire handler — used for stops like About Us
  // or a region overview that lead somewhere other than the enquiry form.
  ctaLabel?: string;
  ctaHref?: string;
};

const THEME_STYLES: Record<
  StopTheme,
  { wash: string; heading: string; copy: string; eyebrow: string; seasonText: string; tagBorder: string; tagText: string; frame: string; link: string }
> = {
  gold: {
    wash: "linear-gradient(155deg,rgba(200,162,76,.72) 0%,rgba(176,141,63,.72) 100%)",
    heading: "text-white",
    copy: "text-white/80",
    eyebrow: "text-white/85",
    seasonText: "text-white/75",
    tagBorder: "border-white/30",
    tagText: "text-white/80",
    frame: "border-white/35",
    link: "text-white border-white/40"
  },
  white: {
    wash: "rgba(250,248,244,.72)",
    heading: "text-navy",
    copy: "text-navy/70",
    eyebrow: "text-gold-deep",
    seasonText: "text-gold-deep",
    tagBorder: "border-navy/15",
    tagText: "text-navy/60",
    frame: "border-gold/45",
    link: "text-gold-deep border-gold-deep/40"
  }
};

function Meta({ season, highlights, t }: { index: number; coords: string; season: string; highlights: string[]; t: typeof THEME_STYLES.gold }) {
  return (
    <>
      <div className={`mt-4 sm:mt-5 text-[9px] sm:text-[10px] tracking-[0.16em] sm:tracking-[0.2em] uppercase ${t.seasonText}`}>{tr("stop.bestSeason")} · {season}</div>
      <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
        {highlights.map((h) => (
          <span key={h} className={`text-[8.5px] sm:text-[9.5px] tracking-[0.12em] sm:tracking-[0.15em] uppercase px-2.5 sm:px-3 py-1.5 border ${t.tagBorder} ${t.tagText}`}>
            {h}
          </span>
        ))}
      </div>
    </>
  );
}

function VideoTag({ slug, className = "", posterW = 1600 }: { slug: string; className?: string; posterW?: number }) {
  // the poster only downloads once the stop is approaching the viewport —
  // the media-shell shimmer (on the wrapping container) covers the wait
  const { ref, near } = useNearViewport<HTMLVideoElement>();
  return (
    <video ref={ref} muted loop playsInline preload="none" poster={near ? posterUrl(slug, posterW) : undefined} style={lqipStyle(slug)} className={`absolute inset-0 w-full h-full object-cover ${className}`}>
      <source data-src={videoUrl(slug)} type="video/mp4" />
    </video>
  );
}

export default function Stop({ id, index, total = 4, eyebrow, title, copy, coords, slug, season, highlights, theme, layout, interest, onEnquire, ctaLabel, ctaHref }: StopProps) {
  const t = THEME_STYLES[theme];
  const handleEnquireClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onEnquire(interest);
  };
  const wash = (
    <div data-stop-wash className="absolute inset-0 opacity-0 backdrop-blur-[2px]" style={{ background: t.wash }} />
  );
  const idx = `${String(index).padStart(2, "0")} / ${String(total).padStart(2, "0")} · ${coords}`;
  const cta = ctaHref
    ? { href: ctaHref, onClick: undefined, label: ctaLabel ?? tr("stop.learnMore") }
    : { href: "#tier2-enquire", onClick: handleEnquireClick, label: tr("stop.enquireRoute") };

  if (layout === "cinematic") {
    return (
      <section id={id} data-tier2-stop={id} data-stop-theme={theme} className="relative min-h-[100svh] w-full overflow-hidden">
        {wash}
        <div data-stop-video className="group absolute inset-0 opacity-0">
          <VideoTag slug={slug} className="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(0deg,rgba(0,0,0,.75) 0%,rgba(0,0,0,.15) 45%,rgba(0,0,0,.35) 100%)" }} />
        </div>
        <div data-stop-text className="relative min-h-[100svh] flex flex-col justify-end px-5 sm:px-10 lg:px-16 pb-14 sm:pb-20 opacity-0">
          <div className="font-mono text-[8.5px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.3em] text-gold-light">{idx}</div>
          <div className="mt-3 text-[9px] sm:text-[10.5px] tracking-[0.28em] sm:tracking-[0.4em] uppercase text-gold-light">{eyebrow}</div>
          <h2 data-stop-title className="mt-3 sm:mt-4 font-serif font-light text-white text-[clamp(38px,13vw,88px)] leading-[0.98] max-w-[720px]">
            {title[0]}<br />{title[1]}
          </h2>
          <p className="mt-4 sm:mt-5 max-w-[440px] text-[13.5px] sm:text-[14.5px] font-light leading-[1.75] sm:leading-[1.9] text-white/78">{copy}</p>
          <div className="mt-4 sm:mt-5 text-[9px] sm:text-[10px] tracking-[0.16em] sm:tracking-[0.2em] uppercase text-white/70">{tr("stop.bestSeason")} · {season}</div>
          <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
            {highlights.map((h) => (
              <span key={h} className="text-[8.5px] sm:text-[9.5px] tracking-[0.12em] sm:tracking-[0.15em] uppercase px-2.5 sm:px-3 py-1.5 border border-white/30 text-white/80">
                {h}
              </span>
            ))}
          </div>
          <a href={cta.href} onClick={cta.onClick} className="inline-block mt-6 sm:mt-7 w-fit text-[9px] sm:text-[10px] tracking-[0.22em] sm:tracking-[0.3em] uppercase text-white border-b border-white/40 pb-1.5">
            {cta.label}
          </a>
        </div>
      </section>
    );
  }

  if (layout === "portal") {
    return (
      <section id={id} data-tier2-stop={id} data-stop-theme={theme} className="relative min-h-[100svh] w-full flex items-center justify-center px-5 sm:px-6 py-16 sm:py-0 overflow-hidden">
        {wash}
        <div className="relative max-w-[620px] w-full flex flex-col items-center text-center">
          <div data-stop-text className="opacity-0 flex flex-col items-center">
            <div className={`font-mono text-[8.5px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.3em] ${t.seasonText}`}>{idx}</div>
            <div className={`mt-3 text-[9px] sm:text-[10.5px] tracking-[0.28em] sm:tracking-[0.4em] uppercase ${t.eyebrow}`}>{eyebrow}</div>
          </div>

          <div data-stop-video className="group relative w-[210px] h-[210px] sm:w-[300px] sm:h-[300px] mt-6 sm:mt-7 opacity-0 scale-95">
            <div className={`absolute -inset-3 rounded-full border ${t.frame}`} />
            <div className={`absolute -inset-3 rounded-full border ${t.frame} opacity-40 anim-ring`} style={{ borderStyle: "dashed" }} />
            <div className="media-shell relative w-full h-full rounded-full overflow-hidden bg-ink transition-transform duration-500 ease-out group-hover:scale-[1.05]">
              <VideoTag slug={slug} posterW={640} />
              <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle,rgba(0,0,0,0) 55%,rgba(0,0,0,.4) 100%)" }} />
            </div>
          </div>

          <div data-stop-text className="opacity-0 mt-6 sm:mt-7">
            <h2 data-stop-title className={`font-serif font-light text-[clamp(34px,12vw,64px)] leading-[1.02] ${t.heading}`}>
              {title[0]}<br />{title[1]}
            </h2>
            <p className={`mt-4 sm:mt-5 max-w-[420px] mx-auto text-[13.5px] sm:text-[14.5px] font-light leading-[1.75] sm:leading-[1.9] ${t.copy}`}>{copy}</p>
            <div className={`mt-4 sm:mt-5 text-[9px] sm:text-[10px] tracking-[0.16em] sm:tracking-[0.2em] uppercase ${t.seasonText}`}>{tr("stop.bestSeason")} · {season}</div>
            <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-2">
              {highlights.map((h) => (
                <span key={h} className={`text-[8.5px] sm:text-[9.5px] tracking-[0.12em] sm:tracking-[0.15em] uppercase px-2.5 sm:px-3 py-1.5 border ${t.tagBorder} ${t.tagText}`}>
                  {h}
                </span>
              ))}
            </div>
            <a href={cta.href} onClick={cta.onClick} className={`inline-block mt-6 sm:mt-7 text-[9px] sm:text-[10px] tracking-[0.22em] sm:tracking-[0.3em] uppercase border-b pb-1.5 ${t.link}`}>
              {cta.label}
            </a>
          </div>
        </div>
      </section>
    );
  }

  if (layout === "editorial") {
    return (
      <section id={id} data-tier2-stop={id} data-stop-theme={theme} className="relative min-h-[100svh] w-full flex flex-col justify-center px-5 sm:px-10 lg:px-16 py-16 overflow-hidden">
        {wash}
        <div className="relative max-w-[1200px] w-full mx-auto">
          <div data-stop-video className="group relative w-full aspect-[4/5] sm:aspect-[16/8] opacity-0 scale-95">
            <div className={`absolute -inset-2 sm:-inset-3 rounded-[20px] sm:rounded-[24px] border pointer-events-none ${t.frame}`} />
            <div className="media-shell relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden bg-ink transition-transform duration-500 ease-out group-hover:scale-[1.02]">
              <VideoTag slug={slug} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.3))" }} />
            </div>
          </div>

          <div data-stop-text className="opacity-0 mt-7 sm:mt-9 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-5 sm:gap-8 items-end">
            <div>
              <div className={`font-mono text-[8.5px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.3em] ${t.seasonText}`}>{idx}</div>
              <div className={`mt-3 text-[9px] sm:text-[10.5px] tracking-[0.28em] sm:tracking-[0.4em] uppercase ${t.eyebrow}`}>{eyebrow}</div>
              <h2 data-stop-title className={`mt-3 sm:mt-4 font-serif font-light text-[clamp(34px,11vw,58px)] leading-[1.02] ${t.heading}`}>
                {title[0]} {title[1]}
              </h2>
            </div>
            <p className={`text-[13.5px] sm:text-[14.5px] font-light leading-[1.75] sm:leading-[1.9] ${t.copy}`}>{copy}</p>
            <div>
              <div className={`text-[9px] sm:text-[10px] tracking-[0.16em] sm:tracking-[0.2em] uppercase ${t.seasonText}`}>{tr("stop.bestSeason")} · {season}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {highlights.map((h) => (
                  <span key={h} className={`text-[8.5px] sm:text-[9.5px] tracking-[0.12em] sm:tracking-[0.15em] uppercase px-2.5 sm:px-3 py-1.5 border ${t.tagBorder} ${t.tagText}`}>
                    {h}
                  </span>
                ))}
              </div>
              <a href={cta.href} onClick={cta.onClick} className={`inline-block mt-5 text-[9px] sm:text-[10px] tracking-[0.22em] sm:tracking-[0.3em] uppercase border-b pb-1.5 ${t.link}`}>
                {cta.label}
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // "split" — the original two-column layout
  return (
    <section id={id} data-tier2-stop={id} data-stop-theme={theme} className="relative min-h-[100svh] w-full flex items-center justify-center px-5 sm:px-6 py-16 lg:py-0 overflow-hidden">
      {wash}
      <div className="relative max-w-[1100px] w-full grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-7 sm:gap-10 lg:gap-16 items-center">
        <div data-stop-text className="text-center lg:text-left opacity-0">
          <div className={`font-mono text-[8.5px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.3em] ${t.seasonText}`}>{idx}</div>
          <div className={`mt-3 text-[9px] sm:text-[10.5px] tracking-[0.28em] sm:tracking-[0.4em] uppercase ${t.eyebrow}`}>{eyebrow}</div>
          <h2 data-stop-title className={`mt-3 sm:mt-4 font-serif font-light text-[clamp(40px,13vw,72px)] leading-[1.02] ${t.heading}`}>
            {title[0]}<br />{title[1]}
          </h2>
          <p className={`mt-4 sm:mt-5 max-w-[420px] mx-auto lg:mx-0 text-[13.5px] sm:text-[14.5px] font-light leading-[1.75] sm:leading-[1.9] ${t.copy}`}>{copy}</p>
          <div className="text-center lg:text-left">
            <Meta index={index} coords={coords} season={season} highlights={highlights} t={t} />
          </div>
          <a href={cta.href} onClick={cta.onClick} className={`inline-block mt-6 sm:mt-7 text-[9px] sm:text-[10px] tracking-[0.22em] sm:tracking-[0.3em] uppercase border-b pb-1.5 ${t.link}`}>
            {cta.label}
          </a>
        </div>

        <div data-stop-video className="group relative aspect-[4/3] sm:aspect-video lg:aspect-[4/3] w-full max-w-[560px] mx-auto opacity-0 scale-95">
          <div className={`absolute -inset-2 sm:-inset-4 rounded-[20px] sm:rounded-[28px] border pointer-events-none ${t.frame}`} />
          <div className="media-shell relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden bg-ink transition-transform duration-500 ease-out group-hover:scale-[1.045]">
            <VideoTag slug={slug} posterW={1200} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.35))" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
