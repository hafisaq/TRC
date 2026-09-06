import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { CountryDay } from "../data/regions/countryContent";
import { hasFilm, lqipVar, posterUrl, videoUrl } from "../lib/media";
import { scrollToHash } from "../lib/scroll";
import { t } from "../lib/i18n";
import { MediaVideo } from "./Media";
import "./signature-journey.css";

const number = (index: number) => String(index + 1).padStart(2, "0");

export default function SignatureJourney({ days, country }: { days: CountryDay[]; country: string }) {
  const runwayRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const initialHashHandled = useRef(false);
  const [active, setActive] = useState(0);
  const [layout, setLayout] = useState({ pinned: false, top: 80, bottom: 0, height: 700, step: 540, navigation: 64 });

  useLayoutEffect(() => {
    const runway = runwayRef.current;
    const stage = stageRef.current;
    if (!runway || !stage) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const header = document.getElementById("tier2-nav");
    const bottomNav = document.querySelector<HTMLElement>('nav[data-country-bottom-nav]');
    let frame = 0;
    const measure = () => {
      const top = Math.ceil(header?.getBoundingClientRect().height || 0);
      const bottom = bottomNav && getComputedStyle(bottomNav).display !== "none" ? Math.ceil(bottomNav.getBoundingClientRect().height) : 0;
      const height = (viewportRef.current?.offsetHeight || window.innerHeight) - top - bottom;
      const copyHeight = Math.max(0, ...Array.from(stage.querySelectorAll<HTMLElement>(".signature-copy p"), el => el.offsetHeight));
      const titleHeight = Math.max(0, ...Array.from(stage.querySelectorAll<HTMLElement>(".signature-title"), el => el.offsetHeight));
      const compact = window.innerWidth < 640;
      const notesHeight = copyHeight + (compact ? 36 : 56);
      stage.style.setProperty("--signature-notes-height", `${notesHeight}px`);
      stage.style.setProperty("--signature-title-space", `${titleHeight + 110}px`);
      // Let long CMS copy, zoomed type, and short landscape screens breathe
      // in normal document flow instead of trapping content in a fixed frame.
      const required = notesHeight + (navRef.current?.offsetHeight || 72) + Math.max(compact ? 230 : 300, titleHeight + 110);
      const next = { pinned: days.length > 1 && !motion.matches && height >= required, top, bottom, height, step: Math.round(Math.max(360, height * 0.8)), navigation: navRef.current?.offsetHeight || 0 };
      setLayout(previous => Object.keys(next).every(key => previous[key as keyof typeof next] === next[key as keyof typeof next]) ? previous : next);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    [header, bottomNav, navRef.current, viewportRef.current, ...stage.querySelectorAll(".signature-copy p, .signature-title")].forEach(el => el && observer.observe(el));
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
    };
  }, [days]);

  useEffect(() => {
    const runway = runwayRef.current;
    if (!runway || !days.length) return;
    let frame = 0;
    let previousProgress = -1;
    const update = () => {
      frame = 0;
      const rect = runway.getBoundingClientRect();
      if (layout.pinned) {
        const position = Math.max(0, Math.min(days.length - 1, (layout.top - rect.top) / layout.step));
        const index = Math.round(position);
        setActive(previous => previous === index ? previous : index);
        const progress = position / Math.max(1, days.length - 1);
        if (progress !== previousProgress) stageRef.current?.style.setProperty("--signature-progress", String(progress));
        previousProgress = progress;
      } else if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const panels = Array.from(runway.querySelectorAll<HTMLElement>(".signature-panel"));
        const readingLine = layout.top + (window.innerHeight - layout.top) * 0.4;
        let index = 0;
        panels.forEach((panel, i) => { if (panel.getBoundingClientRect().top <= readingLine) index = i; });
        setActive(previous => previous === index ? previous : index);
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", schedule, { passive: true });
    update();
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); };
  }, [days.length, layout]);

  useEffect(() => {
    const nav = navRef.current;
    const link = nav?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!nav || !link) return;
    // Keep the current stop in the horizontal navigator without moving
    // the page vertically (scrollIntoView would break the pinned sequence).
    const box = nav.getBoundingClientRect();
    const item = link.getBoundingClientRect();
    const delta = item.left < box.left ? item.left - box.left : item.right > box.right ? item.right - box.right : 0;
    if (delta) nav.scrollBy({ left: delta, behavior: "instant" });
  }, [active]);

  useEffect(() => {
    let frame = 0;
    const followHash = () => {
      const match = /^#cd-day-(\d+)$/.exec(window.location.hash);
      if (!match || Number(match[1]) >= days.length) return;
      cancelAnimationFrame(frame);
      // The route and its CMS data mount asynchronously. Wait for the
      // pinned geometry before resolving a shared signature URL.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          const target = document.getElementById(`cd-day-${Number(match[1])}`);
          if (!target) return;
          const clearance = layout.top + (layout.pinned ? 0 : navRef.current?.offsetHeight || 0);
          window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - clearance, behavior: "instant" });
          initialHashHandled.current = true;
        });
      });
    };
    if (!initialHashHandled.current) followHash();
    window.addEventListener("hashchange", followHash);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange", followHash); };
  }, [days.length, layout.pinned, layout.top, layout.step]);

  if (!days.length) return null;
  const style = {
    "--signature-top": `${layout.top}px`,
    "--signature-height": `${layout.height}px`,
    "--signature-step": `${layout.step}px`,
    "--signature-travel": `${Math.max(0, days.length - 1) * layout.step}px`,
  } as CSSProperties;

  return (
    <section className={`signature-journey ${layout.pinned ? "is-pinned" : "is-linear"}`} style={style} aria-labelledby="signature-heading">
      <div ref={viewportRef} className="signature-viewport" aria-hidden="true" />
      <header className="signature-intro">
        <div>
          <p className="signature-eyebrow">{t("page.theSignatures")}</p>
          <h2 id="signature-heading">{t("page.signatureBySignature", { country })}</h2>
        </div>
        <p className="signature-intro-copy">{t("page.notItinerary")}</p>
      </header>

      <div ref={runwayRef} className="signature-runway" data-flight-hold={layout.pinned ? "" : undefined}>
        {layout.pinned && <div className="signature-positions" aria-hidden="true">
          {days.map((day, i) => <div key={`${day.slug}-${i}`} id={`cd-day-${i}`} data-tier2-stop={`cd-day-${i}`}
            data-scroll-clearance={layout.top}
            className="signature-position" style={{ top: i * layout.step }}>
            <span data-flight-node className="signature-flight-node" />
          </div>)}
        </div>}

        <div ref={stageRef} className="signature-stage" data-flight-stage>
          <div className="signature-panels">
            {days.map((day, i) => <article key={`${day.slug}-${i}`} id={layout.pinned ? undefined : `cd-day-${i}`}
              data-tier2-stop={layout.pinned ? undefined : `cd-day-${i}`}
              data-scroll-clearance={layout.top + (layout.pinned ? 0 : layout.navigation)}
              className={`signature-panel ${i === active ? "is-active" : ""}`}
              aria-hidden={layout.pinned && i !== active ? true : undefined} aria-labelledby={`signature-title-${i}`}>
              {!layout.pinned && <span data-flight-node className="signature-flight-node" />}
              <div className="signature-film" data-flight-focus style={lqipVar(day.slug)}>
                {(!layout.pinned || Math.abs(i - active) <= 1) && <MediaVideo
                  src={hasFilm(day.slug) ? videoUrl(day.slug) : undefined}
                  poster={posterUrl(day.slug, 1920)} active={!layout.pinned || i === active} sizes="100vw"
                  className="signature-media" />}
                <div className="signature-shade" />
                <div className="signature-film-meta"><span>{country}</span><span>{number(i)} / {number(days.length - 1)}</span></div>
                <h3 id={`signature-title-${i}`} className="signature-title">{day.title}</h3>
              </div>
              <div className="signature-copy">
                <span className="signature-number" aria-hidden="true">{number(i)}</span>
                <p>{day.copy}</p>
                <span className="signature-endmark" aria-hidden="true" />
              </div>
            </article>)}
          </div>

          <nav ref={navRef} className="signature-navigator" aria-label={t("page.signatures")}>
            {days.map((day, i) => <a key={`${day.slug}-${i}`} href={`#cd-day-${i}`} aria-current={active === i ? "step" : undefined}
              onClick={event => {
                event.preventDefault();
                const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                if (motion) {
                  const target = document.getElementById(`cd-day-${i}`);
                  if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - layout.top - (navRef.current?.offsetHeight || 0), behavior: "instant" });
                } else scrollToHash(`#cd-day-${i}`);
                history.replaceState(null, "", `#cd-day-${i}`);
              }}>
              <span className="signature-nav-number">{number(i)}</span><span>{day.title}</span>
            </a>)}
          </nav>
          <div className="signature-progress" aria-hidden="true"><span /></div>
        </div>
      </div>
    </section>
  );
}
