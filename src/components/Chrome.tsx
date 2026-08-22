const SECTIONS = [
  { id: "destinations", label: "Destinations", coords: "36.3°N 25.5°E" },
  { id: "chapters", label: "Chapters", coords: "43.6°N 7.0°E" },
  { id: "film", label: "Film", coords: "8.5°S 115.2°E" },
  { id: "route", label: "Route", coords: "33.9°S 18.4°E" },
  { id: "journey", label: "Journey", coords: "51.5°N 0.1°W" },
  { id: "standard", label: "Standard", coords: "35.0°N 135.8°E" },
  { id: "enquire", label: "Enquire", coords: "—" }
];

export default function Chrome() {
  return (
    <>
      <div
        id="scrim"
        className="fixed top-0 left-0 right-0 h-[150px] z-40 pointer-events-none opacity-0 transition-opacity duration-500"
        style={{ background: "linear-gradient(180deg,rgba(10,16,28,.5),rgba(10,16,28,0))" }}
      />
      <div
        id="progress-bar"
        className="fixed top-0 left-0 h-[2px] w-0 z-[60]"
        style={{ background: "linear-gradient(90deg,rgba(200,162,76,0),var(--color-gold))" }}
      />

      <nav
        id="section-index"
        className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3.5 pl-4 opacity-0 transition-opacity duration-500 pointer-events-none"
      >
        <div
          className="absolute left-0 top-1 bottom-1 w-px"
          style={{
            background:
              "repeating-linear-gradient(to bottom, rgba(200,162,76,.4) 0 3px, transparent 3px 8px)"
          }}
        />

        <div
          id="index-plane"
          className="absolute left-0 z-10 -translate-x-1/2 -translate-y-1/2"
          style={{ top: 0, transition: "top 0.5s cubic-bezier(0.4,0,0.2,1)" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" style={{ transform: "rotate(90deg)" }}>
            <path
              d="M21,16V14L13,9V3.5C13,2.67 12.33,2 11.5,2C10.67,2 10,2.67 10,3.5V9L2,14V16L10,13.5V19L7.5,20.5V22L11.5,21L15.5,22V20.5L13,19V13.5L21,16Z"
              fill="#c8a24c"
            />
          </svg>
        </div>

        {SECTIONS.map((s) => (
          <div key={s.id} data-idx={s.id} data-coords={s.coords} className="relative flex items-center gap-2.5">
            <span className="idx-line w-4 h-px bg-navy/25 transition-all duration-500" />
            <span className="idx-label font-mono text-[8.5px] tracking-[0.22em] uppercase text-navy/35 transition-colors duration-500">
              {s.label}
            </span>
          </div>
        ))}

        <div
          id="index-coords"
          className="absolute left-0 -bottom-7 font-mono text-[7.5px] tracking-[0.14em] text-gold-dim/80 whitespace-nowrap"
        >
          36.3°N 25.5°E
        </div>
      </nav>
    </>
  );
}
