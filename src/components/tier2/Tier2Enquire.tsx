export default function Tier2Enquire() {
  return (
    <section id="tier2-enquire" data-tier2-stop="tier2-enquire" className="relative min-h-[100svh] w-full flex items-center justify-center px-6 py-24">
      <div data-stop-text className="max-w-[560px] text-center opacity-0">
        <div className="text-[10.5px] tracking-[0.4em] uppercase text-gold-light">Journey's end</div>
        <h2 className="mt-5 font-serif font-light text-white text-[clamp(34px,6vw,74px)] leading-[1.05]">
          Get in touch,<br /><span className="italic text-gold-light">we'll draw the route</span>
        </h2>
        <p className="mt-6 text-[15px] font-light leading-[1.9] text-white/60">
          Tell us where you'd rather be. We take a limited number of journeys each season, and every itinerary is quoted as it is built.
        </p>
        <a
          href="mailto:hello@theretreatcollection.com"
          className="magnetic inline-block mt-9 bg-gold text-white font-sans text-[11px] tracking-[0.3em] uppercase px-10 py-5 transition-colors duration-400 hover:bg-[#b08d3f]"
        >
          Send an enquiry
        </a>
        <div className="mt-10 pt-6 border-t border-white/12 text-[10px] tracking-[0.26em] uppercase text-white/35">
          London · Cape Town · Kyoto
        </div>
      </div>
    </section>
  );
}
