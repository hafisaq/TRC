import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CatalogEntry, CatalogGroup, PropertyAsset, PropertyFact } from "../../data/regions/types";

type Tier2CollectionProps = {
  id: string;
  catalog: CatalogGroup[];
  index: number;
  total: number;
  eyebrow: string;
  heading: [string, string];
  intro: string;
  onEnquire?: (interest: string) => void;
};

type StoryMoment = {
  id: string;
  entry: CatalogEntry;
  label: string;
  eyebrow: string;
  title: string;
  copy: string;
  poster: string;
  video: string;
  gallery: string[];
  facts: PropertyFact[];
  materials: PropertyAsset[];
  notes: Array<{ label: string; text: string }>;
  kind: "film" | "gallery" | "detail";
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function videoFromPoster(poster: string) {
  return poster.replace("/media/poster/", "/media/video/").replace(/\.(jpg|jpeg|png|webp)$/i, ".mp4");
}

function galleryFor(entry: CatalogEntry) {
  return entry.gallery?.length ? entry.gallery : [entry.poster];
}

function factsFor(entry: CatalogEntry, group: CatalogGroup): PropertyFact[] {
  if (entry.facts?.length) return entry.facts;
  return [
    { label: "Location", value: entry.location },
    { label: "Country", value: group.label },
    { label: "Season", value: entry.season ?? "On request" },
    { label: "Best for", value: "Couples, families, private groups" }
  ];
}

function materialCopy(entry: CatalogEntry) {
  if (!entry.assets?.length) {
    return "The advisor note can hold brochure highlights, rate cues, sales angles, and the client-ready details without turning the page into a file browser.";
  }

  const names = entry.assets
    .slice(0, 4)
    .map((asset) => asset.label ?? asset.category)
    .join(", ");
  return `The advisor pack is folded into the story: ${names.toLowerCase()}, plus the notes needed before an enquiry is sent.`;
}

function experienceCopy(entry: CatalogEntry) {
  const highlights = entry.highlights?.length ? entry.highlights : ["private arrival", "slow mornings", "quiet routing"];
  return `The day is shaped around ${highlights[0].toLowerCase()} and ${highlights[1]?.toLowerCase() ?? "unhurried time"}, with enough structure for the client to understand the stay and enough space for it to feel private.`;
}

function buildMoments(group: CatalogGroup): StoryMoment[] {
  return group.entries.flatMap((entry, entryIndex) => {
    const gallery = galleryFor(entry);
    const facts = factsFor(entry, group);
    const materials = entry.assets ?? [];
    const season = entry.season ?? "Season on request";
    const bestFor = facts.find((fact) => fact.label.toLowerCase().includes("best"))?.value ?? "Private travellers";
    const arrival = facts.find((fact) => fact.label.toLowerCase().includes("arrival"))?.value ?? "Arranged privately";
    const location = entry.coordinates ?? entry.location;
    const position = `${String(entryIndex + 1).padStart(2, "0")} / ${String(group.entries.length).padStart(2, "0")}`;

    return [
      {
        id: `${group.id}-${entryIndex}-arrival`,
        entry,
        label: "Touch down",
        eyebrow: `${position} - ${entry.location}`,
        title: entry.name,
        copy: entry.description ?? `A quiet stay in ${group.label}, arranged directly and routed around the traveller.`,
        poster: gallery[0] ?? entry.poster,
        video: videoFromPoster(gallery[0] ?? entry.poster),
        gallery,
        facts,
        materials,
        notes: [
          { label: "Coordinates", text: location },
          { label: "Season", text: season },
          { label: "Best for", text: bestFor }
        ],
        kind: "film"
      },
      {
        id: `${group.id}-${entryIndex}-experience`,
        entry,
        label: "The stay",
        eyebrow: `${position} - Experience`,
        title: entry.highlights?.[0] ?? "The quiet rhythm",
        copy: experienceCopy(entry),
        poster: gallery[1] ?? gallery[0] ?? entry.poster,
        video: videoFromPoster(gallery[1] ?? gallery[0] ?? entry.poster),
        gallery,
        facts,
        materials,
        notes: [
          { label: "Arrival", text: arrival },
          { label: "Mood", text: facts.find((fact) => fact.label.toLowerCase().includes("mood"))?.value ?? "Private and unhurried" },
          { label: "Route", text: entry.highlights?.[2] ?? "Built around the guest" }
        ],
        kind: "film"
      },
      {
        id: `${group.id}-${entryIndex}-gallery`,
        entry,
        label: "Image rhythm",
        eyebrow: `${position} - Visual archive`,
        title: "A closer look",
        copy: `A flexible image sequence for ${entry.name}. Later, Sanity can add as many photographs as the client wants without changing this layout.`,
        poster: gallery[0] ?? entry.poster,
        video: videoFromPoster(gallery[0] ?? entry.poster),
        gallery,
        facts,
        materials,
        notes: [],
        kind: "gallery"
      },
      {
        id: `${group.id}-${entryIndex}-advisor`,
        entry,
        label: "Advisor detail",
        eyebrow: `${position} - What to know`,
        title: "Before enquiry",
        copy: materialCopy(entry),
        poster: gallery[2] ?? gallery[0] ?? entry.poster,
        video: videoFromPoster(gallery[2] ?? gallery[0] ?? entry.poster),
        gallery,
        facts,
        materials,
        notes: facts.slice(0, 4).map((fact) => ({ label: fact.label, text: fact.value })),
        kind: "detail"
      }
    ];
  });
}

function loadVideo(video: HTMLVideoElement) {
  const source = video.querySelector<HTMLSourceElement>("source[data-src]");
  if (source && !source.src) {
    source.src = source.dataset.src || "";
    video.load();
  }
}

export default function Tier2Collection({ id, catalog, onEnquire }: Tier2CollectionProps) {
  return (
    <section
      id={id}
      data-tier2-stop={id}
      data-stop-theme="white"
      className="relative w-full overflow-hidden text-white"
    >
      {catalog.map((group, groupIndex) => (
        <CountryRouteChapter
          key={group.id}
          group={group}
          groups={catalog}
          countryIndex={groupIndex}
          onEnquire={onEnquire}
        />
      ))}
    </section>
  );
}

function CountryRouteChapter({
  group,
  groups,
  countryIndex,
  onEnquire
}: {
  group: CatalogGroup;
  groups: CatalogGroup[];
  countryIndex: number;
  onEnquire?: (interest: string) => void;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const moments = useMemo(() => buildMoments(group), [group]);
  const active = moments[activeIndex] ?? moments[0];
  // ~0.6 viewport of scroll per moment — tight enough that the reel feels
  // like it's constantly moving rather than parking on one frame.
  const scrollDepth = `${moments.length * 58 + 70}svh`;

  const updateFromScroll = useCallback(() => {
    const section = sectionRef.current;
    if (!section || !moments.length) return;

    const rect = section.getBoundingClientRect();
    const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
    const nextProgress = clamp(-rect.top / scrollable, 0, 1);
    const nextIndex = clamp(Math.floor(nextProgress * moments.length), 0, moments.length - 1);

    setProgress((current) => (Math.abs(current - nextProgress) > 0.002 ? nextProgress : current));
    setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
  }, [moments.length]);

  useEffect(() => {
    updateFromScroll();
    window.addEventListener("scroll", updateFromScroll, { passive: true });
    window.addEventListener("resize", updateFromScroll);

    return () => {
      window.removeEventListener("scroll", updateFromScroll);
      window.removeEventListener("resize", updateFromScroll);
    };
  }, [updateFromScroll]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const videos = Array.from(section.querySelectorAll<HTMLVideoElement>("[data-country-route-video]"));
    videos.forEach((video) => {
      const index = Number(video.dataset.momentIndex);
      const shouldLoad = index === 0 || Math.abs(index - activeIndex) <= 1;
      if (shouldLoad) loadVideo(video);

      if (index === activeIndex) {
        const play = video.play();
        if (play) play.catch(() => undefined);
      } else {
        video.pause();
      }
    });
  }, [activeIndex]);

  const scrollToMoment = (index: number) => {
    const section = sectionRef.current;
    if (!section || moments.length <= 1) return;

    const start = window.scrollY + section.getBoundingClientRect().top;
    const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
    const denominator = Math.max(1, moments.length - 1);
    window.scrollTo({ top: start + scrollable * (index / denominator), behavior: "smooth" });
  };

  if (!active) return null;

  const activePropertyIndex = group.entries.findIndex((entry) => entry.name === active.entry.name);
  const done = progress >= 0.992;
  // Alternate the accent per country, per the brand rule: gold panel + white
  // text, then a light panel + gold text, and back.
  const goldChapter = countryIndex % 2 === 0;
  const panelClass = goldChapter
    ? "bg-[rgba(168,137,74,0.9)] text-white"
    : "bg-[rgba(250,248,244,0.92)] text-navy";
  const panelSub = goldChapter ? "text-white/80" : "text-navy/70";
  const panelEyebrow = goldChapter ? "text-white/75" : "text-gold-deep";
  const panelBorder = goldChapter ? "border-white/25" : "border-gold/25";

  // Even country → media on the RIGHT, panel on the LEFT. Odd → mirrored.
  // Alternating BOTH color and side gives the reel rhythm as you fly down.
  const mediaSide = goldChapter ? "lg:left-[40%] lg:right-0" : "lg:left-0 lg:right-[40%]";
  const panelSide = goldChapter ? "lg:left-0 lg:right-[60%]" : "lg:left-[60%] lg:right-0";
  const localIndex = activeIndex % 4; // which of the 4 moments within a property

  return (
    <section
      ref={sectionRef}
      id={`country-${group.id}`}
      data-tier2-stop={`country-${group.id}`}
      data-stop-theme={goldChapter ? "gold" : "white"}
      className="relative scroll-mt-20"
      style={{ minHeight: scrollDepth }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* MEDIA — full-bleed on mobile, half on desktop (side alternates per country) */}
        <div className={`absolute inset-0 ${mediaSide}`}>
          {moments.map((moment, index) =>
            moment.kind === "gallery" ? (
              <div
                key={moment.id}
                className={`absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 transition-opacity duration-[1000ms] ease-out ${
                  index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                {moment.gallery.slice(0, 4).map((src, imageIndex) => (
                  <div key={`${moment.id}-${src}-${imageIndex}`} className="relative overflow-hidden">
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      className={`absolute inset-0 h-full w-full object-cover ${index === activeIndex ? "kenburns" : ""}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <video
                key={moment.id}
                data-country-route-video
                data-moment-index={index}
                muted
                loop
                playsInline
                preload={index === 0 ? "metadata" : "none"}
                poster={moment.poster}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1000ms] ease-out ${
                  index === activeIndex ? "opacity-100 kenburns" : "opacity-0"
                }`}
              >
                <source data-src={moment.video} type="video/mp4" />
              </video>
            )
          )}
          {/* legibility gradients — stronger toward the panel side */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(14,13,12,.45),rgba(14,13,12,.05)_30%,rgba(14,13,12,.5))]" />
          <div className={`pointer-events-none absolute inset-0 ${goldChapter ? "bg-[linear-gradient(90deg,rgba(14,13,12,.7),transparent_45%)]" : "bg-[linear-gradient(270deg,rgba(14,13,12,.7),transparent_45%)]"}`} />
          {/* live coordinate ticker on the media */}
          <div className="absolute left-4 top-[78px] flex items-center gap-2 border border-white/18 bg-ink/30 px-3 py-2 text-[8px] uppercase tracking-[0.22em] text-gold-light backdrop-blur-md sm:left-5 sm:top-24">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
            {active.entry.coordinates ?? active.entry.location}
          </div>
        </div>

        {/* giant ghost country word — parallax drifts up as you scroll the chapter */}
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 flex justify-center"
          style={{ transform: `translateY(calc(-50% + ${(0.5 - progress) * 240}px))` }}
        >
          <span
            className="font-serif font-light uppercase leading-none text-white/[0.06]"
            style={{ fontSize: "clamp(90px,22vw,420px)", letterSpacing: "0.02em" }}
          >
            {group.label}
          </span>
        </div>

        {/* PANEL — full-height column (no floating box, no dead space) */}
        <div className={`absolute inset-x-0 bottom-0 top-auto max-h-[72svh] overflow-y-auto overscroll-contain lg:inset-y-0 lg:max-h-none lg:overflow-visible ${panelSide}`}>
          <div
            className={`flex min-h-[46svh] flex-col justify-end gap-5 border-t ${panelBorder} ${panelClass} px-5 pb-[calc(env(safe-area-inset-bottom)+22px)] pt-6 backdrop-blur-md sm:gap-6 sm:px-8 lg:h-full lg:justify-center lg:border-t-0 ${
              goldChapter ? "lg:border-r" : "lg:border-l"
            } lg:px-12 lg:pb-10 lg:pt-[104px]`}
          >
            {/* content re-mounts each moment (key) → replays the entrance animation */}
            <div key={active.id} className="moment-in">
              <div className={`font-mono text-[8px] uppercase tracking-[0.24em] ${panelEyebrow}`}>
                {String(countryIndex + 1).padStart(2, "0")} / {String(groups.length).padStart(2, "0")} · {active.entry.location}
              </div>
              <div className={`mt-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] ${panelEyebrow}`}>
                <span>{active.label}</span>
                <span className="flex gap-1">
                  {[0, 1, 2, 3].map((n) => (
                    <span key={n} className={`h-1 w-5 rounded-full ${n === localIndex ? "bg-current" : "bg-current/25"}`} />
                  ))}
                </span>
              </div>
              <h3 className="moment-in moment-in-1 mt-4 font-serif text-[clamp(34px,4.8vw,60px)] font-light leading-[1.0]">{active.title}</h3>
              <p className={`moment-in moment-in-2 mt-5 max-w-[460px] text-[14px] font-light leading-[1.85] ${panelSub}`}>{active.copy}</p>

              <div className="moment-in moment-in-3 mt-6 flex flex-wrap gap-2">
                {active.notes.slice(0, 3).map((note) => (
                  <span key={`${active.id}-${note.label}`} className={`border ${panelBorder} px-3 py-1.5 text-[8.5px] uppercase tracking-[0.14em] ${panelSub}`}>
                    {note.label}: {note.text}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onEnquire?.(active.entry.name)}
                className={`mt-7 inline-block border-b pb-1.5 text-[9px] uppercase tracking-[0.22em] transition-opacity hover:opacity-70 ${
                  goldChapter ? "border-white/60 text-white" : "border-gold-deep/60 text-gold-deep"
                }`}
              >
                Enquire about {active.entry.name} →
              </button>
            </div>

            {/* progress + property jump chips — pinned to the bottom of the panel */}
            <div className="mt-auto">
              <div className={`mb-2 flex items-center justify-between gap-4 font-mono text-[8px] uppercase tracking-[0.2em] ${panelEyebrow}`}>
                <span>Through {group.label} · {String(activeIndex + 1).padStart(2, "0")} / {String(moments.length).padStart(2, "0")}</span>
                <span>{done ? "arrived ✓" : `${Math.round(progress * 100)}%`}</span>
              </div>
              <div className={`h-px w-full ${goldChapter ? "bg-white/25" : "bg-gold/25"}`}>
                <div
                  className={`h-full transition-[width] duration-200 ease-out ${goldChapter ? "bg-white" : "bg-gold"}`}
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                {group.entries.map((entry, index) => {
                  const firstMomentIndex = moments.findIndex((moment) => moment.entry.name === entry.name);
                  const isActive = index === activePropertyIndex;
                  const chipBorder = goldChapter
                    ? isActive ? "border-white" : "border-white/30 hover:border-white/70"
                    : isActive ? "border-gold" : "border-gold/30 hover:border-gold/70";
                  return (
                    <button
                      key={`${group.id}-${entry.name}-nav`}
                      type="button"
                      onClick={() => scrollToMoment(Math.max(0, firstMomentIndex))}
                      className={`group relative h-14 w-20 shrink-0 overflow-hidden border transition-colors ${chipBorder}`}
                    >
                      <img src={entry.poster} alt="" loading="lazy" className={`absolute inset-0 h-full w-full object-cover transition-opacity ${isActive ? "opacity-90" : "opacity-55 group-hover:opacity-80"}`} />
                      <span className={`absolute inset-0 ${isActive ? "bg-ink/15" : "bg-ink/45"}`} />
                      <span className="absolute bottom-1 left-1.5 right-1.5 truncate font-serif text-[11px] font-light leading-none text-white">
                        {entry.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
