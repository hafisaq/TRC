export default function Testimonial() {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 px-5 sm:px-8 lg:px-11 bg-white overflow-hidden">
      <div className="max-w-[1000px] mx-auto text-center relative">
        <div data-quote-mark className="pointer-events-none select-none absolute left-1/2 -translate-x-1/2 -top-6 sm:-top-10 font-serif text-[180px] sm:text-[260px] leading-none text-gold/10 opacity-0 scale-75">
          &ldquo;
        </div>
        <div data-reveal className="relative">
          <div data-eyebrow data-reveal-line className="text-[10.5px] tracking-[0.42em] uppercase text-gold-dim">In their words</div>
          <p data-split className="mt-8 font-serif font-light italic text-[clamp(22px,3.4vw,50px)] leading-[1.4] text-pretty">
            We have travelled well before. This was the first time nobody had to ask us a single question once we landed.
          </p>
          <div data-reveal-line className="mt-8 text-[10.5px] tracking-[0.3em] uppercase text-navy/45">Guest · Kyoto &amp; Hokkaido, March 2026</div>
        </div>
      </div>
    </section>
  );
}
