import PlaneTrail from "./PlaneTrail";

const STATS = [
  { value: 14, suffix: "", label: "Years designing\nprivate travel" },
  { value: 60, suffix: "+", label: "Countries we\nwork in directly" },
  { value: 1, suffix: "", label: "Designer per\njourney, start to end" }
];

export default function Ethos() {
  return (
    <section className="py-16 sm:py-20 lg:py-[100px] px-5 sm:px-8 lg:px-11 bg-white">
      <div className="max-w-[1180px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)] gap-8 lg:gap-16 items-start">
        <div data-reveal className="lg:sticky lg:top-[130px]">
          <div className="relative inline-block">
            <div data-eyebrow data-reveal-line className="text-[10.5px] tracking-[0.42em] uppercase text-gold-dim">01 — Ethos</div>
            <PlaneTrail
              id="ethos-trail"
              viewBox="0 0 220 40"
              pathD="M4,30 C60,30 90,8 214,10"
              color="#c8a24c"
              planeSize={15}
              className="absolute -top-2 left-0 w-[160px] sm:w-[200px] h-10 opacity-0 pointer-events-none"
            />
          </div>
        </div>
        <div data-reveal>
          <p data-reveal-line className="m-0 font-serif font-light text-[clamp(24px,3.1vw,45px)] leading-[1.42] tracking-[-.01em] text-pretty">
            A journey should feel like it was made once, for you, by someone who has already been. We keep the list of guests short so that stays true.
          </p>
          <div data-reveal-line className="mt-9 grid gap-11" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
            {STATS.map((s) => (
              <div key={s.label}>
                <div data-count={s.value} data-suffix={s.suffix} className="font-serif text-4xl text-[#b08d3f]">0</div>
                <div className="mt-2.5 text-[11px] tracking-[0.2em] uppercase text-navy/50 leading-[1.9]">
                  {s.label.split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      {i === 0 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
