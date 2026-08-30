import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import type { Destination } from "../../data/tier2Destinations";
import { submitEnquiry } from "../../lib/enquiry";

export type EnquiryOption = Pick<Destination, "id" | "interest"> & Partial<Pick<Destination, "gate">>;

// A jagged torn-paper edge, built as a clip-path polygon.
const TEETH = 14;
const TORN_EDGE_CLIP = (() => {
  const points: string[] = [];
  for (let i = 0; i <= TEETH; i++) {
    const y = (i / TEETH) * 100;
    const x = i % 2 === 0 ? "0%" : "55%";
    points.push(`${x} ${y}%`);
  }
  return `polygon(${points.join(", ")})`;
})();

type Tier2EnquireProps = {
  selectedInterest: string | null;
  destinations: EnquiryOption[];
};

export default function Tier2Enquire({ selectedInterest, destinations }: Tier2EnquireProps) {
  const [cabin, setCabin] = useState<string | null>(selectedInterest);
  const [status, setStatus] = useState<"idle" | "tearing" | "sent">("idle");
  const cardRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const stubRef = useRef<HTMLDivElement>(null);
  const tornEdgeRef = useRef<HTMLDivElement>(null);
  const buttonTextRef = useRef<HTMLSpanElement>(null);
  const confirmedRef = useRef<HTMLDivElement>(null);
  const selectedDestination = useMemo(
    () => destinations.find((destination) => destination.interest === cabin),
    [cabin, destinations]
  );

  useEffect(() => {
    if (selectedInterest) setCabin(selectedInterest);
  }, [selectedInterest]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (status !== "idle") return;
    setStatus("tearing");

    const tl = gsap.timeline();
    if (cardRef.current) {
      tl.to(cardRef.current, { rotation: -0.6, duration: 0.08, ease: "power1.inOut" })
        .to(cardRef.current, { rotation: 0.6, duration: 0.08, ease: "power1.inOut" })
        .to(cardRef.current, { rotation: 0, duration: 0.08, ease: "power1.inOut" });
    }
    if (stubRef.current) {
      tl.to(
        stubRef.current,
        { x: 90, y: 46, rotation: 16, opacity: 0, duration: 0.65, ease: "power2.in" },
        "-=0.05"
      );
    }
    if (tornEdgeRef.current) {
      tl.to(tornEdgeRef.current, { opacity: 1, duration: 0.3 }, "-=0.4");
    }
    if (buttonTextRef.current) {
      tl.to(buttonTextRef.current, { opacity: 0, y: -8, duration: 0.25 }, "-=0.5");
    }
    tl.call(async () => {
      try {
        await submitEnquiry(form, "Tier 2");
        setStatus("sent");
      } catch {
        setStatus("sent");
      }
    });
    if (confirmedRef.current) {
      tl.fromTo(confirmedRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
    }
  };

  return (
    <section id="tier2-enquire" data-tier2-stop="tier2-enquire" className="relative min-h-[100svh] w-full flex items-center justify-center px-4 sm:px-6 pt-16 pb-[calc(env(safe-area-inset-bottom)+104px)] sm:py-24">
      <div data-stop-text className="w-full max-w-[820px] opacity-0">
        <div className="text-center mb-7 sm:mb-9">
          <div className="text-[9px] sm:text-[10.5px] tracking-[0.3em] sm:tracking-[0.4em] uppercase text-gold-light">Journey's end</div>
          <h2 className="mt-3 sm:mt-4 font-serif font-light text-white text-[clamp(34px,12vw,58px)] leading-[1.08]">
            Get in touch,<br className="sm:hidden" /> <span className="italic text-gold-light">we'll draw the route</span>
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <input type="hidden" name="interest" value={cabin || "To be arranged"} />
          {/* boarding pass */}
          <div ref={cardRef} className="relative flex flex-col sm:flex-row rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,.5)] sm:shadow-[0_30px_80px_rgba(0,0,0,.55)]">
          {/* main stub */}
          <div ref={mainRef} className="relative flex-1 bg-cream px-4 py-6 sm:px-9 sm:py-9" style={{ fontFamily: "var(--font-type)" }}>
            <div
              ref={tornEdgeRef}
              aria-hidden="true"
              className="hidden sm:block absolute top-0 right-0 bottom-0 w-4 bg-cream opacity-0"
              style={{ clipPath: TORN_EDGE_CLIP, transform: "translateX(2px)" }}
            />
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[8px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.35em] uppercase text-navy/50">The Retreat Collection</div>
                <div className="mt-1 text-[15px] sm:text-[17px] tracking-[0.1em] uppercase text-navy font-bold">Boarding Pass</div>
              </div>
              {/* No static plane icon on the card — the flight path's own
                  animated plane is the only plane, and this empty slot on
                  the BOARDING PASS header line is exactly where it lands
                  (data-flight-node is read directly by Tier2FlightPath). */}
              <div data-flight-node aria-hidden="true" className="h-6 w-6 shrink-0 sm:h-[26px] sm:w-[26px]" />
            </div>

            <div className="mt-6 sm:mt-7 flex items-center gap-2.5 sm:gap-3">
              <div>
                <div className="text-[8px] sm:text-[9px] tracking-[0.18em] sm:tracking-[0.25em] uppercase text-navy/45">From</div>
                <div className="mt-1 text-[20px] sm:text-[26px] tracking-[0.04em] sm:tracking-[0.05em] text-navy">HERE</div>
              </div>
              <div className="flex-1 h-px bg-navy/20 relative top-3.5 mx-1">
                <div className="absolute -top-[3px] right-0 w-0 h-0" style={{ borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: "6px solid rgba(22,36,60,.4)" }} />
              </div>
              <div className="text-right">
                <div className="text-[8px] sm:text-[9px] tracking-[0.18em] sm:tracking-[0.25em] uppercase text-navy/45">To</div>
                <div className="mt-1 text-[20px] sm:text-[26px] tracking-[0.04em] sm:tracking-[0.05em] text-navy">ANYWHERE</div>
              </div>
            </div>

            <label className="block mt-6 sm:mt-7">
              <div className="text-[8px] sm:text-[9px] tracking-[0.18em] sm:tracking-[0.25em] uppercase text-navy/45">Passenger name</div>
              <input
                name="name"
                type="text"
                placeholder="YOUR NAME"
                required
                autoComplete="name"
                disabled={status !== "idle"}
                className="w-full box-border mt-1.5 sm:mt-2 bg-transparent border-0 border-b border-navy/25 text-navy uppercase tracking-[0.05em] sm:tracking-[0.08em] text-[15px] sm:text-[16px] py-2.5 sm:py-2 outline-none transition-colors duration-300 focus:border-gold placeholder:text-navy/30 disabled:opacity-50"
                style={{ fontFamily: "var(--font-type)" }}
              />
            </label>

            <label className="block mt-5">
              <div className="text-[8px] sm:text-[9px] tracking-[0.18em] sm:tracking-[0.25em] uppercase text-navy/45">Contact email</div>
              <input
                name="email"
                type="email"
                placeholder="you@address.com"
                required
                autoComplete="email"
                disabled={status !== "idle"}
                className="w-full box-border mt-1.5 sm:mt-2 bg-transparent border-0 border-b border-navy/25 text-navy tracking-[0.01em] sm:tracking-[0.03em] text-[15px] sm:text-[16px] py-2.5 sm:py-2 outline-none transition-colors duration-300 focus:border-gold placeholder:text-navy/30 disabled:opacity-50"
                style={{ fontFamily: "var(--font-type)" }}
              />
            </label>

            <div className="mt-6 text-[8px] sm:text-[9px] tracking-[0.18em] sm:tracking-[0.25em] uppercase text-navy/45">Cabin — where to</div>
            <div className="mt-2.5 grid max-h-44 grid-cols-1 gap-2 overflow-y-auto overscroll-contain rounded-sm border border-navy/10 bg-white/20 p-2 min-[380px]:grid-cols-2 sm:max-h-none sm:flex sm:flex-wrap sm:overflow-visible sm:border-0 sm:bg-transparent sm:p-0">
              {destinations.map((destination) => (
                <button
                  key={destination.id}
                  type="button"
                  disabled={status !== "idle"}
                  onClick={() => setCabin(destination.interest === cabin ? null : destination.interest)}
                  className={`min-h-11 break-words text-[8.5px] leading-snug sm:text-[9.5px] tracking-[0.08em] sm:tracking-[0.15em] uppercase px-2.5 sm:px-3.5 py-2 border transition-colors duration-200 disabled:opacity-50 ${
                    cabin === destination.interest ? "border-gold bg-gold/10 text-navy" : "border-navy/20 text-navy/60 hover:border-navy/40"
                  }`}
                  style={{ fontFamily: "var(--font-type)" }}
                >
                  {destination.interest}
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
            <div className="absolute -left-2.5 -top-2.5 w-5 h-5 rounded-full bg-ink" />
            <div className="absolute -right-2.5 -top-2.5 w-5 h-5 rounded-full bg-ink" />
          </div>

          {/* stub */}
          <div ref={stubRef} className="relative w-full sm:w-[210px] bg-cream-deep px-4 py-5 sm:px-6 sm:py-9 flex flex-col justify-between" style={{ fontFamily: "var(--font-type)" }}>
            <div>
              <div className="grid grid-cols-3 gap-3 sm:block">
                <div>
                  <div className="text-[8px] sm:text-[9px] tracking-[0.18em] sm:tracking-[0.25em] uppercase text-navy/45">Flight</div>
                  <div className="mt-1 text-[13px] sm:text-[15px] tracking-[0.06em] sm:tracking-[0.08em] text-navy">TRC · 001</div>
                </div>

                <div>
                  <div className="text-[8px] sm:text-[9px] tracking-[0.18em] sm:tracking-[0.25em] uppercase text-navy/45">Gate</div>
                  <div className="mt-1 text-[13px] sm:text-[14px] text-navy">{selectedDestination?.gate ?? "OPEN"}</div>
                </div>
                <div>
                  <div className="text-[8px] sm:text-[9px] tracking-[0.18em] sm:tracking-[0.25em] uppercase text-navy/45">Seat</div>
                  <div className="mt-1 text-[13px] sm:text-[14px] text-navy">1A</div>
                </div>
              </div>

              <div className="mt-4 sm:mt-4">
                <div className="text-[8px] sm:text-[9px] tracking-[0.18em] sm:tracking-[0.25em] uppercase text-navy/45">Class</div>
                <div className="mt-1 text-[12.5px] sm:text-[13px] text-navy leading-snug">{cabin || "To be arranged"}</div>
              </div>
            </div>

            <div
              className="mt-5 sm:mt-7 h-8 sm:h-9 opacity-70"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #16243c 0px, #16243c 2px, transparent 2px, transparent 4px, #16243c 4px, #16243c 5px, transparent 5px, transparent 8px, #16243c 8px, #16243c 10px, transparent 10px, transparent 11px)"
              }}
            />
          </div>
          </div>

          <button
            type="submit"
            disabled={status !== "idle"}
            className="relative magnetic mt-4 sm:mt-6 w-full bg-gold border-0 text-white text-[10px] sm:text-[11px] tracking-[0.22em] sm:tracking-[0.3em] uppercase py-4.5 sm:py-5 cursor-pointer transition-colors duration-400 hover:bg-[#b08d3f] disabled:cursor-default overflow-hidden"
          >
            <span ref={buttonTextRef} className="inline-block">Confirm enquiry</span>
            <div ref={confirmedRef} className="absolute inset-0 flex items-center justify-center opacity-0">
              Sent — we'll be in touch within 24 hours
            </div>
          </button>
        </form>

        <div className="mt-7 sm:mt-8 pt-5 sm:pt-6 border-t border-white/12 text-center text-[8.5px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.26em] uppercase text-white/35">
          London · Cape Town · Kyoto
        </div>
      </div>
    </section>
  );
}
