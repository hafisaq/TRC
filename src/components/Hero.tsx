import PlaneTrail from "./PlaneTrail";

export default function Hero() {
  return (
    <section id="hero" className="relative h-[100svh] w-full overflow-hidden bg-ink">
      <div id="hero-letterbox-top" className="absolute top-0 left-0 right-0 h-1/2 bg-ink z-20 origin-top" />
      <div id="hero-letterbox-bottom" className="absolute bottom-0 left-0 right-0 h-1/2 bg-ink z-20 origin-bottom" />
      <PlaneTrail
        id="hero-trail"
        viewBox="0 0 800 500"
        pathD="M55,48 C260,120 380,360 560,300 C660,270 720,140 770,60"
        color="#e3c682"
        planeSize={24}
        className="absolute inset-0 w-full h-full z-[6] pointer-events-none opacity-0"
      />
      <div id="hero-media" className="absolute inset-0 will-change-transform">
        <video
          id="hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/media/poster/hero-forest-road.jpg"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/media/video/hero-forest-road.mp4" type="video/mp4" />
        </video>
      </div>
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg,rgba(0,0,0,.32) 0%,rgba(0,0,0,.12) 42%,rgba(0,0,0,.62) 100%)" }}
      />
      <div className="hero-grid absolute inset-0 pointer-events-none" />
      <div id="hero-veil" className="absolute inset-0 bg-white opacity-0 pointer-events-none" />

      <div className="absolute inset-x-0 top-[24vh] z-10 px-5 sm:px-8 lg:px-11 text-white pointer-events-none">
        <div data-hero-kicker className="max-w-[260px] font-serif italic text-[15px] sm:text-[17px] leading-[1.45] text-white/86">
          Luxury and quiet adventure, arranged far from the obvious route.
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-[14vh] z-10 px-5 sm:px-8 lg:px-11 text-white pointer-events-none">
        <div data-hero-title className="relative mx-auto max-w-[880px] text-center">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center text-[10px] tracking-[0.48em] uppercase text-gold-light">
            <span className="hidden sm:block h-px bg-gold-light/65" />
            <span>The Collection</span>
            <span className="hidden sm:block h-px bg-gold-light/65" />
          </div>
          <p className="mx-auto mt-5 max-w-[560px] text-[12px] sm:text-[13px] leading-[1.9] font-light tracking-[0.16em] uppercase text-white/72">
            Private journeys through coast, high country, old cities and long desert roads
          </p>
        </div>
      </div>

      <div className="absolute left-0 right-0 bottom-9 flex flex-col items-center gap-3.5 text-white">
        <div className="text-[9.5px] tracking-[0.42em] uppercase text-white/72">Scroll</div>
        <div className="w-px h-14" style={{ background: "linear-gradient(180deg,rgba(255,255,255,.75),rgba(255,255,255,0))" }} />
      </div>
    </section>
  );
}
