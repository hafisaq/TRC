import HoverVideo from "./HoverVideo";
import PlaneTrail from "./PlaneTrail";
import TerrainMotif from "./TerrainMotif";

type Card = {
  slug: string;
  pattern: string;
  caption: string;
  eyebrow: string;
  title: [string, string];
  copy: string;
  biome: "mountain" | "coast" | "desert" | "city";
  coords: string;
};

const CARDS: Card[] = [
  {
    slug: "alpine-ridge",
    pattern: "repeating-linear-gradient(80deg,#dfe0dc 0 3px,#eeefe9 3px 20px)",
    caption: "image · alpine ridge · hover to play",
    eyebrow: "Mountain & ice",
    title: ["High and", "quiet"],
    copy: "Alpine chalets, Patagonian lodges, and the far south when the season allows.",
    biome: "mountain",
    coords: "46.8°N 9.8°E"
  },
  {
    slug: "bali-coast",
    pattern: "repeating-linear-gradient(100deg,#e4ded0 0 3px,#f1eee7 3px 20px)",
    caption: "image · cliff villa, evening",
    eyebrow: "Coast & islands",
    title: ["The warm", "edge"],
    copy: "Private houses on quiet water, from the Aegean to the Andaman Sea.",
    biome: "coast",
    coords: "8.5°S 115.2°E"
  },
  {
    slug: "desert-ruins",
    pattern: "repeating-linear-gradient(120deg,#e8dcc8 0 3px,#f3ece0 3px 20px)",
    caption: "image · desert camp, dusk",
    eyebrow: "Desert & plain",
    title: ["Open", "country"],
    copy: "Mobile camps and long horizons — Namibia, Oman, the Serengeti in green season.",
    biome: "desert",
    coords: "23.4°N 25.7°E"
  },
  {
    slug: "reef-dive",
    pattern: "repeating-linear-gradient(94deg,#e2ded6 0 3px,#efece6 3px 20px)",
    caption: "image · courtyard, old quarter",
    eyebrow: "Cities & culture",
    title: ["Doors that", "open"],
    copy: "Kyoto, Seville, Jaipur — with the rooms, tables and hours other travellers don't get.",
    biome: "city",
    coords: "35.0°N 135.8°E"
  }
];

export default function Destinations() {
  return (
    <section id="destinations" data-pan-wrap className="relative bg-cream">
      <div data-pan-sticky className="lg:sticky lg:top-0 lg:h-screen overflow-hidden">
        <div className="pt-24 sm:pt-28 lg:pt-24 px-5 sm:px-8 lg:px-11 flex justify-between items-baseline relative z-[3] pointer-events-none">
          <div className="relative">
            <div data-eyebrow className="text-[10.5px] tracking-[0.42em] uppercase text-gold-dim">02 — Where we go</div>
            <PlaneTrail
              id="destinations-trail"
              viewBox="0 0 220 40"
              pathD="M4,32 C60,32 90,10 214,8"
              color="#c8a24c"
              planeSize={15}
              className="absolute -top-2 left-0 w-[160px] sm:w-[220px] h-10 opacity-0 pointer-events-none"
            />
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="w-[120px] h-px bg-navy/15"><div data-pan-bar className="h-px w-0 bg-gold" /></div>
            <div data-pan-count className="font-serif text-[15px] tracking-[0.3em] text-navy/45">01 / 04</div>
          </div>
        </div>

        <div
          data-pan-track
          className="lg:absolute lg:top-0 lg:left-0 lg:h-full flex lg:items-center gap-6 sm:gap-8 lg:gap-14 px-5 sm:px-8 lg:px-[clamp(42px,8vw,140px)] pt-8 lg:pt-[132px] pb-7 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none scrollbar-none"
        >
          {CARDS.map((card) => (
            <article
              key={card.slug}
              data-pan-card
              data-media
              data-video-key={card.slug}
              className="relative shrink-0 snap-center w-[86vw] sm:w-[72vw] lg:w-[min(72vw,600px)] h-[62vh] lg:h-full max-h-[560px] lg:max-h-none overflow-hidden bg-[#efece4]"
            >
              <div data-parallax="0.07" data-zoom className="absolute -inset-x-0 -inset-y-[8%] anim-drift" style={{ background: card.pattern }} />
              <HoverVideo slug={card.slug} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(255,255,255,.05),rgba(22,36,60,.58))" }} />
              <TerrainMotif
                biome={card.biome}
                className="absolute top-4 right-4 w-[120px] sm:w-[150px] h-auto text-gold-light/45 pointer-events-none mix-blend-screen"
              />
              <div className="absolute top-5 left-6 font-mono text-[9.5px] tracking-[0.26em] uppercase text-navy/40 hidden sm:block">{card.caption}</div>
              <div className="absolute top-5 right-6 font-mono text-[9px] tracking-[0.2em] uppercase text-white/55 hidden sm:block">{card.coords}</div>
              <div className="absolute left-0 right-0 bottom-0 p-7 sm:p-9 text-white">
                <div className="text-[10px] tracking-[0.36em] uppercase text-gold-light">{card.eyebrow}</div>
                <h3 className="mt-3.5 font-serif font-light text-[clamp(28px,4vw,52px)] leading-[1.04]">
                  {card.title[0]}<br />{card.title[1]}
                </h3>
                <p className="mt-4 max-w-[320px] text-[14.5px] font-light leading-[1.85] text-white/72">{card.copy}</p>
                <a href="#enquire" className="inline-block mt-6 text-[10px] tracking-[0.3em] uppercase text-gold-light border-b border-gold-light/40 pb-1.5">Enquire</a>
              </div>
            </article>
          ))}

          <div className="shrink-0 snap-center w-[80vw] lg:w-[min(50vw,400px)] pr-5 lg:pr-11">
            <p className="m-0 font-serif italic font-light text-[clamp(22px,2.6vw,36px)] leading-[1.5] text-navy/75">
              If it isn't here, we have probably been asked for it before.
            </p>
            <a href="#enquire" className="magnetic inline-flex items-center gap-3.5 mt-8 text-[10.5px] tracking-[0.3em] uppercase text-gold-deep border-b border-gold/45 pb-2 transition-all duration-400 hover:gap-6">
              Ask us <span>→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
