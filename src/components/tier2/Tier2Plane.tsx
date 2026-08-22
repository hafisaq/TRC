export default function Tier2Plane() {
  return (
    <div id="tier2-center-plane" className="fixed top-[46%] left-1/2 z-[5] pointer-events-none opacity-0">
      <svg width="160" height="70" viewBox="0 0 160 70" className="absolute right-[18px] top-1/2 -translate-y-1/2 overflow-visible" fill="none">
        <path
          id="tier2-plane-squiggle"
          d="M0,35 C30,10 50,55 80,32 C100,17 110,42 140,28"
          stroke="#e3c682"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeDasharray="1 6"
          opacity="0.55"
        />
      </svg>

      <svg width="52" height="52" viewBox="0 0 24 24" style={{ transform: "rotate(90deg)" }}>
        <path
          id="tier2-plane-icon"
          fill="#e3c682"
          d="M21,16V14L13,9V3.5C13,2.67 12.33,2 11.5,2C10.67,2 10,2.67 10,3.5V9L2,14V16L10,13.5V19L7.5,20.5V22L11.5,21L15.5,22V20.5L13,19V13.5L21,16Z"
        />
      </svg>

      <div id="tier2-plane-pulse" className="absolute left-1/2 top-full -translate-x-1/2 mt-4 flex flex-col items-center opacity-0">
        <span className="relative w-2.5 h-2.5">
          <span id="tier2-plane-pulse-glow" className="absolute inset-0 rounded-full bg-gold-light" />
          <span id="tier2-plane-pulse-ring" className="absolute inset-0 rounded-full border border-gold-light" />
        </span>
        <span
          id="tier2-plane-pulse-coords"
          className="mt-3 whitespace-nowrap font-mono text-[10px] tracking-[0.25em] text-gold-light"
        />
      </div>
    </div>
  );
}
