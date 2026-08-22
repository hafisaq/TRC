import HoverVideo from "./HoverVideo";
import PlaneTrail from "./PlaneTrail";

const POINTS = [
  { title: "One designer, start to end", copy: "The person who plans your journey is the person you call from the road." },
  { title: "Only places we have slept in", copy: "Every room on our list has been stayed in by someone on this team." },
  { title: "Paid where it lands", copy: "Guides, drivers and hosts are contracted directly and paid above local rate." }
];

export default function Standard() {
  return (
    <section id="standard" className="py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-11 bg-cream">
      <div className="max-w-[1180px] mx-auto grid gap-8 lg:gap-16" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        <div data-reveal>
          <div className="relative inline-block">
            <div data-eyebrow data-reveal-line className="text-[10.5px] tracking-[0.42em] uppercase text-gold-dim">07 — Our standard</div>
            <PlaneTrail
              id="standard-trail"
              viewBox="0 0 220 40"
              pathD="M4,30 C60,30 90,8 214,10"
              color="#c8a24c"
              planeSize={15}
              className="absolute -top-2 left-0 w-[160px] sm:w-[200px] h-10 opacity-0 pointer-events-none"
            />
          </div>
          <h2 data-split className="mt-6.5 font-serif font-light text-[clamp(30px,4.2vw,60px)] leading-[1.08]">Quietly<br />absolute</h2>
        </div>
        <div data-reveal>
          {POINTS.map((p, i) => {
            const isFirst = i === 0;
            const isLast = i === POINTS.length - 1;
            const padding = isFirst ? "pb-6.5" : "py-6.5";
            const border = isLast ? "" : "border-b border-navy/[.14]";
            return (
              <div key={p.title} data-reveal-line className={`${padding} ${border}`}>
                <div className="font-serif text-[23px]">{p.title}</div>
                <p className="mt-2.5 text-sm font-light leading-[1.85] text-navy/60">{p.copy}</p>
              </div>
            );
          })}
        </div>
        <div data-reveal data-media data-video-key="bali-coast" className="relative min-h-[300px] sm:min-h-[360px] bg-[#efece4] overflow-hidden">
          <div data-parallax="0.06" data-zoom className="absolute -inset-x-0 -inset-y-[10%] anim-drift" style={{ background: "repeating-linear-gradient(110deg,#ded5c4 0 3px,#eee9de 3px 18px)" }} />
          <HoverVideo slug="bali-coast" />
          <div className="absolute bottom-5 left-5.5 font-mono text-[9.5px] tracking-[0.24em] uppercase text-navy/45 hidden sm:block">film · on the road · hover to play</div>
        </div>
      </div>
    </section>
  );
}
