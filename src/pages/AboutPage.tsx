import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ABOUT } from "../data/about";
import { hasFilm, lqipStyle, posterUrl, videoUrl } from "../lib/media";
import { t } from "../lib/i18n";
import { SETTINGS } from "../lib/cms";
import { scrollToHash } from "../lib/scroll";
import LanguageSwitch from "../components/tier2/LanguageSwitch";
import MobileAppTools from "../components/MobileAppTools";
import RouteBar from "../components/RouteBar";
import JourneyFooter from "../components/JourneyFooter";
import { MediaVideo } from "../components/Media";
import "./about-page.css";

gsap.registerPlugin(ScrollTrigger);

const PREVIEW_FILMS = ["bali-coast", "alpine-ridge", "reef-dive"];

function Film({ slug, active, priority = false }: { slug: string; active: boolean; priority?: boolean }) {
  return <>
    <span aria-hidden="true" style={lqipStyle(slug)} className="lqip-layer absolute inset-0" />
    <MediaVideo src={hasFilm(slug) ? videoUrl(slug) : undefined} poster={posterUrl(slug)} active={active} priority={priority} />
  </>;
}

function goToSection(target: HTMLElement, smooth: boolean) {
  const clearance = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  if (!smooth) {
    window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - clearance, behavior: "instant" });
    return;
  }
  // scrollToHash reads this live and drives Lenis when it is running
  target.setAttribute("data-scroll-clearance", String(clearance));
  scrollToHash(`#${target.id}`);
}

// Content stays in document flow; only the film window is sticky. Extra CMS
// paragraphs/chapters grow naturally without artificial pin spacers.
export default function AboutPage() {
  const root = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLElement>(null);
  const [active, setActive] = useState("about-hero");
  const [chapter, setChapter] = useState(0);
  const [heroView, setHeroView] = useState(0);
  const [paused, setPaused] = useState(false);
  const scenery = ABOUT.films.length ? ABOUT.films : PREVIEW_FILMS;
  const heroFilms = [ABOUT.heroSlug, ...scenery.slice(0, 2)];
  const sections = useMemo(() => [
    { id: "about-hero", label: t("page.overview") },
    ...ABOUT.sections.map((s, i) => ({ id: `about-s${i}`, label: s.title })),
  ], []);

  useEffect(() => {
    const el = root.current;
    const content = main.current;
    if (!el || !content) return;
    const header = el.querySelector<HTMLElement>("#tier2-nav")!;
    const stage = el.querySelector<HTMLElement>(".about-journal-stage");
    const chapters = [...el.querySelectorAll<HTMLElement>(".about-chapter")];
    let frame = 0;
    let headerHeight = header.offsetHeight;
    el.style.setProperty("--about-header", `${headerHeight}px`);
    let disposed = false;
    const update = () => {
      frame = 0;
      const narrow = window.matchMedia("(max-width: 899px)").matches;
      const pinned = stage && getComputedStyle(stage).position === "sticky";
      const focusY = narrow ? headerHeight + (pinned ? stage.offsetHeight : 0) + 85 : innerHeight * .55;
      let current = -1;
      chapters.forEach((section, i) => { if (section.getBoundingClientRect().top <= focusY) current = i; });
      setChapter(Math.max(0, current));
      setActive(current < 0 ? "about-hero" : `about-s${current}`);
      const progress = Math.max(0, Math.min(1, -content.getBoundingClientRect().top / Math.max(1, content.offsetHeight - innerHeight)));
      el.style.setProperty("--about-progress", String(progress));
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(() => {
      headerHeight = header.offsetHeight;
      el.style.setProperty("--about-header", `${headerHeight}px`);
      queue();
    });
    resize.observe(header);
    resize.observe(content);
    if (stage) resize.observe(stage);
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue, { passive: true });
    update();
    document.fonts.ready.then(() => {
      if (disposed) return;
      const target = document.getElementById(location.hash.slice(1));
      if (target && el.contains(target)) goToSection(target, false);
      queue();
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, []);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        gsap.from(".about-hero-title > span", { y: 46, opacity: 0, duration: 1.2, stagger: .15, ease: "power3.out", delay: .1 });
        gsap.from(".about-hero-tagline, .about-hero-bottom", { opacity: 0, y: 16, duration: .8, stagger: .12, delay: .45 });
        gsap.to(".about-hero-films", { yPercent: 12, ease: "none", scrollTrigger: { trigger: "#about-hero", start: "top top", end: "bottom top", scrub: true } });
        root.current?.querySelectorAll<HTMLElement>("[data-about-reveal]").forEach(el => {
          gsap.from(el, { y: 26, opacity: 0, duration: .8, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 94%", once: true } });
        });
      }, root);
      return () => context.revert();
    });
    return () => mm.revert();
  }, []);

  const jump = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const target = document.getElementById(href.slice(1));
    if (target) goToSection(target, !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    history.replaceState(null, "", href);
  };

  return (
    <div ref={root} className="about-page">
      <header id="tier2-nav" className="about-header">
        <a href="/" className="about-brand" aria-label="The Retreat Collection">
          <img src="/media/brand/01143b.png" alt="" width={697} height={226} decoding="async" fetchPriority="high" />
        </a>
        <MobileAppTools tone="dark" />
        {SETTINGS.showLanguageSwitch && <div className="mobile-language-switch"><LanguageSwitch tone="dark" /></div>}
        <nav className="about-desktop-nav" aria-label="Page sections">
          <a href="/" className="about-home">{t("page.home")} <span aria-hidden="true">/</span> {t("nav.about")}</a>
          {sections.map(s => <a key={s.id} href={`#${s.id}`} onClick={e => jump(e, `#${s.id}`)} aria-current={active === s.id ? "location" : undefined}>{s.label}</a>)}
          <a href="/#tier2-enquire">{t("nav.enquire")}</a>
          {SETTINGS.showLanguageSwitch && <LanguageSwitch tone="dark" />}
        </nav>
      </header>
      <RouteBar items={[...sections.map(s => ({ href: `#${s.id}`, label: s.label })), { href: "/#tier2-enquire", label: t("nav.enquire") }]}
        activeHref={`#${active}`} onSelect={(e, href) => { if (href.startsWith("#")) jump(e, href); }}
        status={t("about.story")} tone="light" ariaLabel="Page sections" />

      <main ref={main}>
        <section id="about-hero" className="about-hero">
          <div className="about-hero-films" aria-hidden="true">
            {heroFilms.map((slug, i) => <div key={`${slug}-${i}`} className={`about-film-layer ${heroView === i ? "is-active" : ""}`}>
              <Film slug={slug} active={heroView === i && !paused} priority={i === 0} />
            </div>)}
          </div>
          <div className="about-hero-shade" />
          <div className="about-hero-content">
            <div className="about-eyebrow about-hero-eyebrow"><span>{t("about.story")}</span></div>
            <h1 className="about-hero-title"><span>{t("about.brand1")}</span><span className="about-collection">{t("about.brand2")}</span></h1>
            <p className="about-hero-tagline">{ABOUT.tagline[0]}<br /><em>{ABOUT.tagline[1]}</em></p>
            <div className="about-hero-bottom">
              <a className="about-story-link" href="#about-intro" onClick={e => jump(e, "#about-intro")}><ArrowDown size={19} aria-hidden="true" /><span>{t("about.begin")}</span></a>
              <div className="about-film-controls">
                <span className="about-view-label">{t("about.view")} <span dir="ltr">{String(heroView + 1).padStart(2, "0")} / {String(heroFilms.length).padStart(2, "0")}</span></span>
                <button type="button" title={t("about.change")} aria-label={t("about.change")} onClick={() => setHeroView(i => (i + 1) % heroFilms.length)}><ArrowRight size={19} aria-hidden="true" /></button>
                <button type="button" title={paused ? t("about.play") : t("about.pause")} aria-label={paused ? t("about.play") : t("about.pause")} aria-pressed={paused} onClick={() => setPaused(p => !p)}>{paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}</button>
              </div>
            </div>
          </div>
        </section>

        <section id="about-intro" className="about-intro">
          <div className="about-intro-heading about-eyebrow" data-about-reveal><span>{t("about.perspective")}</span><span dir="ltr">01 / {String(ABOUT.sections.length + 2).padStart(2, "0")}</span></div>
          <div className="about-intro-copy">
            {ABOUT.intro.map((p, i) => <p key={i} data-about-reveal className={i === 0 ? "about-intro-lead" : "about-intro-paragraph"}>{p}</p>)}
          </div>
          <div className="about-origin" data-about-reveal><span aria-hidden="true" />{t("about.origin")}</div>
        </section>

        {ABOUT.sections.length > 0 && <div className="about-journal">
          <div className="about-journal-stage">
            {ABOUT.sections.map((s, i) => <div key={s._key ?? i} className={`about-film-layer ${chapter === i ? "is-active" : ""}`}>
              <Film slug={s.mediaSlug ?? scenery[i % scenery.length]} active={chapter === i && !paused} />
            </div>)}
            <div className="about-journal-shade" />
            <div className="about-journal-meta"><span>{t("about.journal")}</span><span dir="ltr">{String(chapter + 1).padStart(2, "0")} / {String(ABOUT.sections.length).padStart(2, "0")}</span></div>
            <div className="about-film-caption" key={chapter}>
              <span className="about-film-number" aria-hidden="true">{String(chapter + 1).padStart(2, "0")}</span>
              <p>{ABOUT.sections[chapter]?.title}</p>
            </div>
            <div className="about-chapter-selector" aria-label={t("about.journal")}>
              {ABOUT.sections.map((s, i) => <a key={s._key ?? i} href={`#about-s${i}`} onClick={e => jump(e, `#about-s${i}`)} title={s.title} aria-label={s.title} aria-current={chapter === i ? "location" : undefined}><span>{String(i + 1).padStart(2, "0")}</span><i aria-hidden="true" /></a>)}
            </div>
          </div>
          <div className="about-chapters">
            {ABOUT.sections.map((s, i) => <section key={s._key ?? i} id={`about-s${i}`} className="about-chapter">
              <div className="about-eyebrow"><span>{t("about.chapter")}</span><span dir="ltr">{String(i + 1).padStart(2, "0")}</span></div>
              <h2 data-about-reveal>{s.title}</h2>
              {s.paragraphs.map((p, pi) => <p key={pi} data-about-reveal className={p.includes("\n") ? "about-stanza" : ""}>{p}</p>)}
              <span className="about-chapter-end" aria-hidden="true" />
            </section>)}
          </div>
        </div>}

        {ABOUT.closing.length > 0 && <section id="about-invitation" className="about-invitation">
          <Film slug={ABOUT.heroSlug} active={!paused} />
          <div className="about-invitation-shade" />
          <div className="about-invitation-copy">
            <span className="about-eyebrow" data-about-reveal>{t("about.invitation")}</span>
            {ABOUT.closing.map((p, i) => <p key={i} data-about-reveal>{p}</p>)}
            <a href="/#tier2-enquire" className="about-enquire" data-about-reveal><span>{t("about.enquire")}</span><ArrowUpRight size={24} aria-hidden="true" /></a>
          </div>
        </section>}
      </main>
      <JourneyFooter departureHref="#about-hero" />
    </div>
  );
}
