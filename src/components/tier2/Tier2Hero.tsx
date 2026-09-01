import { t } from "../../lib/i18n";

export default function Tier2Hero() {
  return (
    <section id="tier2-hero" className="relative h-[92svh] min-h-[640px] sm:h-[100svh] sm:min-h-0 w-full flex flex-col items-center justify-center text-center px-5 pt-[calc(env(safe-area-inset-top)+64px)] pb-[calc(env(safe-area-inset-bottom)+84px)] sm:pt-0 sm:pb-0">
      <div id="tier2-emblem" className="relative w-20 h-20 sm:w-28 sm:h-28 scale-90 rounded-full border border-gold/70 grid place-items-center opacity-0">
        <div className="absolute inset-2 rounded-full border border-gold/25 anim-ring" />
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gold" />
      </div>

      <h1
        id="tier2-title"
        className="mt-7 sm:mt-8 translate-y-4 font-serif font-light text-white text-[clamp(44px,16vw,120px)] leading-[0.95] tracking-[0.02em] opacity-0"
      >
        The Retreat
      </h1>
      <div id="tier2-subtitle" className="mt-4 sm:mt-5 flex items-center gap-3 sm:gap-4 opacity-0">
        <span className="w-8 sm:w-10 h-px bg-gold/60" />
        <span className="text-[10px] sm:text-[13px] tracking-[0.38em] sm:tracking-[0.5em] uppercase text-gold-light">Collection</span>
        <span className="w-8 sm:w-10 h-px bg-gold/60" />
      </div>

      <p id="tier2-kicker" className="mt-8 sm:mt-9 max-w-[300px] sm:max-w-[420px] text-[11px] sm:text-[14px] font-light leading-[1.9] tracking-[0.06em] sm:tracking-[0.08em] uppercase text-white/50 opacity-0">
        {t("hero.kicker")}
      </p>

      <div className="absolute left-0 right-0 bottom-8 sm:bottom-10 flex flex-col items-center gap-3 text-white/50">
        <div className="text-[8.5px] sm:text-[9px] tracking-[0.34em] sm:tracking-[0.4em] uppercase">{t("hero.scroll")}</div>
        <div className="w-px h-10 sm:h-12" style={{ background: "linear-gradient(180deg,rgba(255,255,255,.6),rgba(255,255,255,0))" }} />
      </div>
    </section>
  );
}
