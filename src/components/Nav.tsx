export default function Nav() {
  return (
    <header
      id="nav"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 sm:px-8 lg:px-11 py-5 lg:py-6 whitespace-nowrap text-navy border-b border-transparent"
    >
      <a href="#top" className="relative flex items-center mr-6 lg:mr-10">
        <div id="nav-brand-mark" className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full border border-gold grid place-items-center shrink-0">
            <div id="nav-dot" className="w-1.5 h-1.5 rounded-full bg-gold" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="font-serif text-[17px] sm:text-[19px] tracking-[0.3em] uppercase leading-none">The Retreat</div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-px bg-gold" />
              <span className="text-[8px] tracking-[0.44em] uppercase text-gold-dim">Collection</span>
              <span className="w-6 h-px bg-gold/45" />
            </div>
          </div>
        </div>
        <img
          id="nav-brand-logo"
          src="/media/brand/retreat-collection-logo-crop.png"
          alt="The Retreat Collection"
          className="absolute left-0 top-1/2 -translate-y-1/2 h-8 sm:h-9 w-auto opacity-0 pointer-events-none"
        />
      </a>
      <nav className="hidden md:flex items-center gap-[clamp(16px,2.2vw,34px)] text-[10.5px] tracking-[0.24em] uppercase font-light whitespace-nowrap">
        <a href="#destinations" className="nav-link text-inherit opacity-90 hover:opacity-100 transition-opacity">Destinations</a>
        <a href="#chapters" className="nav-link text-inherit opacity-90 hover:opacity-100 transition-opacity">Chapters</a>
        <a href="#film" className="nav-link text-inherit opacity-90 hover:opacity-100 transition-opacity">Film</a>
        <a href="#route" className="nav-link text-inherit opacity-90 hover:opacity-100 transition-opacity">The Route</a>
        <a href="#journey" className="nav-link text-inherit opacity-90 hover:opacity-100 transition-opacity">How we travel</a>
        <a href="#standard" className="nav-link text-inherit opacity-90 hover:opacity-100 transition-opacity">Our standard</a>
        <a id="nav-cta" href="#enquire" className="border border-gold text-gold-deep px-5 py-2.5 tracking-[0.28em] transition-colors duration-400 hover:bg-gold hover:text-white">Enquire</a>
      </nav>
    </header>
  );
}
