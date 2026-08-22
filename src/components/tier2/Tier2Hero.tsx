import PlaneTrail from "../PlaneTrail";

export default function Tier2Hero() {
  return (
    <section className="relative h-[100svh] w-full flex flex-col items-center justify-center text-center px-6">
      <PlaneTrail
        id="tier2-hero-trail"
        viewBox="0 0 900 500"
        pathD="M40,420 C260,340 340,140 460,180 C600,225 680,110 860,60"
        color="#e3c682"
        planeSize={28}
        className="absolute inset-0 w-full h-full z-[1] pointer-events-none opacity-0"
      />

      <div id="tier2-emblem" className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-gold/70 grid place-items-center opacity-0">
        <div className="absolute inset-2 rounded-full border border-gold/25 anim-ring" />
        <div className="w-2.5 h-2.5 rounded-full bg-gold" />
      </div>

      <h1
        id="tier2-title"
        className="mt-8 font-serif font-light text-white text-[clamp(40px,9vw,120px)] leading-[0.95] tracking-[0.02em] opacity-0"
      >
        The Retreat
      </h1>
      <div id="tier2-subtitle" className="mt-5 flex items-center gap-4 opacity-0">
        <span className="w-10 h-px bg-gold/60" />
        <span className="text-[11px] sm:text-[13px] tracking-[0.5em] uppercase text-gold-light">Collection</span>
        <span className="w-10 h-px bg-gold/60" />
      </div>

      <p id="tier2-kicker" className="mt-9 max-w-[420px] text-[13px] sm:text-[14px] font-light leading-[1.9] tracking-[0.08em] uppercase text-white/45 opacity-0">
        An itinerary, mapped — scroll to follow the route
      </p>

      <div className="absolute left-0 right-0 bottom-10 flex flex-col items-center gap-3 text-white/50">
        <div className="text-[9px] tracking-[0.4em] uppercase">Scroll</div>
        <div className="w-px h-12" style={{ background: "linear-gradient(180deg,rgba(255,255,255,.6),rgba(255,255,255,0))" }} />
      </div>
    </section>
  );
}
