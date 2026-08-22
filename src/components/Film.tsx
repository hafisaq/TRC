import HoverVideo from "./HoverVideo";
import PlaneTrail from "./PlaneTrail";

const STILLS = [
  { slug: "reef-dive", pattern: "repeating-linear-gradient(104deg,#e6e1d4 0 3px,#f2efe8 3px 18px)" },
  { slug: "bali-coast", pattern: "repeating-linear-gradient(76deg,#e2e3de 0 3px,#eff0ea 3px 18px)" },
  { slug: "desert-ruins", pattern: "repeating-linear-gradient(118deg,#eadfcb 0 3px,#f4eee2 3px 18px)" },
  { slug: "sea-clouds", pattern: "repeating-linear-gradient(92deg,#e4e0d8 0 3px,#f1eee8 3px 18px)" }
];

export default function Film() {
  return (
    <section id="film" className="py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-11 bg-white">
      <div className="max-w-[1240px] mx-auto">
        <div data-reveal className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <div className="relative inline-block">
              <div data-eyebrow data-reveal-line className="text-[10.5px] tracking-[0.42em] uppercase text-gold-dim">04 — Film</div>
              <PlaneTrail
                id="film-trail"
                viewBox="0 0 220 40"
                pathD="M4,30 C60,30 90,8 214,10"
                color="#c8a24c"
                planeSize={15}
                className="absolute -top-2 left-0 w-[160px] sm:w-[200px] h-10 opacity-0 pointer-events-none"
              />
            </div>
            <h2 data-split className="mt-6 font-serif font-light text-[clamp(30px,4.6vw,66px)] leading-[1.05]">A season in<br />four minutes</h2>
          </div>
          <div data-reveal-line className="text-[10.5px] tracking-[0.3em] uppercase text-navy/45">Filmed by our guides · 2026</div>
        </div>

        <div data-reveal className="mt-7 sm:mt-9">
          <div data-reveal-line data-media className="relative aspect-video overflow-hidden bg-[#f2efe8]">
            <div data-parallax="0.1" data-zoom className="absolute -inset-x-0 -inset-y-[8%] anim-drift" style={{ background: "repeating-linear-gradient(88deg,#e7e2d6 0 3px,#f3f0e9 3px 24px)" }} />
            <video autoPlay muted loop playsInline preload="none" poster="/media/poster/film-reel.jpg" className="absolute inset-0 w-full h-full object-cover" data-eager-video>
              <source src="/media/video/film-reel.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(255,255,255,.06),rgba(22,36,60,.34))" }} />
            <div className="absolute top-5 left-6 font-mono text-[9.5px] tracking-[0.26em] uppercase text-navy/42 hidden sm:block">film reel · 16:9</div>
            <div className="absolute top-5 right-6 hidden sm:flex items-center gap-2.5 font-mono text-[9.5px] tracking-[0.26em] uppercase text-white/90">
              <span className="w-1.5 h-1.5 rounded-full bg-gold anim-pulse" />Playing
            </div>
            <div className="absolute left-6 right-6 bottom-6 text-white">
              <div className="flex items-center gap-4">
                <div className="flex-1 h-0.5 bg-white/35"><div data-vid-bar className="h-full w-0 bg-gold" /></div>
                <div data-vid-time data-dur="242" className="font-mono text-[10px] tracking-[0.18em]">00:00 / 04:02</div>
              </div>
              <div data-film-chapters className="hidden sm:flex gap-6 mt-3.5 text-[9.5px] tracking-[0.26em] uppercase text-white/55">
                <span>01 Departure</span><span>02 The coast road</span><span>03 Camp</span><span>04 Home</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
          {STILLS.map((s) => (
            <div key={s.slug} data-reveal data-media data-video-key={s.slug} className="relative aspect-[4/5] overflow-hidden bg-[#f2efe8]">
              <div data-zoom className="absolute -inset-[4%] anim-drift" style={{ background: s.pattern }} />
              <HoverVideo slug={s.slug} />
              <div className="absolute bottom-3.5 left-3.5 font-mono text-[9px] tracking-[0.24em] uppercase text-navy/45 hidden sm:block">still · 4:5 · hover to play</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
