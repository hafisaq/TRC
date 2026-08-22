type StopProps = {
  id: string;
  index: number;
  eyebrow: string;
  title: [string, string];
  copy: string;
  coords: string;
  slug: string;
};

export default function Stop({ id, index, eyebrow, title, copy, coords, slug }: StopProps) {
  return (
    <section id={id} data-tier2-stop={id} className="relative h-[100svh] w-full flex items-center justify-center px-6">
      <div className="relative max-w-[1100px] w-full grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-center">
        <div data-stop-text className="text-center lg:text-left opacity-0">
          <div className="font-mono text-[10px] tracking-[0.3em] text-gold-dim">
            {String(index).padStart(2, "0")} / 04 · {coords}
          </div>
          <div className="mt-3 text-[10.5px] tracking-[0.4em] uppercase text-gold-light">{eyebrow}</div>
          <h2 className="mt-4 font-serif font-light text-white text-[clamp(34px,6vw,72px)] leading-[1.02]">
            {title[0]}<br />{title[1]}
          </h2>
          <p className="mt-5 max-w-[420px] mx-auto lg:mx-0 text-[14.5px] font-light leading-[1.9] text-white/60">{copy}</p>
          <a
            href="#tier2-enquire"
            className="inline-block mt-7 text-[10px] tracking-[0.3em] uppercase text-gold-light border-b border-gold-light/40 pb-1.5"
          >
            Enquire about this route
          </a>
        </div>

        <div data-stop-video className="relative aspect-[4/5] sm:aspect-video lg:aspect-[4/3] w-full max-w-[560px] mx-auto opacity-0 scale-95">
          <div className="absolute -inset-4 rounded-[28px] border border-gold/25 pointer-events-none" />
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-ink">
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
