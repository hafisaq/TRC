import { useEffect, useMemo, useRef, useState } from "react";
import type { DotMapHandle } from "../components/tier2/DotMap";
import Tier2FlightPath from "../components/tier2/Tier2FlightPath";
import Tier2Enquire, { type EnquiryOption } from "../components/tier2/Tier2Enquire";
import { useTier2Animations, type Tier2Stop } from "../hooks/useTier2Animations";
import { scrollToHash } from "../lib/scroll";
import type { CatalogEntry, Region } from "../data/regions/types";
import { getCountryPage, type CountryChapter, type CountryDay, type EssentialCard } from "../data/regions/countryContent";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// Tracks 0→1 progress through a tall pinned section via live rect
// measurement (no cached positions to go stale).
function usePinProgress(ref: React.RefObject<HTMLElement | null>) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
      const next = clamp(-rect.top / scrollable, 0, 1);
      setP((c) => (Math.abs(c - next) > 0.003 ? next : c));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ref]);
  return p;
}

// 0→1 as an (unpinned) section crosses the viewport — 0 when its top enters
// from below, 1 when its bottom leaves above. Drives continuous scrubbed
// motion (parallax, drift) rather than one-shot reveals.
function useViewProgress(ref: React.RefObject<HTMLElement | null>) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const next = clamp((vh - rect.top) / (vh + rect.height), 0, 1);
      setP((c) => (Math.abs(c - next) > 0.004 ? next : c));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ref]);
  return p;
}

function useIsSmallScreen() {
  const [isSmall, setIsSmall] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setIsSmall(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isSmall;
}

// A White Desert-style "product page" for ONE country — editorial chapters,
// a pull quote, and a numbered day-by-day journey. The signature: the same
// scroll-scrubbed flight path from the main screen flies down this page and
// lands (pulse + DotMap burst + reveal) on every chapter and every day.
export default function CountryDetail({ region, slug }: { region: Region; slug: string }) {
  const data = getCountryPage(region, slug);
  if (!data) {
    // unknown slug — send them back to the region
    window.location.replace("/asia");
    return null;
  }
  return <CountryDetailInner region={region} slug={slug} data={data} />;
}

function CountryDetailInner({
  region,
  slug,
  data
}: {
  region: Region;
  slug: string;
  data: NonNullable<ReturnType<typeof getCountryPage>>;
}) {
  const dotMapRef = useRef<DotMapHandle>(null);
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("cd-hero");
  const [openStay, setOpenStay] = useState<CatalogEntry | null>(null);
  const { group, stop, page } = data;
  const heroId = `cd-hero`;

  // Flight stops: both chapters, the quote, every day, and the stays block.
  // mapPos jitters around the country's own dot so DotMap bursts cluster
  // where the country actually is on the zoomed-in map.
  const flightStops = useMemo<Tier2Stop[]>(() => {
    const [cx, cy] = stop.mapPos;
    const jitter = (i: number): [number, number] => [
      cx + Math.sin(i * 2.1) * 0.05,
      cy + Math.cos(i * 1.7) * 0.05
    ];
    let n = 0;
    const s: Tier2Stop[] = [];
    page.chapters.forEach((ch, i) => {
      s.push({ id: `cd-ch-${i}`, mapPos: jitter(n++), theme: "white", coords: stop.coords });
    });
    s.push({ id: "cd-quote", mapPos: jitter(n++), theme: "white", coords: stop.coords });
    page.days.forEach((_, i) => {
      s.push({ id: `cd-day-${i}`, mapPos: jitter(n++), theme: "white", coords: stop.coords });
    });
    s.push({ id: "cd-essentials", mapPos: jitter(n++), theme: "white", coords: stop.coords });
    s.push({ id: "cd-gallery", mapPos: jitter(n++), theme: "white", coords: stop.coords });
    s.push({ id: "cd-stays", mapPos: jitter(n++), theme: "white", coords: stop.coords });
    return s;
  }, [page, stop]);

  useTier2Animations(dotMapRef, flightStops, { heroReady: true });

  // Scroll-spy for the sticky section chips (White Desert's in-page nav).
  const sections = useMemo(
    () => [
      { id: heroId, label: "Overview" },
      ...page.chapters.map((ch, i) => ({ id: `cd-ch-${i}`, label: ch.navLabel })),
      { id: "cd-day-0", label: "The Journey" },
      { id: "cd-essentials", label: "Essentials" },
      { id: "cd-gallery", label: "Gallery" },
      { id: "cd-stays", label: "The Stays" }
    ],
    [page]
  );

  useEffect(() => {
    const targets = sections
      .map(({ id }) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            // group all days under "The Journey" chip
            setActiveSection(id.startsWith("cd-day-") ? "cd-day-0" : id);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    // also watch every day section so the Journey chip stays lit through all of them
    const dayEls = page.days.map((_, i) => document.getElementById(`cd-day-${i}`)).filter((el): el is HTMLElement => !!el);
    [...targets, ...dayEls].forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections, page]);

  const enquiryOptions = useMemo<EnquiryOption[]>(
    () => [
      { id: `${slug}-enquiry`, interest: page.country, gate: page.country.slice(0, 2).toUpperCase() },
      ...group.entries.map((entry, i) => ({
        id: `${slug}-${i}-enquiry`,
        interest: entry.name,
        gate: `${page.country.slice(0, 1).toUpperCase()}${i + 1}`
      }))
    ],
    [group, page, slug]
  );

  const handleEnquire = (interest = page.country) => {
    setSelectedInterest(interest);
    scrollToHash("#tier2-enquire");
    history.replaceState(null, "", "#tier2-enquire");
  };

  const otherCountries = region.stops.filter((s) => s.country !== stop.country);
  const maskId = "cd-hero-mask";
  const isSmall = useIsSmallScreen();
  const heroViewBox = isSmall ? "0 0 390 844" : "0 0 1000 560";
  const heroTextX = isSmall ? 195 : 500;
  const heroTextY = isSmall ? 386 : 308;
  const heroFontSize = isSmall ? (page.country.length > 8 ? 54 : page.country.length > 5 ? 66 : 96) : page.country.length > 8 ? 130 : page.country.length > 5 ? 165 : 220;

  // closing transition on the hero: its copy fades and lifts away as you
  // leave, instead of being scrolled off abruptly
  const [heroFade, setHeroFade] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const vh = window.innerHeight || 1;
      setHeroFade((c) => {
        const n = clamp(window.scrollY / (vh * 0.72), 0, 1);
        return Math.abs(c - n) > 0.01 ? n : c;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-cream-deep font-sans text-navy">
      {/* atlas backdrop — chart-paper grid + soft gold sheens; the route
          line and plane read like ink on a navigator's map */}
      <div aria-hidden="true" className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cream-deep" />
        <AtlasChart />
        <div className="atlas-sheen-a absolute inset-0 bg-[radial-gradient(58%_42%_at_16%_6%,rgba(200,162,76,.14),transparent_62%)]" />
        <div className="atlas-sheen-b absolute inset-0 bg-[radial-gradient(46%_36%_at_86%_72%,rgba(200,162,76,.11),transparent_60%)]" />
        {/* ambient traffic on the chart's corridors */}
        <div
          className="ambient-plane absolute left-0 top-0"
          style={{ offsetPath: 'path("M -80 560 C 420 430, 900 640, 1580 470")', animationDuration: "46s" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" style={{ opacity: 0.65 }}>
            <path fill="#8f7231" d="M21,16V14L13,9V3.5C13,2.67 12.33,2 11.5,2C10.67,2 10,2.67 10,3.5V9L2,14V16L10,13.5V19L7.5,20.5V22L11.5,21L15.5,22V20.5L13,19V13.5L21,16Z" />
          </svg>
        </div>
        <div
          className="ambient-plane absolute left-0 top-0"
          style={{ offsetPath: 'path("M 1560 180 C 1000 60, 420 160, -100 320")', animationDuration: "64s", animationDelay: "18s" }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" style={{ opacity: 0.45 }}>
            <path fill="#8f7231" d="M21,16V14L13,9V3.5C13,2.67 12.33,2 11.5,2C10.67,2 10,2.67 10,3.5V9L2,14V16L10,13.5V19L7.5,20.5V22L11.5,21L15.5,22V20.5L13,19V13.5L21,16Z" />
          </svg>
        </div>
        <div
          className="ambient-plane absolute left-0 top-0"
          style={{ offsetPath: 'path("M -60 120 C 500 40, 1000 110, 1560 50")', animationDuration: "58s", animationDelay: "34s" }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" style={{ opacity: 0.38 }}>
            <path fill="#8f7231" d="M21,16V14L13,9V3.5C13,2.67 12.33,2 11.5,2C10.67,2 10,2.67 10,3.5V9L2,14V16L10,13.5V19L7.5,20.5V22L11.5,21L15.5,22V20.5L13,19V13.5L21,16Z" />
          </svg>
        </div>
        {/* sailboats on the sea lanes, rocking as they go */}
        <div
          className="ambient-boat absolute left-0 top-0"
          style={{ offsetPath: 'path("M -60 706 C 400 668, 900 726, 1560 684")', animationDuration: "110s" }}
        >
          <svg className="boat-rock" width="18" height="16" viewBox="0 0 24 22" style={{ opacity: 0.55 }}>
            <path d="M12 2 L12 13 L5.5 13 Z" fill="rgba(22,36,60,.5)" />
            <path d="M13.5 5 L13.5 13 L18.5 13 Z" fill="rgba(22,36,60,.32)" />
            <path d="M4 15 L20 15 L16.5 19.5 L7.5 19.5 Z" fill="#8f7231" />
          </svg>
        </div>
        <div
          className="ambient-boat absolute left-0 top-0"
          style={{ offsetPath: 'path("M 1560 470 C 1080 500, 620 452, -80 496")', animationDuration: "88s", animationDelay: "40s" }}
        >
          <svg className="boat-rock" width="13" height="12" viewBox="0 0 24 22" style={{ opacity: 0.4, animationDelay: "1.6s" }}>
            <path d="M12 2 L12 13 L5.5 13 Z" fill="rgba(22,36,60,.5)" />
            <path d="M13.5 5 L13.5 13 L18.5 13 Z" fill="rgba(22,36,60,.32)" />
            <path d="M4 15 L20 15 L16.5 19.5 L7.5 19.5 Z" fill="#8f7231" />
          </svg>
        </div>
      </div>

      {/* fixed header */}
      <header className="fixed inset-x-0 top-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-gold/20 bg-cream-deep/88 px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-2.5 backdrop-blur-md sm:gap-4 sm:px-8 sm:py-3">
        <a href="/" className="shrink-0 text-[9px] uppercase tracking-[0.2em] text-navy/55 transition-colors hover:text-gold-deep sm:text-[10px] sm:tracking-[0.24em]">
          ← Home
        </a>
        <a href="/" aria-label="The Retreat Collection home" className="grid place-items-center">
          <img
            src="/media/brand/retreat-collection-logo-crop.png"
            alt="The Retreat Collection"
            className="h-auto w-[108px] opacity-85 sm:w-[150px]"
          />
        </a>
        <div className="flex min-w-0 items-center justify-end gap-5">
          <div className="hidden truncate text-[10px] uppercase tracking-[0.3em] text-gold-deep md:block">{page.country}</div>
          <button
            type="button"
            onClick={() => handleEnquire()}
            className="shrink-0 border-b border-gold-deep/55 pb-1 text-[9px] uppercase tracking-[0.2em] text-gold-deep transition-colors hover:text-navy sm:text-[10px] sm:tracking-[0.24em]"
          >
            Enquire
          </button>
        </div>
      </header>

      <main id="tier2-journey" className="relative z-10">
        <Tier2FlightPath stops={flightStops} startId={heroId} />

        {/* HERO — the country name with the footage seeping through the letters */}
        <section id={heroId} className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-ink sm:min-h-[600px]">
          <video autoPlay muted loop playsInline poster={`/media/poster/${page.heroSlug}.jpg`} className="absolute inset-0 h-full w-full object-cover">
            <source src={`/media/video/${page.heroSlug}.mp4`} type="video/mp4" />
          </video>
          <svg className="absolute inset-0 h-full w-full" viewBox={heroViewBox} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <mask id={maskId}>
                <rect width="100%" height="100%" fill="white" />
                <text x={heroTextX} y={heroTextY} textAnchor="middle" fontFamily="var(--font-serif)" fontWeight="300" fontSize={heroFontSize} letterSpacing="2" fill="black">
                  {page.country.toUpperCase()}
                </text>
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(14,13,12,0.72)" mask={`url(#${maskId})`} />
          </svg>
          <div
            className="pointer-events-none absolute inset-x-0 top-[58%] flex flex-col items-center px-5 text-center sm:top-[62%]"
            style={{ opacity: 1 - heroFade, transform: `translateY(${-heroFade * 34}px)` }}
          >
            <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.3em] text-gold-light sm:gap-4 sm:text-[10px]">
              <span className="h-px w-8 bg-gold/60 sm:w-10" />
              {page.priceLine}
              <span className="h-px w-8 bg-gold/60 sm:w-10" />
            </div>
            <p className="mt-5 max-w-[520px] text-[13px] font-light leading-[1.85] text-white/75 sm:text-[14.5px]">{page.tagline}</p>
            <div className="mt-4 flex items-center gap-4 font-mono text-[8.5px] uppercase tracking-[0.22em] text-white/50">
              <span>{page.coords}</span>
              <span className="h-px w-6 bg-white/25" />
              <span>Best season · {page.season}</span>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-7 flex flex-col items-center gap-3 text-white/50">
            <div className="text-[8.5px] uppercase tracking-[0.34em]">Scroll to fly the route</div>
            <div className="h-10 w-px" style={{ background: "linear-gradient(180deg,rgba(255,255,255,.6),rgba(255,255,255,0))" }} />
          </div>
          {/* dawn veil — the light atlas world rises into the dark hero as
              you scroll, so the two worlds hand over instead of hard-cutting */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: heroFade,
              background: "linear-gradient(180deg, rgba(243,239,231,0) 22%, rgba(243,239,231,.55) 62%, rgba(243,239,231,.92) 88%, #f3efe7 100%)"
            }}
          />
        </section>

        {/* sticky in-page section nav — White Desert's chip bar, scroll-spied */}
        <nav
          className="sticky top-[calc(env(safe-area-inset-top)+51px)] z-40 flex gap-2 overflow-x-auto overscroll-x-contain border-b border-gold/18 bg-cream-deep/88 px-4 py-2.5 backdrop-blur-md no-scrollbar sm:top-[57px] sm:px-8 sm:py-3"
          aria-label="Page sections"
        >
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToHash(`#${s.id}`);
              }}
              className={`grid min-h-10 shrink-0 place-items-center border px-3 py-2 text-[8.5px] uppercase tracking-[0.16em] transition-colors sm:px-4 sm:tracking-[0.18em] ${
                activeSection === s.id
                  ? "border-gold bg-gold/10 text-gold-deep"
                  : "border-navy/15 text-navy/50 hover:border-gold/50 hover:text-gold-deep"
              }`}
            >
              {s.label}
            </a>
          ))}
        </nav>

        {/* CHAPTERS — dark ones open up White Desert-style; light ones stay editorial */}
        {page.chapters.map((ch, i) =>
          ch.light ? (
            <section
              key={ch.navLabel}
              id={`cd-ch-${i}`}
              data-tier2-stop={`cd-ch-${i}`}
              className="relative min-h-[100svh] w-full overflow-hidden border-y-2 border-gold/45 bg-cream text-navy"
            >
              <div className={`relative mx-auto grid min-h-[100svh] max-w-[1280px] items-center gap-10 px-5 py-24 sm:px-10 lg:grid-cols-2 lg:px-16 ${i % 2 === 1 ? "lg:[direction:rtl]" : ""}`}>
                <div data-stop-text className="opacity-0 lg:[direction:ltr]">
                  <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-deep">
                    {String(i + 1).padStart(2, "0")} · {ch.eyebrow}
                  </div>
                  <h2 className="mt-4 font-serif text-[clamp(38px,6vw,72px)] font-light leading-[0.98] text-navy">
                    {ch.title[0]}
                    <br />
                    {ch.title[1]}
                  </h2>
                  {ch.paragraphs.map((p, pi) => (
                    <p key={pi} className="mt-5 max-w-[520px] text-[14px] font-light leading-[1.9] text-navy/70 sm:text-[15px]">
                      {p}
                    </p>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleEnquire()}
                    className="mt-7 border-b border-gold-deep/60 pb-1.5 text-[9px] uppercase tracking-[0.22em] text-gold-deep transition-opacity hover:opacity-70"
                  >
                    Speak to us about {page.country}
                  </button>
                </div>
                <div data-stop-video className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-gold/40 opacity-0 scale-95 lg:[direction:ltr]">
                  <video muted loop playsInline preload="none" poster={`/media/poster/${ch.slug}.jpg`} className="absolute inset-0 h-full w-full object-cover">
                    <source data-src={`/media/video/${ch.slug}.mp4`} type="video/mp4" />
                  </video>
                </div>
              </div>
            </section>
          ) : (
            <ExpandChapter
              key={ch.navLabel}
              id={`cd-ch-${i}`}
              index={i}
              chapter={ch}
              country={page.country}
              onEnquire={() => handleEnquire()}
            />
          )
        )}

        {/* PULL QUOTE — lands with a gold wash */}
        {/* Quote stays on the shared dark ground — gold lives in the type and
            a soft glow that breathes in when the plane lands, not a slab. */}
        <SignedQuote text={page.quote.text} attribution={page.quote.attribution} />

        {/* DAY-BY-DAY — dense White Desert-style timeline: sticky film left,
            every day stacked compactly on a gold route line right */}
        <JourneySection days={page.days} country={page.country} />

        {/* THE ESSENTIALS — information deck, dealt card over card */}
        <EssentialsStack cards={page.essentials} country={page.country} />

        {/* THE GALLERY — every image the country's data holds, in one wall */}
        <GallerySection page={page} group={group} />

        {/* THE STAYS */}
        <section id="cd-stays" data-tier2-stop="cd-stays" className="relative w-full overflow-hidden px-5 py-24 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-[1280px]">
            <div data-stop-text className="opacity-0">
              <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-deep">Where you'll stay</div>
              <h2 className="mt-3 font-serif text-[clamp(34px,5.6vw,64px)] font-light leading-[1.0]">
                The stays in {page.country}
              </h2>
            </div>
            <div className="relative mt-10">
              <div className="pointer-events-none absolute -top-8 right-0 hidden items-center gap-3 font-mono text-[8.5px] uppercase tracking-[0.24em] text-navy/45 sm:flex">
                <span>{String(group.entries.length).padStart(2, "0")} stays</span>
                <span className="h-px w-8 bg-gold/50" />
                <span>Scroll →</span>
              </div>
              <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 no-scrollbar">
              {group.entries.map((entry, i) => (
                <div key={entry.name} className="group relative aspect-[4/5] w-[300px] shrink-0 snap-start overflow-hidden rounded-lg border border-navy/15 shadow-[0_22px_54px_rgba(22,36,60,.16)] sm:w-[340px]">
                  <img src={entry.poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]" />
                  <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(14,13,12,.9),rgba(14,13,12,.15)_55%)]" />
                  <div className="absolute top-3 left-3 font-mono text-[9px] uppercase tracking-[0.2em] text-gold-light/85">{String(i + 1).padStart(2, "0")}</div>
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-gold-light/85">{entry.location}</div>
                    <div className="mt-1.5 font-serif text-[22px] font-light leading-[1.1] text-white">{entry.name}</div>
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setOpenStay(entry)}
                        className="border-b border-gold-light/60 pb-1 text-[9px] uppercase tracking-[0.2em] text-gold-light transition-colors hover:text-white"
                      >
                        Open the dossier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEnquire(entry.name)}
                        className="border-b border-white/40 pb-1 text-[9px] uppercase tracking-[0.2em] text-white/80 transition-colors hover:text-white"
                      >
                        Enquire
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>

            {/* other routes in the region */}
            <div className="mt-16 border-t border-navy/12 pt-8">
              <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-navy/50">Other routes in {region.title}</div>
              <div className="mt-4 flex flex-wrap gap-3">
                {otherCountries.map((c) => {
                  const gid = region.catalog.find((g) => g.label.toLowerCase() === c.country.toLowerCase())?.id;
                  return (
                    <a
                      key={c.id}
                      href={gid ? `/asia/${gid}` : "/asia"}
                      className="group border border-navy/20 bg-cream/60 px-5 py-3 transition-colors hover:border-gold"
                    >
                      <span className="block font-mono text-[8px] uppercase tracking-[0.18em] text-gold-deep/80">{c.eyebrow}</span>
                      <span className="mt-1 block font-serif text-[20px] font-light text-navy transition-colors group-hover:text-gold-deep">
                        {c.country} →
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="relative z-10 bg-ink text-white">
        <Tier2Enquire selectedInterest={selectedInterest} destinations={enquiryOptions} />
      </div>

      {openStay && (
        <StayDossier
          entry={openStay}
          country={page.country}
          onClose={() => setOpenStay(null)}
          onEnquire={(name) => {
            setOpenStay(null);
            handleEnquire(name);
          }}
        />
      )}
    </div>
  );
}

// White Desert's signature move: the chapter pins, its film starts as an
// inset window over a giant title, opens up to full-bleed as you scroll,
// the editorial fades in over the footage, then fades out (the "closing"
// beat) just before the pin releases.
function ExpandChapter({
  id,
  index,
  chapter,
  country,
  onEnquire
}: {
  id: string;
  index: number;
  chapter: CountryChapter;
  country: string;
  onEnquire: () => void;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const p = usePinProgress(ref);
  const isSmall = useIsSmallScreen();

  const open = clamp(p / (isSmall ? 0.32 : 0.42), 0, 1); // film opens to full-bleed
  const insetX = (1 - open) * (isSmall ? 8 : 24);
  const insetY = (1 - open) * (isSmall ? 14 : 18);
  const radius = (1 - open) * 26;
  const titleOut = 1 - clamp((open - (isSmall ? 0.14 : 0.3)) / (isSmall ? 0.34 : 0.45), 0, 1); // backdrop word cedes to the film
  const textIn = clamp((p - (isSmall ? 0.36 : 0.5)) / (isSmall ? 0.18 : 0.16), 0, 1); // fade-in
  const closing = 1 - clamp((p - (isSmall ? 0.92 : 0.9)) / (isSmall ? 0.08 : 0.1), 0, 1); // closing fade before release

  return (
    <section ref={ref} id={id} data-tier2-stop={id} className="relative h-[180svh] w-full sm:h-[220svh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* the word the film opens over */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center" style={{ opacity: titleOut }}>
          <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-deep">
            {String(index + 1).padStart(2, "0")} · {chapter.eyebrow}
          </div>
          <div className="mt-4 font-serif text-[clamp(42px,16vw,120px)] font-light leading-[0.96] text-navy/90 sm:text-[clamp(44px,9vw,120px)]">
            {chapter.title[0]}
            <br />
            {chapter.title[1]}
          </div>
          <div className="mt-6 font-mono text-[8px] uppercase tracking-[0.3em] text-navy/40">Keep scrolling</div>
        </div>

        {/* the film window, opening up */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(${insetY}% ${insetX}% ${insetY}% ${insetX}% round ${radius}px)` }}
        >
          <video autoPlay muted loop playsInline preload="metadata" poster={`/media/poster/${chapter.slug}.jpg`} className="kenburns absolute inset-0 h-full w-full object-cover">
            <source src={`/media/video/${chapter.slug}.mp4`} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(14,13,12,.74),rgba(14,13,12,.06)_52%,rgba(14,13,12,.18))]" />
        </div>

        {/* editorial over the opened film — fades in, then closes out */}
        <div
          className="absolute inset-x-0 bottom-0 px-5 pb-[calc(env(safe-area-inset-bottom)+34px)] sm:px-10 sm:pb-[calc(env(safe-area-inset-bottom)+56px)] lg:px-16"
          style={{ opacity: textIn * closing, transform: `translateY(${(1 - textIn) * 36 - (1 - closing) * 22}px)` }}
        >
          <div className="mx-auto max-w-[1280px]">
            <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-light">
              {String(index + 1).padStart(2, "0")} · {chapter.eyebrow}
            </div>
            <h2 className="mt-3 font-serif text-[clamp(30px,11vw,60px)] font-light leading-[1.0] text-white sm:text-[clamp(32px,5vw,60px)]">
              {chapter.title[0]} {chapter.title[1]}
            </h2>
            {chapter.paragraphs.map((para, pi) => (
              <p key={pi} className="mt-3 max-w-[560px] text-[13px] font-light leading-[1.75] text-white/80 sm:mt-4 sm:text-[14.5px] sm:leading-[1.85]">
                {para}
              </p>
            ))}
            <button
              type="button"
              onClick={onEnquire}
              className="mt-6 border-b border-white/55 pb-1.5 text-[9px] uppercase tracking-[0.22em] text-white transition-opacity hover:opacity-70"
            >
              Speak to us about {country}
            </button>
          </div>
        </div>

        {/* chapter progress */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-navy/15">
          <div className="h-full bg-gold shadow-[0_0_10px_rgba(227,198,130,.6)]" style={{ width: `${p * 100}%` }} />
        </div>
      </div>
    </section>
  );
}

// The full property dossier — everything the partner portal holds for a
// stay, rendered natively: gallery, editorial description, facts, mood
// cues, and the library of supporting material shown as content, not as a
// "download the brochure" hand-off. Entirely data-driven: whatever fields
// exist on the CatalogEntry (from Sanity later) render; missing ones
// simply don't — nothing breaks.
function StayDossier({
  entry,
  country,
  onClose,
  onEnquire
}: {
  entry: CatalogEntry;
  country: string;
  onClose: () => void;
  onEnquire: (name: string) => void;
}) {
  const gallery = entry.gallery?.length ? entry.gallery : [entry.poster];
  const facts = entry.facts?.length
    ? entry.facts
    : [
        { label: "Location", value: entry.location },
        { label: "Country", value: country },
        { label: "Season", value: entry.season ?? "On request" }
      ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-ink/[0.985] backdrop-blur-md">
      <div className="mx-auto max-w-[1100px] px-5 pb-[calc(env(safe-area-inset-bottom)+88px)] pt-[calc(env(safe-area-inset-top)+72px)] sm:px-10 sm:pb-24">
        <div className="flex items-start justify-between gap-6">
          <div className="moment-in">
            <div className="flex items-center gap-3 font-mono text-[8.5px] uppercase tracking-[0.26em] text-gold-light">
              <span className="h-px w-8 bg-gold/60" />
              {country} · {entry.location}
            </div>
            <h2 className="mt-3 font-serif text-[clamp(34px,6vw,64px)] font-light leading-[1.0] text-white">{entry.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dossier"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/25 text-white/70 transition-colors hover:border-gold/60 hover:text-gold-light sm:h-11 sm:w-11"
          >
            <span className="text-[13px]">✕</span>
          </button>
        </div>

        {/* lead film */}
        <div className="moment-in moment-in-1 relative mt-8 aspect-[4/5] w-full overflow-hidden rounded-xl border border-gold/30 sm:aspect-[16/8]">
          <video autoPlay muted loop playsInline poster={gallery[0]} className="absolute inset-0 h-full w-full object-cover">
            <source src={gallery[0].replace("/media/poster/", "/media/video/").replace(/\.(jpg|jpeg|png|webp)$/i, ".mp4")} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(14,13,12,.4))]" />
          {entry.coordinates && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2 border border-white/20 bg-ink/35 px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-gold-light backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
              {entry.coordinates}
            </div>
          )}
        </div>

        {entry.description && (
          <p className="moment-in moment-in-2 mt-8 max-w-[680px] font-serif text-[clamp(18px,2.4vw,24px)] font-light italic leading-[1.6] text-white/85">
            {entry.description}
          </p>
        )}

        {entry.highlights?.length ? (
          <div className="moment-in moment-in-2 mt-6 flex flex-wrap gap-2">
            {entry.highlights.map((h) => (
              <span key={h} className="border border-gold/30 bg-gold/[0.07] px-3 py-1.5 text-[8.5px] uppercase tracking-[0.16em] text-gold-light/90">
                {h}
              </span>
            ))}
          </div>
        ) : null}

        {/* facts */}
        <div className="moment-in moment-in-3 mt-10 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="border border-white/12 px-4 py-4">
              <div className="text-[8.5px] uppercase tracking-[0.18em] text-gold-light/75">{fact.label}</div>
              <div className="mt-2 text-[13px] font-light leading-[1.5] text-white/85">{fact.value}</div>
            </div>
          ))}
        </div>

        {/* gallery */}
        {gallery.length > 1 && (
          <div className="mt-10">
            <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-light/80">A closer look</div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {gallery.map((src, i) => (
                <div key={src + i} className="group relative aspect-[4/5] overflow-hidden rounded-md border border-white/10">
                  <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* the library, as content */}
        {entry.assets?.length ? (
          <div className="mt-10 border-t border-white/10 pt-7">
            <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-light/80">In the library for this stay</div>
            <div className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {entry.assets.map((asset, i) => (
                <div key={asset.title + i} className="flex items-baseline gap-4 border-b border-white/[0.07] pb-3">
                  <span className="shrink-0 font-mono text-[9px] text-gold-light/60">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-light text-white/85">{asset.title}</div>
                    <div className="text-[8.5px] uppercase tracking-[0.16em] text-white/40">{asset.category}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] font-light italic text-white/40">
              Full material is shared as part of your enquiry — nothing to download, nothing to chase.
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => onEnquire(entry.name)}
          className="mt-10 inline-block border-b border-gold-light/60 pb-1.5 text-[9px] uppercase tracking-[0.22em] text-gold-light transition-colors hover:text-white"
        >
          Enquire about {entry.name} →
        </button>
      </div>
    </div>
  );
}

// The journey as White Desert actually builds it: dense, scannable, zero
// dead space. A sticky film panel on the left crossfades to follow whichever
// day you're reading; every day stacks compactly on a gold route line with
// nodes on the right. Scales to any number of days — 5 or 15 — because each
// day is a row, not a viewport.
function JourneySection({ days, country }: { days: CountryDay[]; country: string }) {
  const [active, setActive] = useState(0);
  const rowRefs = useRef<Array<HTMLLIElement | null>>([]);
  const filmRefs = useRef<Array<HTMLVideoElement | null>>([]);

  // active day = the row nearest the reading line (45% down the viewport);
  // pure rect measurement, nothing cached to go stale
  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight || 1;
      let best = 0;
      let bestDist = Infinity;
      rowRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - vh * 0.45);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive((a) => (a === best ? a : best));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // wake/pause the films as the active day changes
  useEffect(() => {
    filmRefs.current.forEach((video, i) => {
      if (!video) return;
      if (Math.abs(i - active) <= 1) {
        const source = video.querySelector<HTMLSourceElement>("source[data-src]");
        if (source && !source.src) {
          source.src = source.dataset.src || "";
          video.load();
        }
      }
      if (i === active) {
        const p = video.play();
        if (p) p.catch(() => undefined);
      } else {
        video.pause();
      }
    });
  }, [active]);

  return (
    <section className="relative w-full px-5 pt-24 pb-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[1280px]">
        <div className="text-center">
          <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-deep">Sample itinerary</div>
          <h2 className="mt-3 font-serif text-[clamp(36px,6vw,68px)] font-light leading-[1.0]">
            {country},<br />day by day
          </h2>
          <p className="mx-auto mt-4 max-w-[480px] text-[13px] font-light leading-[1.85] text-navy/60">
            A sample route, not a schedule — every day bends around the traveller. The plane lands as you do.
          </p>
        </div>

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          {/* sticky film — follows the day being read */}
          <div className="hidden lg:sticky lg:top-[120px] lg:block">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-gold/50 shadow-[0_30px_80px_rgba(22,36,60,.2)]">
              {days.map((day, i) => (
                <video
                  key={day.title}
                  ref={(el) => {
                    filmRefs.current[i] = el;
                  }}
                  muted
                  loop
                  playsInline
                  preload={i === 0 ? "metadata" : "none"}
                  poster={`/media/poster/${day.slug}.jpg`}
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-[900ms] ease-out ${
                    i === active ? "opacity-100 scale-100" : "opacity-0 scale-[1.04]"
                  }`}
                >
                  <source data-src={`/media/video/${day.slug}.mp4`} type="video/mp4" />
                </video>
              ))}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(14,13,12,.45))]" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2.5 border border-white/20 bg-ink/35 px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-gold-light backdrop-blur-md">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
                {country} — Day {String(active + 1).padStart(2, "0")} of {String(days.length).padStart(2, "0")}
              </div>
              <div className="absolute right-4 top-4 flex flex-col gap-1.5">
                {days.map((_, i) => (
                  <span key={i} className={`h-1 w-5 rounded-full transition-colors duration-300 ${i === active ? "bg-gold" : i < active ? "bg-gold/45" : "bg-white/20"}`} />
                ))}
              </div>
            </div>
          </div>

          {/* the route line — every day, compact, connected */}
          <ol className="relative">
            <span aria-hidden="true" className="absolute bottom-6 left-[13px] top-6 w-px bg-gradient-to-b from-gold/50 via-gold/25 to-gold/50" />
            {days.map((day, i) => {
              const isActive = i === active;
              const passed = i < active;
              return (
                <li
                  key={day.title}
                  ref={(el) => {
                    rowRefs.current[i] = el;
                  }}
                  id={`cd-day-${i}`}
                  data-tier2-stop={`cd-day-${i}`}
                  className={`relative border-b border-navy/10 py-8 pl-14 transition-opacity duration-500 last:border-b-0 sm:py-9 ${
                    isActive ? "opacity-100" : "opacity-50"
                  }`}
                >
                  {/* node on the route line — also the flight path's exact landing anchor */}
                  <span
                    aria-hidden="true"
                    data-flight-node
                    className={`absolute left-[6px] top-11 grid h-4 w-4 place-items-center rounded-full border transition-colors duration-400 ${
                      isActive ? "border-gold bg-gold/25 shadow-[0_0_16px_rgba(200,162,76,.55)]" : passed ? "border-gold/60 bg-gold/15" : "border-navy/30"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-400 ${isActive || passed ? "bg-gold" : "bg-navy/20"}`} />
                  </span>

                  <div data-stop-text className="opacity-0">
                    <div className="flex items-baseline gap-4">
                      <span className={`font-mono text-[22px] font-light leading-none ${isActive ? "text-gold-deep" : "text-navy/35"}`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-mono text-[8.5px] uppercase tracking-[0.26em] text-navy/45">Day {i + 1}</span>
                    </div>
                    <h3 className={`mt-2.5 font-serif text-[clamp(24px,3.2vw,38px)] font-light leading-[1.05] transition-colors duration-400 ${isActive ? "text-navy" : "text-navy/60"}`}>
                      {day.title}
                    </h3>
                    <p className="mt-3 max-w-[520px] text-[13.5px] font-light leading-[1.8] text-navy/70">{day.copy}</p>
                    {day.details?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {day.details.map((d) => (
                          <span key={d} className="border border-gold/50 bg-gold/10 px-2.5 py-1 text-[8px] uppercase tracking-[0.15em] text-gold-deep">
                            {d}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {/* the film inline on mobile, where there's no sticky panel */}
                    <div className="relative mt-5 aspect-[16/9] w-full max-w-[440px] overflow-hidden rounded-lg border border-navy/15 lg:hidden">
                      <img src={`/media/poster/${day.slug}.jpg`} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(14,13,12,.4))]" />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

// The backdrop: a hand-sketched navigator's world — wobbly ink coastlines
// (Indian-Ocean-centric) that draw themselves in on arrival, atoll dots,
// rolling waves, dashed air corridors with waypoints, and a compass rose.
function AtlasChart() {
  const INK = "rgba(22,36,60,.13)";
  const INK_SOFT = "rgba(22,36,60,.09)";
  const GOLD_INK = "rgba(143,114,49,.3)";
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* sketched coastlines — pencil overdraw: each line twice, offset */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* India, hanging from the top */}
        <path className="sketch-line" pathLength={1} d="M 560 -20 C 545 60, 518 122, 540 182 C 556 236, 586 272, 616 306 C 641 333, 661 346, 673 330 C 691 300, 701 250, 716 200 C 729 154, 746 88, 739 -20" stroke={INK} strokeWidth="1.4" />
        <path className="sketch-line" pathLength={1} style={{ animationDelay: "0.15s" }} d="M 563 -20 C 549 62, 523 124, 544 183 C 559 235, 589 270, 618 303" stroke={INK_SOFT} strokeWidth="1" />
        {/* Sri Lanka */}
        <path className="sketch-line" pathLength={1} style={{ animationDelay: "0.5s" }} d="M 700 368 C 688 380, 686 402, 696 418 C 708 434, 728 436, 736 420 C 744 402, 736 380, 722 368 C 714 361, 707 361, 700 368 Z" stroke={INK} strokeWidth="1.3" />
        {/* Malay peninsula + islands, right side */}
        <path className="sketch-line" pathLength={1} style={{ animationDelay: "0.3s" }} d="M 1130 -20 C 1120 40, 1128 92, 1148 140 C 1166 186, 1181 230, 1173 280 C 1167 320, 1151 356, 1159 396 C 1167 430, 1186 456, 1206 470" stroke={INK} strokeWidth="1.4" />
        <path className="sketch-line" pathLength={1} style={{ animationDelay: "0.7s" }} d="M 1238 500 C 1264 530, 1300 570, 1346 602" stroke={INK} strokeWidth="1.3" />
        {/* Africa's east coast, left edge */}
        <path className="sketch-line" pathLength={1} style={{ animationDelay: "0.4s" }} d="M 60 -20 C 90 80, 120 180, 128 280 C 136 380, 120 480, 80 570 C 55 626, 30 662, 8 692" stroke={INK} strokeWidth="1.4" />
        {/* Madagascar */}
        <path className="sketch-line" pathLength={1} style={{ animationDelay: "0.85s" }} d="M 150 600 C 138 620, 134 660, 146 690 C 158 715, 176 712, 184 685 C 192 655, 186 622, 172 604 C 164 596, 157 594, 150 600 Z" stroke={INK} strokeWidth="1.2" />
        {/* Australia hint, bottom right */}
        <path className="sketch-line" pathLength={1} style={{ animationDelay: "1s" }} d="M 1318 762 C 1350 740, 1402 736, 1448 758" stroke={INK_SOFT} strokeWidth="1.3" />
      </g>

      {/* the Maldives — a chain of atoll rings running south */}
      <g className="sketch-late" style={{ animationDelay: "1.4s" }} fill="none" stroke={GOLD_INK} strokeWidth="1.1" strokeDasharray="2 3">
        {[[612, 402, 5], [605, 442, 4], [599, 486, 5.5], [595, 530, 4], [601, 570, 3.5]].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>

      {/* sea labels, old-map style */}
      <g className="sketch-late" style={{ animationDelay: "1.7s" }} fontFamily="var(--font-serif)" fontStyle="italic" fill="rgba(22,36,60,.16)" stroke="none">
        <text x="800" y="628" fontSize="17" letterSpacing="4">Indian Ocean</text>
        <text x="880" y="240" fontSize="12" letterSpacing="3">Bay of Bengal</text>
      </g>

      {/* rolling waves scattered in the open sea */}
      <g className="sketch-late" style={{ animationDelay: "1.5s" }} fill="none" stroke={INK_SOFT} strokeWidth="1.1" strokeLinecap="round">
        {[[340, 470], [430, 660], [760, 740], [980, 560], [860, 420], [1120, 690], [260, 300], [1010, 120]].map(([x, y], i) => (
          <path
            key={i}
            className="sea-wave"
            style={{ animationDuration: `${6 + (i % 4)}s`, animationDelay: `${i * 0.9}s` }}
            d={`M ${x} ${y} q 6 -6 12 0 q 6 6 12 0`}
          />
        ))}
      </g>

      {/* dashed air corridors */}
      <g fill="none" strokeDasharray="2 9" strokeLinecap="round">
        <path className="atlas-route" style={{ animationDuration: "16s" }} d="M-60 240 C 320 60, 780 120, 1500 320" stroke="rgba(22,36,60,.10)" strokeWidth="1.1" />
        <path className="atlas-route" style={{ animationDuration: "22s", animationDirection: "reverse" }} d="M-80 620 C 420 460, 900 700, 1520 520" stroke="rgba(143,114,49,.14)" strokeWidth="1.1" />
        <path className="atlas-route" style={{ animationDuration: "30s" }} d="M120 960 C 460 700, 1040 860, 1380 -40" stroke="rgba(22,36,60,.07)" strokeWidth="1" />
      </g>

      {/* waypoints along the corridors */}
      <g stroke={GOLD_INK} fill="none" strokeWidth="1">
        {[
          [320, 150], [780, 133], [1180, 220],
          [420, 512], [900, 622], [1240, 574],
          [460, 700], [1040, 630]
        ].map(([x, y], i) => (
          <g key={i} className="atlas-waypoint" style={{ animationDuration: `${4.5 + (i % 3) * 1.4}s`, animationDelay: `${i * 0.7}s` }}>
            {i % 3 === 0 && (
              <circle className="waypoint-sonar" cx={x} cy={y} r="20" stroke="rgba(143,114,49,.4)" style={{ animationDelay: `${i * 1.1}s` }} />
            )}
            <circle cx={x} cy={y} r="4.5" />
            <line x1={x - 9} y1={y} x2={x - 5} y2={y} />
            <line x1={x + 5} y1={y} x2={x + 9} y2={y} />
            <line x1={x} y1={y - 9} x2={x} y2={y - 5} />
            <line x1={x} y1={y + 5} x2={x} y2={y + 9} />
          </g>
        ))}
      </g>

      {/* compass rose, top right */}
      <g transform="translate(1268 148)" stroke={GOLD_INK} fill="none">
        <circle r="54" strokeWidth="1" />
        <circle className="atlas-rose-dash" r="40" strokeWidth="0.8" strokeDasharray="1 6" />
        <circle r="3" fill="rgba(143,114,49,.35)" stroke="none" />
        {[0, 45, 90, 135].map((deg) => (
          <line key={deg} x1="0" y1="-52" x2="0" y2="-42" transform={`rotate(${deg})`} strokeWidth="1" />
        ))}
        <path className="atlas-needle" d="M0 -34 L6 0 L0 34 L-6 0 Z" fill="rgba(143,114,49,.16)" stroke={GOLD_INK} strokeWidth="0.8" />
        <text y="-62" textAnchor="middle" fontSize="10" fill="rgba(143,114,49,.45)" fontFamily="var(--font-mono)" stroke="none">
          N
        </text>
      </g>

      {/* edge latitude ticks */}
      <g stroke="rgba(22,36,60,.12)" strokeWidth="1">
        {[90, 210, 330, 450, 570, 690, 810].map((y) => (
          <line key={y} x1="0" y1={y} x2={y % 180 === 90 ? 22 : 12} y2={y} />
        ))}
        {[130, 320, 510, 700].map((y) => (
          <line key={`r${y}`} x1="1440" y1={y} x2="1424" y2={y} />
        ))}
      </g>
    </svg>
  );
}

// The pull quote, written in as you arrive — each word inks in from a soft
// blur, left to right, driven by scroll (so it "signs" forward as the
// section crosses the viewport), and the pen-stroke rules draw out last.
function SignedQuote({ text, attribution }: { text: string; attribution: string }) {
  const ref = useRef<HTMLElement | null>(null);
  const figureRef = useRef<HTMLElement | null>(null);
  const [started, setStarted] = useState(false);
  const words = useMemo(() => text.split(" "), [text]);
  // Trigger only once the quote TEXT itself is well inside the viewport
  // (not the section's edge — that fired while the words were still below
  // the fold, so the writing was half-done before it could be seen). Then
  // the words write at a fixed hand-signing pace.
  useEffect(() => {
    if (started) return;
    const check = () => {
      const el = figureRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      if (vh > 0 && r.top < vh * 0.78 && r.top > vh * -0.2) setStarted(true);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [started]);
  const wordDelay = 0.18; // seconds per word — the signing pace

  return (
    <section
      ref={ref}
      id="cd-quote"
      data-tier2-stop="cd-quote"
      className="relative flex min-h-[72svh] w-full items-center justify-center overflow-hidden px-5"
    >
      <div
        data-stop-wash
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{ background: "radial-gradient(ellipse 62% 48% at 50% 52%, rgba(200,162,76,.2), transparent 70%)" }}
      />
      <figure ref={figureRef} className="relative max-w-[860px] text-center">
        <div
          className={`quote-word font-serif text-[64px] leading-none text-gold-deep/60 sm:text-[88px] ${started ? "quote-word-in" : ""}`}
        >
          “
        </div>
        <blockquote className="font-serif text-[clamp(26px,4.4vw,52px)] font-light italic leading-[1.25] text-navy">
          {words.map((word, i) => (
            <span
              key={i}
              className={`quote-word inline-block whitespace-pre ${started ? "quote-word-in" : ""}`}
              style={{ animationDelay: started ? `${0.4 + i * wordDelay}s` : undefined }}
            >
              {word}
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
        </blockquote>
        <figcaption
          className={`quote-attr mt-7 flex items-center justify-center gap-4 text-[9px] uppercase tracking-[0.3em] text-gold-deep ${started ? "quote-attr-in" : ""}`}
          style={{ animationDelay: started ? `${0.65 + words.length * wordDelay}s` : undefined }}
        >
          <span className="h-px w-10 bg-gold/50" />
          {attribution}
          <span className="h-px w-10 bg-gold/50" />
        </figcaption>
      </figure>
    </section>
  );
}

// "The Essentials" — the practical information, dealt as a deck: each card
// is sticky at a slightly lower offset than the last, so scrolling lays
// them one over another like sheets on a navigator's desk. Cards tilt in
// on first sight; a covered card eases back and dims as the next lands.
// A different motion from everything else on the page, and it holds any
// number of cards.
function EssentialsStack({ cards, country }: { cards: EssentialCard[]; country: string }) {
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [seen, setSeen] = useState<boolean[]>(() => cards.map((_, i) => i === 0));
  const [covers, setCovers] = useState<number[]>(() => cards.map(() => 0));

  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight || 1;
      setSeen((prev) => {
        let changed = false;
        const next = prev.slice();
        cardRefs.current.forEach((el, i) => {
          if (!el || next[i]) return;
          if (el.getBoundingClientRect().top < vh * 0.82) {
            next[i] = true;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
      const cov = cardRefs.current.map((el, i) => {
        const nxt = cardRefs.current[i + 1];
        if (!el || !nxt) return 0;
        const a = el.getBoundingClientRect();
        const b = nxt.getBoundingClientRect();
        return clamp((a.bottom - b.top) / Math.max(1, a.height), 0, 1);
      });
      setCovers((prev) => (cov.some((v, i) => Math.abs(v - (prev[i] ?? 0)) > 0.02) ? cov : prev));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [cards.length]);

  return (
    <section id="cd-essentials" data-tier2-stop="cd-essentials" className="relative w-full px-5 pb-14 pt-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[1080px]">
        <div data-stop-text className="text-center opacity-0">
          <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-deep">The essentials</div>
          <h2 className="mt-3 font-serif text-[clamp(34px,5.6vw,64px)] font-light leading-[1.0]">
            Before you pack
          </h2>
          <p className="mx-auto mt-4 max-w-[460px] text-[13px] font-light leading-[1.85] text-navy/60">
            The practical side of {country}, one sheet at a time.
          </p>
        </div>

        <div className="mt-14 grid gap-8">
          {cards.map((card, i) => (
            <div
              key={card.title}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="sm:sticky"
              style={{
                top: `calc(110px + ${i * 30}px)`,
                zIndex: i + 1,
                transform: `scale(${1 - (covers[i] ?? 0) * 0.045}) translateY(${-(covers[i] ?? 0) * 8}px)`,
                filter: `brightness(${1 - (covers[i] ?? 0) * 0.07})`,
                transition: "transform 160ms linear, filter 160ms linear"
              }}
            >
              <div
                className={`grid gap-6 rounded-2xl border border-gold/40 bg-cream px-6 py-8 shadow-[0_26px_70px_rgba(22,36,60,.16)] sm:px-10 sm:py-10 md:grid-cols-[auto_1fr_auto] md:gap-10 ${
                  seen[i] ? "essential-enter" : "essential-hidden"
                }`}
              >
                <div className="flex items-start gap-4 md:block">
                  <span className="font-serif text-[54px] font-light leading-none text-gold/60 sm:text-[68px]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-[clamp(24px,3vw,36px)] font-light leading-[1.05] text-navy">{card.title}</h3>
                  <p className="mt-3 max-w-[520px] text-[13.5px] font-light leading-[1.85] text-navy/70">{card.copy}</p>
                </div>
                <div className="flex flex-row flex-wrap gap-x-8 gap-y-4 border-t border-gold/25 pt-5 md:min-w-[170px] md:flex-col md:border-l md:border-t-0 md:pl-8 md:pt-0">
                  {card.points.map(([label, value]) => (
                    <div key={label}>
                      <div className="text-[8px] uppercase tracking-[0.2em] text-gold-deep/75">{label}</div>
                      <div className="mt-1 font-serif text-[17px] font-light leading-[1.1] text-navy/85">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// The gallery: every image the country's data holds — stay galleries,
// posters, the journey's frames — deduplicated into one editorial wall,
// with a full-screen lightbox. Fully data-driven: new images added to any
// stay or day (via Sanity later) appear here automatically.
function GallerySection({
  page,
  group
}: {
  page: NonNullable<ReturnType<typeof getCountryPage>>["page"];
  group: NonNullable<ReturnType<typeof getCountryPage>>["group"];
}) {
  const images = useMemo(() => {
    const all = [
      ...group.entries.flatMap((e) => (e.gallery?.length ? e.gallery : [e.poster])),
      ...page.days.map((d) => `/media/poster/${d.slug}.jpg`),
      `/media/poster/${page.heroSlug}.jpg`
    ];
    return [...new Set(all)];
  }, [page, group]);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((o) => (o === null ? o : (o + 1) % images.length));
      if (e.key === "ArrowLeft") setOpen((o) => (o === null ? o : (o - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, images.length]);

  // varied aspect rhythm so equal-sized sources still read editorial
  const aspects = ["aspect-[4/5]", "aspect-square", "aspect-[3/4]", "aspect-[16/11]", "aspect-[4/5]", "aspect-[16/11]"];

  return (
    <section id="cd-gallery" data-tier2-stop="cd-gallery" className="relative w-full px-5 pb-10 pt-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[1200px]">
        <div data-stop-text className="opacity-0">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-deep">The gallery</div>
              <h2 className="mt-3 font-serif text-[clamp(34px,5.6vw,64px)] font-light leading-[1.0]">
                {page.country}, framed
              </h2>
            </div>
            <div className="hidden font-mono text-[8.5px] uppercase tracking-[0.24em] text-navy/45 sm:block">
              {String(images.length).padStart(2, "0")} frames · tap to open
            </div>
          </div>

          <div className="mt-10 columns-2 gap-4 md:columns-3 [&>button]:mb-4">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setOpen(i)}
                className={`group relative block w-full overflow-hidden rounded-lg border border-navy/12 shadow-[0_16px_44px_rgba(22,36,60,.14)] ${aspects[i % aspects.length]}`}
              >
                <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
                <span className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/15" />
                <span className="absolute bottom-2.5 left-3 font-mono text-[8px] uppercase tracking-[0.2em] text-white/0 transition-colors duration-500 group-hover:text-white/85">
                  {String(i + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* lightbox */}
      {open !== null && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/[0.96] backdrop-blur-md" onClick={() => setOpen(null)}>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(null)}
            className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-white/25 text-white/70 transition-colors hover:border-gold/60 hover:text-gold-light"
          >
            <span className="text-[13px]">✕</span>
          </button>
          <button
            type="button"
            aria-label="Previous"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => (o === null ? o : (o - 1 + images.length) % images.length));
            }}
            className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-gold/60 hover:text-gold-light sm:left-8"
          >
            ←
          </button>
          <figure className="max-h-[82svh] max-w-[86vw]" onClick={(e) => e.stopPropagation()}>
            <img src={images[open]} alt="" className="max-h-[76svh] w-auto rounded-lg border border-white/15 object-contain shadow-[0_40px_120px_rgba(0,0,0,.6)]" />
            <figcaption className="mt-4 flex items-center justify-center gap-4 font-mono text-[9px] uppercase tracking-[0.26em] text-gold-light/85">
              <span className="h-px w-8 bg-gold/50" />
              {page.country} — {String(open + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
              <span className="h-px w-8 bg-gold/50" />
            </figcaption>
          </figure>
          <button
            type="button"
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => (o === null ? o : (o + 1) % images.length));
            }}
            className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-gold/60 hover:text-gold-light sm:right-8"
          >
            →
          </button>
        </div>
      )}
    </section>
  );
}
