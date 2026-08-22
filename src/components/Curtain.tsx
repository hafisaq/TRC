export default function Curtain() {
  return (
    <div id="curtain" className="fixed inset-0 z-[100] bg-ink flex flex-col items-center justify-center gap-5">
      <div className="w-11 h-11 rounded-full border border-gold/70 grid place-items-center">
        <div id="curtain-dot" className="w-2 h-2 rounded-full bg-gold" />
      </div>
      <div className="font-serif text-white/80 tracking-[0.5em] text-[11px] uppercase">The Retreat Collection</div>
    </div>
  );
}
