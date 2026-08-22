type Stop = {
  key: string;
  roman: string;
  label: string;
  title: [string, string];
  copy: string;
  pin: [number, number];
};

const STOPS: Stop[] = [
  {
    key: "departure",
    roman: "I",
    label: "Departure",
    title: ["Before first light,", "the runway"],
    copy: "Cape Town before dawn, bags already gone ahead, nothing left to decide.",
    pin: [130, 330]
  },
  {
    key: "coast",
    roman: "II",
    label: "The coast road",
    title: ["Miles of coastline,", "not another car"],
    copy: "The long empty road between camps, kept exactly that way on purpose.",
    pin: [380, 190]
  },
  {
    key: "camp",
    roman: "III",
    label: "Camp",
    title: ["Canvas walls,", "no signal"],
    copy: "A fire, a folding chair, and the kind of dark that has actual stars in it.",
    pin: [650, 350]
  },
  {
    key: "home",
    roman: "IV",
    label: "Home",
    title: ["The notes,", "filed away"],
    copy: "Where this journey ends and the next one quietly begins.",
    pin: [890, 160]
  }
];

const ROUTE_PATH = "M130,330 C230,240 300,160 380,190 C480,230 560,380 650,350 C740,320 800,140 890,160";

export default function RouteMap() {
  return (
    <section id="route" data-route-wrap className="relative bg-ink" style={{ height: "340vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 62% 45%, rgba(200,162,76,.10), transparent 60%)" }}
        />

        <svg
          data-route-map
          viewBox="0 0 1000 600"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <filter id="route-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#c8a24c" floodOpacity="0.55" />
            </filter>
            <filter id="pin-glow" x="-150%" y="-150%" width="400%" height="400%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#c8a24c" floodOpacity="0.65" />
            </filter>
          </defs>

          <g id="route-focus-group" data-route-focus>
            <g stroke="#ffffff" strokeOpacity="0.05">
              {[100, 200, 300, 400, 500].map((y) => (
                <line key={`h${y}`} x1="0" y1={y} x2="1000" y2={y} strokeDasharray="2 6" />
              ))}
              {[150, 350, 550, 750, 950].map((x) => (
                <line key={`v${x}`} x1={x} y1="0" x2={x} y2="600" strokeDasharray="2 6" />
              ))}
            </g>

            <path
              d="M20,460 C180,410 260,480 420,440 C570,400 630,470 800,430 C880,410 930,450 980,420"
              stroke="#ffffff"
              strokeOpacity="0.14"
              strokeWidth="1.5"
              fill="none"
            />

            <path
              id="route-line-path"
              data-route-path
              d={ROUTE_PATH}
              stroke="#c8a24c"
              strokeWidth="1.5"
              strokeDasharray="1 7"
              fill="none"
              filter="url(#route-glow)"
            />

            {STOPS.map((s) => (
              <g key={s.key} data-route-pin={s.key} transform={`translate(${s.pin[0]} ${s.pin[1]})`} filter="url(#pin-glow)">
                <circle r="10" fill="none" stroke="#c8a24c" strokeOpacity="0.55" />
                <circle r="3" fill="#c8a24c" />
              </g>
            ))}

            <g id="route-plane" data-route-plane>
              <g transform="rotate(90 12 12) translate(-9 -9) scale(0.75)">
                <path
                  d="M21,16V14L13,9V3.5C13,2.67 12.33,2 11.5,2C10.67,2 10,2.67 10,3.5V9L2,14V16L10,13.5V19L7.5,20.5V22L11.5,21L15.5,22V20.5L13,19V13.5L21,16Z"
                  fill="#e3c682"
                />
              </g>
            </g>
          </g>

          <g transform="translate(900 90)" stroke="#ffffff" strokeOpacity="0.35" fill="none">
            <circle r="34" />
            <line x1="0" y1="-34" x2="0" y2="-26" />
            <line x1="0" y1="34" x2="0" y2="26" />
            <line x1="-34" y1="0" x2="-26" y2="0" />
            <line x1="34" y1="0" x2="26" y2="0" />
            <line
              id="route-compass-needle"
              x1="0"
              y1="-22"
              x2="0"
              y2="14"
              stroke="#c8a24c"
              strokeOpacity="0.85"
              strokeWidth="1.5"
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
          </g>
        </svg>

        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg,rgba(0,0,0,.45),rgba(0,0,0,.08) 35%,rgba(0,0,0,.55))" }}
        />

        <div className="absolute top-24 left-5 sm:left-8 lg:left-11 right-5 sm:right-8 lg:right-11 flex justify-between items-baseline text-white/60">
          <div className="text-[10.5px] tracking-[0.42em] uppercase text-gold-light/85">05 — The Route</div>
          <div data-route-count className="font-serif text-[15px] tracking-[0.3em]">01 / 04</div>
        </div>

        <div className="relative h-full flex items-center px-5 sm:px-8 lg:px-11">
          {STOPS.map((s, i) => (
            <div
              key={s.key}
              data-route-caption={s.key}
              className={`${i === 0 ? "" : "absolute"} max-w-[560px] text-white`}
              style={{ opacity: i === 0 ? 1 : 0, transform: `translateY(${i === 0 ? 0 : 64}px)` }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none select-none absolute -right-4 sm:-right-16 top-1/2 -translate-y-1/2 font-serif text-[140px] sm:text-[220px] leading-none text-gold/[.08]"
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="relative text-[10px] tracking-[0.36em] uppercase text-gold-light">{`Waypoint ${s.roman} — ${s.label}`}</div>
              <h3 className="relative mt-5 font-serif font-light text-[clamp(30px,4.6vw,58px)] leading-[1.06]">
                {s.title[0]}<br />{s.title[1]}
              </h3>
              <p className="relative mt-5 max-w-[420px] text-[15px] font-light leading-[1.85] text-white/72">{s.copy}</p>
            </div>
          ))}
        </div>

        <div className="absolute bottom-10 left-5 sm:left-8 lg:left-11 right-5 sm:right-8 lg:right-11">
          <div className="h-px bg-white/20"><div data-route-bar className="h-px w-0 bg-gold" /></div>
        </div>
      </div>
    </section>
  );
}
