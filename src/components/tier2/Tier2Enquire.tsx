import { useState } from "react";

const CABINS = ["Coast & islands", "Mountain & ice", "Desert & plain", "Cities & culture"];

export default function Tier2Enquire() {
  const [cabin, setCabin] = useState<string | null>(null);

  return (
    <section id="tier2-enquire" data-tier2-stop="tier2-enquire" className="relative min-h-[100svh] w-full flex items-center justify-center px-5 sm:px-6 py-24">
      <div data-stop-text className="w-full max-w-[820px] opacity-0">
        <div className="text-center mb-9">
          <div className="text-[10.5px] tracking-[0.4em] uppercase text-gold-light">Journey's end</div>
          <h2 className="mt-4 font-serif font-light text-white text-[clamp(30px,5vw,58px)] leading-[1.08]">
            Get in touch,<br className="sm:hidden" /> <span className="italic text-gold-light">we'll draw the route</span>
          </h2>
        </div>

        {/* boarding pass */}
        <div className="relative flex flex-col sm:flex-row rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,.55)]">
          {/* main stub */}
          <div className="relative flex-1 bg-cream px-6 sm:px-9 py-8 sm:py-9" style={{ fontFamily: "var(--font-type)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] sm:text-[10px] tracking-[0.35em] uppercase text-navy/50">The Retreat Collection</div>
                <div className="mt-1 text-[15px] sm:text-[17px] tracking-[0.1em] uppercase text-navy font-bold">Boarding Pass</div>
              </div>
              <svg width="26" height="26" viewBox="0 0 24 24" className="text-gold-deep shrink-0" style={{ transform: "rotate(90deg)" }}>
                <path
                  fill="currentColor"
                  d="M21,16V14L13,9V3.5C13,2.67 12.33,2 11.5,2C10.67,2 10,2.67 10,3.5V9L2,14V16L10,13.5V19L7.5,20.5V22L11.5,21L15.5,22V20.5L13,19V13.5L21,16Z"
                />
              </svg>
            </div>

            <div className="mt-7 flex items-center gap-3">
              <div>
                <div className="text-[9px] tracking-[0.25em] uppercase text-navy/45">From</div>
                <div className="mt-1 text-[22px] sm:text-[26px] tracking-[0.05em] text-navy">HERE</div>
              </div>
              <div className="flex-1 h-px bg-navy/20 relative top-3.5 mx-1">
                <div className="absolute -top-[3px] right-0 w-0 h-0" style={{ borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: "6px solid rgba(22,36,60,.4)" }} />
              </div>
              <div className="text-right">
                <div className="text-[9px] tracking-[0.25em] uppercase text-navy/45">To</div>
                <div className="mt-1 text-[22px] sm:text-[26px] tracking-[0.05em] text-navy">ANYWHERE</div>
              </div>
            </div>

            <label className="block mt-7">
              <div className="text-[9px] tracking-[0.25em] uppercase text-navy/45">Passenger name</div>
              <input
                type="text"
                placeholder="YOUR NAME"
                className="w-full box-border mt-2 bg-transparent border-0 border-b border-navy/25 text-navy uppercase tracking-[0.08em] text-[15px] sm:text-[16px] py-2 outline-none transition-colors duration-300 focus:border-gold placeholder:text-navy/30"
                style={{ fontFamily: "var(--font-type)" }}
              />
            </label>

            <label className="block mt-5">
              <div className="text-[9px] tracking-[0.25em] uppercase text-navy/45">Contact email</div>
              <input
                type="email"
                placeholder="you@address.com"
                className="w-full box-border mt-2 bg-transparent border-0 border-b border-navy/25 text-navy tracking-[0.03em] text-[15px] sm:text-[16px] py-2 outline-none transition-colors duration-300 focus:border-gold placeholder:text-navy/30"
                style={{ fontFamily: "var(--font-type)" }}
              />
            </label>

            <div className="mt-6 text-[9px] tracking-[0.25em] uppercase text-navy/45">Cabin — where to</div>
            <div className="flex flex-wrap gap-2 mt-2.5">
              {CABINS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCabin(c === cabin ? null : c)}
                  className={`text-[9.5px] tracking-[0.15em] uppercase px-3.5 py-2 border transition-colors duration-200 ${
                    cabin === c ? "border-gold bg-gold/10 text-navy" : "border-navy/20 text-navy/60 hover:border-navy/40"
                  }`}
                  style={{ fontFamily: "var(--font-type)" }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* perforation */}
          <div className="relative hidden sm:block w-0">
            <div className="absolute top-0 bottom-0 left-0 border-l border-dashed border-navy/25" />
            <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-ink" />
            <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-ink" />
          </div>
          <div className="relative sm:hidden h-0">
            <div className="absolute left-0 right-0 top-0 border-t border-dashed border-navy/25" />
            <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-ink" />
            <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-ink" />
          </div>

          {/* stub */}
          <div className="relative w-full sm:w-[210px] bg-cream-deep px-6 sm:px-6 py-8 sm:py-9 flex flex-col justify-between" style={{ fontFamily: "var(--font-type)" }}>
            <div>
              <div className="text-[9px] tracking-[0.25em] uppercase text-navy/45">Flight</div>
              <div className="mt-1 text-[15px] tracking-[0.08em] text-navy">TRC · 001</div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[9px] tracking-[0.25em] uppercase text-navy/45">Gate</div>
                  <div className="mt-1 text-[14px] text-navy">—</div>
                </div>
                <div>
                  <div className="text-[9px] tracking-[0.25em] uppercase text-navy/45">Seat</div>
                  <div className="mt-1 text-[14px] text-navy">1A</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-[9px] tracking-[0.25em] uppercase text-navy/45">Class</div>
                <div className="mt-1 text-[13px] text-navy leading-snug">{cabin || "To be arranged"}</div>
              </div>
            </div>

            <div
              className="mt-7 h-9 opacity-70"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #16243c 0px, #16243c 2px, transparent 2px, transparent 4px, #16243c 4px, #16243c 5px, transparent 5px, transparent 8px, #16243c 8px, #16243c 10px, transparent 10px, transparent 11px)"
              }}
            />
          </div>
        </div>

        <button
          type="button"
          className="magnetic mt-6 w-full bg-gold border-0 text-white text-[11px] tracking-[0.3em] uppercase py-5 cursor-pointer transition-colors duration-400 hover:bg-[#b08d3f]"
        >
          ✂ Confirm enquiry
        </button>

        <div className="mt-8 pt-6 border-t border-white/12 text-center text-[10px] tracking-[0.26em] uppercase text-white/35">
          London · Cape Town · Kyoto
        </div>
      </div>
    </section>
  );
}
