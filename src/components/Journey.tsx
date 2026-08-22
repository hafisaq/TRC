import PlaneTrail from "./PlaneTrail";

const STEPS = [
  { roman: "I", title: "A conversation", copy: "An hour on the phone. Where you have been, and what you would rather avoid." },
  { roman: "II", title: "A proposal", copy: "One route, drawn by hand, with the rooms named and the reasons given." },
  { roman: "III", title: "The journey", copy: "Guides who live there, drivers we know by name, and one number that always answers." },
  { roman: "IV", title: "After", copy: "Your notes and photographs kept on file, so the next one starts further along." }
];

export default function Journey() {
  return (
    <section
      id="journey"
      className="relative py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-11 overflow-hidden"
      style={{ background: "linear-gradient(155deg,#c8a24c 0%,#b08d3f 100%)" }}
    >
      <div className="absolute -right-[8%] -top-[14%] w-[46vw] h-[46vw] rounded-full border border-white/14 pointer-events-none" />
      <div className="relative max-w-[1180px] mx-auto">
        <div data-reveal className="max-w-[640px]">
          <div className="relative inline-block">
            <div data-eyebrow data-reveal-line className="text-[10.5px] tracking-[0.42em] uppercase text-white/75">06 — How we travel</div>
            <PlaneTrail
              id="journey-trail"
              viewBox="0 0 220 40"
              pathD="M4,30 C60,30 90,8 214,10"
              color="#ffffff"
              planeSize={15}
              className="absolute -top-2 left-0 w-[160px] sm:w-[200px] h-10 opacity-0 pointer-events-none"
            />
          </div>
          <h2 data-split className="mt-6.5 font-serif font-light text-[clamp(32px,5vw,72px)] leading-[1.06] tracking-[-.015em] text-white">
            Four steps,<br />then nothing to do
          </h2>
        </div>
        <div className="mt-9 sm:mt-12 lg:mt-14 grid border-t border-white/25" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))" }}>
          {STEPS.map((s, i) => (
            <div key={s.roman} data-reveal className={`px-7 pt-8 pb-9 border-l border-b border-white/25 ${i > 0 ? "border-r" : ""}`}>
              <div data-reveal-line className="font-serif text-[15px] tracking-[0.3em] text-white/85">{s.roman}</div>
              <div data-reveal-line className="mt-5 font-serif text-[26px] text-white">{s.title}</div>
              <p data-reveal-line className="mt-3.5 text-sm font-light leading-[1.9] text-white/75">{s.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
