import { useState } from "react";
import type { CatalogGroup } from "../../data/regions/types";

type Tier2CollectionGridProps = {
  id: string;
  catalog: CatalogGroup[];
  index: number;
  total: number;
  eyebrow: string;
  heading: [string, string];
  intro: string;
};

// The lightweight top-level overview (continents on the main site) — one
// featured stay + a compact ledger per group. Deliberately NOT the rich
// per-property story reel (Tier2Collection) used on region pages; that's
// far too much scroll depth for a "here's the wider portfolio" glance.
export default function Tier2CollectionGrid({ id, catalog, index, total, eyebrow, heading, intro }: Tier2CollectionGridProps) {
  const [activeGroup, setActiveGroup] = useState(catalog[0].id);
  const group = catalog.find((g) => g.id === activeGroup) ?? catalog[0];
  const [featured, ...rest] = group.entries;

  return (
    <section
      id={id}
      data-tier2-stop={id}
      data-stop-theme="white"
      className="relative w-full py-20 sm:py-28 px-5 sm:px-10 lg:px-16 overflow-hidden"
    >
      <div className="max-w-[1200px] mx-auto">
        <div data-stop-text className="opacity-0">
          <div className="font-mono text-[8.5px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.3em] text-gold-light">
            {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")} · {eyebrow}
          </div>
          <h2 data-stop-title className="mt-3 sm:mt-4 font-serif font-light text-white text-[clamp(34px,10vw,64px)] leading-[1.02]">
            {heading[0]}<br />{heading[1]}
          </h2>
          <p className="mt-4 sm:mt-5 max-w-[560px] text-[13.5px] sm:text-[14.5px] font-light leading-[1.75] sm:leading-[1.9] text-white/70">
            {intro}
          </p>
        </div>

        <div className="mt-9 sm:mt-11 flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-1">
          {catalog.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setActiveGroup(g.id)}
              className={`shrink-0 px-4 py-2 text-[9px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.2em] uppercase border transition-colors ${
                g.id === activeGroup
                  ? "border-gold/60 bg-gold/10 text-gold-light"
                  : "border-white/15 text-white/55 hover:text-white/85 hover:border-white/30"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-6 sm:gap-8 items-start">
          {/* the featured stay for this group — larger, editorial treatment */}
          <div className="group relative aspect-[4/5] sm:aspect-[16/11] overflow-hidden rounded-lg border border-white/10">
            <img
              src={featured.poster}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(0deg,rgba(14,13,12,.92) 0%,rgba(14,13,12,.25) 45%,rgba(14,13,12,.15) 100%)" }}
            />
            <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[9px] tracking-[0.16em] uppercase text-white/85">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              {group.label}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              <div className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-gold-light/85">{featured.location}</div>
              <div className="mt-2 font-serif font-light text-white text-[26px] sm:text-[34px] leading-[1.05]">
                {featured.name}
              </div>
              <a
                href={featured.brochureUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-3 text-[9px] tracking-[0.2em] uppercase text-white border-b border-white/40 pb-1"
              >
                Download Brochure
              </a>
            </div>
          </div>

          {/* the rest — a compact ledger, so a group with many stays still reads cleanly */}
          <div className="flex flex-col divide-y divide-white/10 border-t border-white/10 lg:max-h-[420px] lg:overflow-y-auto">
            {rest.length === 0 && (
              <p className="py-6 text-[12px] text-white/40 italic">More stays in {group.label} coming soon.</p>
            )}
            {rest.map((entry, i) => (
              <a
                key={entry.name}
                href={entry.brochureUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 sm:gap-4 py-4 hover:bg-white/[0.03] transition-colors"
              >
                <span className="shrink-0 w-5 font-mono text-[10px] sm:text-[11px] text-gold-light/60">
                  {String(i + 2).padStart(2, "0")}
                </span>
                <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden">
                  <img
                    src={entry.poster}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[8.5px] tracking-[0.15em] uppercase text-gold-light/70 truncate">{entry.location}</div>
                  <div className="mt-0.5 font-serif font-light text-white text-[16px] sm:text-[18px] leading-[1.1] truncate">
                    {entry.name}
                  </div>
                </div>
                <span className="shrink-0 text-[8.5px] tracking-[0.16em] uppercase text-white/50 border-b border-white/25 pb-0.5 transition-colors group-hover:text-white group-hover:border-white/50">
                  Brochure
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
