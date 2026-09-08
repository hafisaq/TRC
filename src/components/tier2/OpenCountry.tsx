import { useEffect, useRef, type MouseEventHandler, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./open-country.css";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  id: string;
  indexLabel: string;
  eyebrow: string;
  title: [string, string];
  copy: string;
  theme: "gold" | "white";
  cta: { href: string; label: string; onClick?: MouseEventHandler<HTMLAnchorElement> };
  children: ReactNode;
};

export default function OpenCountry({ id, indexLabel, eyebrow, title, copy, theme, cta, children }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const apertureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(apertureRef.current, { clipPath: "inset(0% 12% 0% 12%)" }, {
        clipPath: "inset(0% 0% 0% 0%)",
        ease: "none",
        scrollTrigger: { trigger: sectionRef.current, start: "top 85%", end: "top 12%", scrub: true, invalidateOnRefresh: true },
      });
    });
    return () => media.revert();
  }, []);

  return <section ref={sectionRef} id={id} data-tier2-stop={id} data-stop-theme={theme} className="open-country">
    <header data-stop-text className="open-country-masthead opacity-0">
      <div className="open-country-meta"><span>{eyebrow}</span><span>{indexLabel}</span></div>
      <h2 data-stop-title><span>{title[0]}</span> <em>{title[1]}</em></h2>
    </header>

    <div className="open-country-film">
      <div ref={apertureRef} className="open-country-aperture">
        <div data-stop-video className="open-country-media opacity-0">{children}</div>
      </div>
      <span data-flight-node aria-hidden="true" className="open-country-flight-node" />
    </div>

    <div data-stop-text className="open-country-caption opacity-0">
      <span aria-hidden="true" className="open-country-rule" />
      <p>{copy}</p>
      <a href={cta.href} onClick={cta.onClick}>{cta.label}</a>
    </div>
  </section>;
}
