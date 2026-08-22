import PlaneTrail from "./PlaneTrail";

const CHIPS = ["Coast & islands", "Mountain & ice", "Desert & plain", "Cities & culture"];

export default function Enquire() {
  return (
    <section id="enquire" data-glow-section className="relative py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-11 pb-9 sm:pb-11 bg-white overflow-hidden">
      <div className="absolute -left-[10%] -bottom-[20%] w-[46vw] h-[46vw] rounded-full border border-gold/14 pointer-events-none" />
      <div
        data-cursor-glow
        className="hidden lg:block absolute w-[420px] h-[420px] rounded-full pointer-events-none opacity-0 transition-opacity duration-500"
        style={{ background: "radial-gradient(circle,rgba(200,162,76,.12),transparent 70%)", left: 0, top: 0 }}
      />
      <div className="relative max-w-[1180px] mx-auto">
        <div data-reveal className="grid gap-8 lg:gap-16 items-end" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
          <div>
            <div className="relative inline-block">
              <div data-eyebrow data-reveal-line className="text-[10.5px] tracking-[0.42em] uppercase text-gold-dim">08 — Enquire</div>
              <PlaneTrail
                id="enquire-trail"
                viewBox="0 0 220 40"
                pathD="M4,8 C60,8 90,26 214,28"
                color="#c8a24c"
                planeSize={15}
                className="absolute -top-2 left-0 w-[160px] sm:w-[200px] h-10 opacity-0 pointer-events-none"
              />
            </div>
            <h2 data-split className="mt-7 font-serif font-light text-[clamp(32px,5.4vw,78px)] leading-[1.02]">
              Tell us where<br /><span className="italic text-[#b08d3f]">you'd rather be</span>
            </h2>
            <p data-reveal-line className="mt-6.5 max-w-[380px] text-[15px] font-light leading-[1.85] text-navy/60">
              We take a limited number of journeys each season. We don't publish rates — every itinerary is quoted as it is built.
            </p>
          </div>
          <div data-reveal>
            <label data-reveal-line className="block mb-6.5">
              <div className="text-[10px] tracking-[0.3em] uppercase text-navy/45">Name</div>
              <input
                type="text"
                placeholder="Your name"
                className="w-full box-border mt-3 bg-transparent border-0 border-b border-navy/20 text-navy font-serif text-xl py-2.5 outline-none transition-colors duration-400 focus:border-gold"
              />
            </label>
            <label data-reveal-line className="block mb-6.5">
              <div className="text-[10px] tracking-[0.3em] uppercase text-navy/45">Email</div>
              <input
                type="email"
                placeholder="you@address.com"
                className="w-full box-border mt-3 bg-transparent border-0 border-b border-navy/20 text-navy font-serif text-xl py-2.5 outline-none transition-colors duration-400 focus:border-gold"
              />
            </label>
            <div data-reveal-line className="text-[10px] tracking-[0.3em] uppercase text-navy/45">Interest</div>
            <div data-reveal-line className="flex flex-wrap gap-2.5 mt-3.5">
              {CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  data-chip
                  className="magnetic bg-transparent border border-navy/[.18] text-navy/70 font-sans text-[10px] tracking-[0.24em] uppercase px-5 py-3 cursor-pointer transition-all duration-300 hover:border-gold hover:text-navy"
                >
                  {chip}
                </button>
              ))}
            </div>
            <button
              type="button"
              data-reveal-line
              className="magnetic mt-9 w-full bg-gold border-0 text-white font-sans text-[11px] tracking-[0.3em] uppercase py-5 cursor-pointer transition-colors duration-400 hover:bg-[#b08d3f]"
            >
              Send enquiry
            </button>
          </div>
        </div>

        <div className="mt-11 sm:mt-14 lg:mt-16 pt-7 border-t border-navy/[.12] flex flex-wrap gap-7 justify-between items-center text-[10px] tracking-[0.26em] uppercase text-navy/45">
          <img src="/media/brand/retreat-collection-logo.jpg" alt="The Retreat Collection" className="h-10 sm:h-12 w-auto mix-blend-multiply" />
          <div className="flex flex-wrap gap-7">
            <a href="#destinations" className="text-inherit">Destinations</a>
            <a href="#film" className="text-inherit">Film</a>
            <a href="#journey" className="text-inherit">How we travel</a>
            <a href="#enquire" className="text-inherit">Contact</a>
          </div>
          <div>London · Cape Town · Kyoto</div>
        </div>
      </div>
    </section>
  );
}
