import type { RegionStop } from "../../data/regions/types";

// White Desert-style opener: the region name is huge, and the video plays
// BRIGHT inside the letters while the surround is dimmed — the video seeps
// through the text. Built with an SVG mask (a dark rect punched by the word).
export default function RegionHero({
  id,
  stop,
  title,
  intro
}: {
  id: string;
  stop: RegionStop;
  title: string;
  intro: string;
}) {
  const maskId = `${id}-text-mask`;
  // Scale the type down a touch for long names so it always fits one line.
  const fontSize = title.length > 7 ? 150 : title.length > 5 ? 200 : 240;

  return (
    <section id={id} className="relative h-[100svh] min-h-[600px] w-full overflow-hidden bg-ink">
      <video autoPlay muted loop playsInline poster={`/media/poster/${stop.slug}.jpg`} className="absolute inset-0 h-full w-full object-cover">
        <source src={`/media/video/${stop.slug}.mp4`} type="video/mp4" />
      </video>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <mask id={maskId}>
            <rect width="1000" height="560" fill="white" />
            <text
              x="500"
              y="315"
              textAnchor="middle"
              fontFamily="var(--font-serif)"
              fontWeight="300"
              fontSize={fontSize}
              letterSpacing="2"
              fill="black"
            >
              {title.toUpperCase()}
            </text>
          </mask>
        </defs>
        {/* dim everything except inside the letters */}
        <rect width="1000" height="560" fill="rgba(14,13,12,0.72)" mask={`url(#${maskId})`} />
      </svg>

      {/* faint gold outline of the same word, for definition */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span
          className="font-serif font-light uppercase leading-none text-transparent"
          style={{
            fontSize: `clamp(64px, ${title.length > 7 ? 15 : 20}vw, 280px)`,
            letterSpacing: "0.02em",
            WebkitTextStroke: "1px rgba(227,198,130,0.28)"
          }}
        >
          {title}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[64%] flex flex-col items-center px-5 text-center">
        <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.3em] text-gold-light sm:gap-4 sm:text-[10px]">
          <span className="h-px w-8 bg-gold/60 sm:w-10" />
          The Region
          <span className="h-px w-8 bg-gold/60 sm:w-10" />
        </div>
        <p className="mt-5 max-w-[520px] text-[12.5px] font-light leading-[1.85] text-white/72 sm:text-[13.5px]">{intro}</p>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 text-white/50 sm:bottom-10">
        <div className="text-[8.5px] uppercase tracking-[0.34em] sm:text-[9px] sm:tracking-[0.4em]">Scroll to fly the route</div>
        <div className="h-10 w-px sm:h-12" style={{ background: "linear-gradient(180deg,rgba(255,255,255,.6),rgba(255,255,255,0))" }} />
      </div>
    </section>
  );
}
