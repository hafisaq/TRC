import { useEffect, useMemo, useState } from "react";
import { ABOUT } from "../data/about";
import { hasFilm, lqipStyle, posterUrl, videoUrl } from "../lib/media";
import { scrollToHash } from "../lib/scroll";
import { t } from "../lib/i18n";
import { SETTINGS } from "../lib/cms";
import LanguageSwitch from "../components/tier2/LanguageSwitch";
import MobileAppTools from "../components/MobileAppTools";
import RouteBar from "../components/RouteBar";
import JourneyFooter from "../components/JourneyFooter";
import { MediaVideo } from "../components/Media";

// /about — the client's own story, rendered verbatim from Sanity: tagline
// over the About film, the opening paragraphs, the titled sections, and
// the closing lines that hand over to the boarding pass.
export default function AboutPage() {
  const sections = useMemo(
    () => [
      { id: "about-hero", label: t("page.overview") },
      ...ABOUT.sections.map((s, i) => ({ id: `about-s${i}`, label: s.title }))
    ],
    []
  );
  const [active, setActive] = useState("about-hero");

  useEffect(() => {
    const targets = sections.map(({ id }) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: [0, 0.2, 0.5] }
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  const jump = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    scrollToHash(href);
  };
  const slug = ABOUT.heroSlug;

  return (
    <div className="relative min-h-screen bg-cream text-navy font-sans overflow-x-clip">
      <header
        id="tier2-nav"
        className="fixed inset-x-0 top-0 z-50 border-b border-gold/20 bg-cream-deep/97 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 sm:bg-cream-deep/92 sm:backdrop-blur-xl xl:flex xl:items-center xl:gap-8 xl:px-8 xl:py-5"
      >
        <a href="/" className="mx-auto block w-fit xl:mx-0" aria-label="The Retreat Collection">
          <img src="/media/brand/01143b.png" alt="" width={697} height={226} decoding="async" fetchPriority="high" className="h-auto w-[132px] sm:w-[152px]" />
        </a>
        <MobileAppTools tone="dark" />
        {SETTINGS.showLanguageSwitch && <div className="mobile-language-switch"><LanguageSwitch tone="dark" /></div>}
        <nav className="mt-3 hidden flex-1 items-center justify-end gap-7 xl:flex" aria-label="Page sections">
          <a href="/" className="mr-auto hidden items-center gap-3 text-[9px] tracking-[0.22em] uppercase text-navy/50 transition-colors hover:text-gold-deep lg:flex">
            <span>← {t("page.home")}</span>
            <span className="h-px w-8 bg-gold/45" />
            <span>{t("nav.about")}</span>
          </a>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={(e) => jump(e, `#${s.id}`)} aria-current={active === s.id ? "location" : undefined}
              className={`shrink-0 text-[10px] tracking-[0.24em] uppercase transition-colors hover:text-gold-deep ${active === s.id ? "text-gold-deep" : "text-navy/60"}`}>
              {s.label}
            </a>
          ))}
          <a href="/#tier2-enquire" className="shrink-0 text-[10px] tracking-[0.24em] uppercase text-gold-deep transition-colors hover:text-navy">{t("nav.enquire")}</a>
          {SETTINGS.showLanguageSwitch && <LanguageSwitch tone="dark" />}
        </nav>
      </header>

      <RouteBar
        items={[...sections.map((s) => ({ href: `#${s.id}`, label: s.label })), { href: "/#tier2-enquire", label: t("nav.enquire") }]}
        activeHref={`#${active}`}
        onSelect={(e, href) => { if (href.startsWith("#")) jump(e, href); }}
        status={t("nav.about")}
        tone="light"
        ariaLabel="Page sections"
      />

      <main className="relative z-10">
        {/* HERO — the tagline over the About film */}
        <section id="about-hero" className="relative flex h-[100svh] min-h-[560px] w-full items-end overflow-hidden bg-ink">
          <span aria-hidden="true" style={lqipStyle(slug)} className="lqip-layer absolute inset-0" />
          <MediaVideo src={hasFilm(slug) ? videoUrl(slug) : undefined} poster={posterUrl(slug)} priority />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(14,13,12,.82)_0%,rgba(14,13,12,.35)_45%,rgba(14,13,12,.15)_100%)]" />
          <div className="relative mx-auto w-full max-w-[1280px] px-5 pb-[calc(env(safe-area-inset-bottom)+120px)] sm:px-10 lg:px-16 xl:pb-24">
            <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-light">{t("nav.about")}</div>
            <h1 className="mt-4 font-serif text-[clamp(36px,7vw,84px)] font-light leading-[1.02] text-white">
              {ABOUT.tagline[0]}
              <br />
              <span className="text-gold-light">{ABOUT.tagline[1]}</span>
            </h1>
          </div>
        </section>

        {/* OPENING — the paragraphs the client leads with */}
        <section className="relative w-full px-5 py-20 sm:px-10 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-[760px]">
            {ABOUT.intro.map((p, i) => (
              <p key={i} className={`whitespace-pre-line font-light leading-[1.85] text-navy/80 ${i === 0 ? "font-serif text-[clamp(22px,3vw,32px)] leading-[1.35] text-navy" : "mt-6 text-[15px] sm:text-[16.5px]"}`}>
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* SECTIONS — titled, alternating the rule side */}
        {ABOUT.sections.map((s, i) => (
          <section key={s.title} id={`about-s${i}`} className={`relative w-full border-t border-gold/25 px-5 py-20 sm:px-10 sm:py-28 lg:px-16 ${i % 2 ? "bg-cream-deep" : ""}`}>
            <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
              <div>
                <div className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-gold-deep">{String(i + 1).padStart(2, "0")}</div>
                <h2 className="mt-4 font-serif text-[clamp(34px,5vw,60px)] font-light leading-[1.02] text-navy">{s.title}</h2>
                <span className="mt-7 block h-px w-14 bg-gold" aria-hidden="true" />
              </div>
              <div className="max-w-[640px]">
                {s.paragraphs.map((p, pi) => (
                  <p key={pi} className={`whitespace-pre-line font-light leading-[1.85] text-navy/80 ${pi ? "mt-6" : ""} ${p.includes("\n") ? "font-serif text-[clamp(19px,2.4vw,26px)] leading-[1.5] text-navy" : "text-[15px] sm:text-[16.5px]"}`}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* CLOSING — the last lines, then the boarding pass */}
        {ABOUT.closing.length > 0 && (
          <section className="relative w-full border-t border-gold/25 bg-ink px-5 py-24 text-center sm:px-10 sm:py-32 lg:px-16">
            <div className="mx-auto max-w-[900px]">
              {ABOUT.closing.map((p, i) => (
                <p key={i} className={`whitespace-pre-line font-serif font-light leading-[1.35] text-white ${i ? "mt-8 text-[clamp(20px,2.6vw,30px)] text-gold-light" : "text-[clamp(24px,3.6vw,44px)]"}`}>{p}</p>
              ))}
              <a href="/#tier2-enquire" className="mt-12 inline-block border-b border-gold-light/60 pb-1.5 text-[10px] uppercase tracking-[0.3em] text-gold-light transition-opacity hover:opacity-70">
                {t("stop.enquireRoute")}
              </a>
            </div>
          </section>
        )}
      </main>
      <JourneyFooter departureHref="#about-hero" />
    </div>
  );
}
