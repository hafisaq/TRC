export type StopTheme = "gold" | "white";

type StopProps = {
  id: string;
  index: number;
  eyebrow: string;
  title: [string, string];
  copy: string;
  coords: string;
  slug: string;
  season: string;
  highlights: string[];
  theme: StopTheme;
};

const THEME_STYLES: Record<
  StopTheme,
  { section: string; heading: string; copy: string; eyebrow: string; seasonText: string; tagBorder: string; tagText: string; frame: string; link: string }
> = {
  gold: {
    section: "bg-[linear-gradient(155deg,#c8a24c_0%,#b08d3f_100%)]",
    heading: "text-white",
    copy: "text-white/78",
    eyebrow: "text-white/85",
    seasonText: "text-white/70",
    tagBorder: "border-white/30",
    tagText: "text-white/75",
    frame: "border-white/35",
    link: "text-white border-white/40"
  },
  white: {
    section: "bg-cream",
    heading: "text-navy",
    copy: "text-navy/65",
    eyebrow: "text-gold-deep",
    seasonText: "text-gold-deep",
    tagBorder: "border-navy/15",
    tagText: "text-navy/55",
    frame: "border-gold/45",
    link: "text-gold-deep border-gold-deep/40"
  }
};

export default function Stop({ id, index, eyebrow, title, copy, coords, slug, season, highlights, theme }: StopProps) {
  const t = THEME_STYLES[theme];

  return (
    <section
      id={id}
      data-tier2-stop={id}
      data-stop-theme={theme}
      className={`relative h-[100svh] w-full flex items-center justify-center px-6 overflow-hidden ${t.section}`}
    >
      <div className="relative max-w-[1100px] w-full grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-center">
        <div data-stop-text className="text-center lg:text-left opacity-0">
          <div className={`font-mono text-[10px] tracking-[0.3em] ${t.seasonText}`}>
            {String(index).padStart(2, "0")} / 04 · {coords}
          </div>
          <div className={`mt-3 text-[10.5px] tracking-[0.4em] uppercase ${t.eyebrow}`}>{eyebrow}</div>
          <h2 className={`mt-4 font-serif font-light text-[clamp(34px,6vw,72px)] leading-[1.02] ${t.heading}`}>
            {title[0]}<br />{title[1]}
          </h2>
          <p className={`mt-5 max-w-[420px] mx-auto lg:mx-0 text-[14.5px] font-light leading-[1.9] ${t.copy}`}>{copy}</p>

          <div className={`mt-5 text-[10px] tracking-[0.2em] uppercase ${t.seasonText}`}>Best season · {season}</div>
          <div className="mt-4 flex flex-wrap justify-center lg:justify-start gap-2">
            {highlights.map((h) => (
              <span key={h} className={`text-[9.5px] tracking-[0.15em] uppercase px-3 py-1.5 border ${t.tagBorder} ${t.tagText}`}>
                {h}
              </span>
            ))}
          </div>

          <a href="#tier2-enquire" className={`inline-block mt-7 text-[10px] tracking-[0.3em] uppercase border-b pb-1.5 ${t.link}`}>
            Enquire about this route
          </a>
        </div>

        <div data-stop-video className="group relative aspect-[4/5] sm:aspect-video lg:aspect-[4/3] w-full max-w-[560px] mx-auto opacity-0 scale-95">
          <div className={`absolute -inset-4 rounded-[28px] border pointer-events-none ${t.frame}`} />
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-ink transition-transform duration-500 ease-out group-hover:scale-[1.045]">
            <video muted loop playsInline preload="none" poster={`/media/poster/${slug}.jpg`} className="absolute inset-0 w-full h-full object-cover">
              <source data-src={`/media/video/${slug}.mp4`} type="video/mp4" />
            </video>
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.35))" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
