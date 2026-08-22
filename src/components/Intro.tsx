const PLACES = ["Amalfi", "Hokkaido", "Wadi Rum", "Patagonia", "Kyoto", "The Cape", "Engadin", "Kerala"];

function MarqueeRow({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="flex gap-14 pr-14 text-[11px] tracking-[0.34em] uppercase text-navy/42" aria-hidden={hidden || undefined}>
      {PLACES.map((place) => (
        <span key={place}>
          {place} <span className="text-gold">·</span>
        </span>
      ))}
    </div>
  );
}

export default function Intro() {
  return (
    <section className="relative pt-24 sm:pt-28 lg:pt-[116px] px-5 sm:px-8 lg:px-11 bg-white overflow-hidden">
      <div className="absolute -top-[6%] -right-[8%] w-[52vw] h-[52vw] rounded-full border border-gold/16 pointer-events-none" />
      <div className="relative max-w-[1240px] mx-auto">
        <div data-reveal className="relative">
          <div data-reveal-line data-eyebrow className="text-[10.5px] tracking-[0.42em] uppercase text-gold-dim">
            Private travel, arranged one journey at a time
          </div>
          <h1 data-split className="mt-7 font-serif font-light text-[clamp(40px,8vw,132px)] leading-[.94] tracking-[-.02em]">
            Go slowly,<br /><span className="italic text-[#b08d3f]">go far</span>
          </h1>
          <div data-seal data-reveal-line className="absolute top-2 right-0 w-24 h-24 hidden sm:grid place-items-center anim-float">
            <div className="absolute inset-0 rounded-full anim-ring" style={{ border: "1px solid rgba(200,162,76,.35)", borderTopColor: "rgba(200,162,76,.9)" }} />
            <div className="text-center font-mono text-[8px] tracking-[0.24em] uppercase text-gold-dim leading-[2]">Est<br />2012</div>
          </div>
          <div data-reveal-line className="flex flex-wrap items-end gap-10 sm:gap-14 mt-10 sm:mt-11">
            <p className="m-0 max-w-[400px] text-[15.5px] leading-[1.9] font-light text-navy-soft text-pretty">
              Coastlines, high country, old cities and long deserts. We design the whole of it — the route, the rooms, the people who meet you — and then step out of the way.
            </p>
            <a href="#destinations" className="magnetic inline-flex items-center gap-3.5 text-[10.5px] tracking-[0.3em] uppercase text-gold-deep pb-2 border-b border-gold/45 transition-all duration-400 hover:gap-6 hover:border-gold">
              See where we go <span className="text-sm">↓</span>
            </a>
          </div>
        </div>

        <div className="mt-7 sm:mt-9 py-4.5 border-t border-b border-navy/[.09] overflow-hidden">
          <div data-marquee className="flex w-max">
            <MarqueeRow />
            <MarqueeRow hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
