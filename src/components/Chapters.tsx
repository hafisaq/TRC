import PlaneTrail from "./PlaneTrail";

type Chapter = {
  slug: string;
  roman: string;
  title: [string, string];
  copy: string;
};

const CHAPTERS: Chapter[] = [
  {
    slug: "chapter-greenery",
    roman: "Chapter i",
    title: ["Deeper into", "the green"],
    copy: "A remote crossing on foot, guided by people who grew up reading this particular forest."
  },
  {
    slug: "chapter-lake",
    roman: "Chapter ii",
    title: ["A single figure,", "a great deal of water"],
    copy: "Mornings on lakes that don't appear on the tourist maps, with nobody else on the shoreline."
  },
  {
    slug: "chapter-sanctuary",
    roman: "Chapter iii",
    title: ["Light, held still", "in old stone"],
    copy: "The quiet interiors nobody rushes you through — arranged for an hour that belongs to you alone."
  }
];

export default function Chapters() {
  return (
    <section id="chapters" data-chapters-wrap className="relative bg-ink" style={{ height: "340vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {CHAPTERS.map((c, i) => (
          <div key={c.slug} data-chapter-bg={c.slug} className="absolute inset-0" style={{ opacity: i === 0 ? 1 : 0 }}>
            <video muted loop playsInline preload="none" poster={`/media/poster/${c.slug}.jpg`} className="absolute inset-0 w-full h-full object-cover">
              <source data-src={`/media/video/${c.slug}.mp4`} type="video/mp4" />
            </video>
          </div>
        ))}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.15) 45%,rgba(0,0,0,.6))" }} />

        <div className="absolute top-24 left-5 sm:left-8 lg:left-11 right-5 sm:right-8 lg:right-11 flex justify-between items-baseline text-white/60">
          <div className="relative inline-block">
            <div className="text-[10.5px] tracking-[0.42em] uppercase text-gold-light/85">03 — Chapters</div>
            <PlaneTrail
              id="chapters-trail"
              viewBox="0 0 220 40"
              pathD="M4,30 C60,30 90,8 214,10"
              color="#e3c682"
              planeSize={15}
              className="absolute -top-2 left-0 w-[160px] sm:w-[200px] h-10 opacity-0 pointer-events-none"
            />
          </div>
          <div data-chapter-count className="font-serif text-[15px] tracking-[0.3em]">01 / 03</div>
        </div>

        <div className="relative h-full flex items-center px-5 sm:px-8 lg:px-11">
          {CHAPTERS.map((c, i) => (
            <div
              key={c.slug}
              data-chapter-caption={c.slug}
              className={i === 0 ? "max-w-[640px] text-white" : "absolute max-w-[640px] text-white"}
              style={{ opacity: i === 0 ? 1 : 0 }}
            >
              <div className="text-[10px] tracking-[0.36em] uppercase text-gold-light">{c.roman}</div>
              <h3 className="mt-5 font-serif font-light text-[clamp(34px,5vw,68px)] leading-[1.04]">
                {c.title[0]}<br />{c.title[1]}
              </h3>
              <p className="mt-5 max-w-[440px] text-[15px] font-light leading-[1.85] text-white/72">{c.copy}</p>
            </div>
          ))}
        </div>

        <div className="absolute bottom-10 left-5 sm:left-8 lg:left-11 right-5 sm:right-8 lg:right-11">
          <div className="h-px bg-white/20"><div data-chapter-bar className="h-px w-0 bg-gold" /></div>
        </div>
      </div>
    </section>
  );
}
