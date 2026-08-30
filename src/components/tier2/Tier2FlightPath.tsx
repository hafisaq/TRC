import { useLayoutEffect, useRef, useState } from "react";

export type FlightStop = { id: string; theme: "gold" | "white"; coords: string };

type Point = { x: number; y: number };

function buildPath(points: Point[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midY = p0.y + (p1.y - p0.y) / 2;
    d += ` C ${p0.x},${midY} ${p1.x},${midY} ${p1.x},${p1.y}`;
  }
  return d;
}

/**
 * One continuous flight path spanning the whole hero+stops journey,
 * measured in real pixels so the plane's rotation never distorts. Drawn
 * and flown via scroll-scrub in useTier2Animations (id-based lookups),
 * not here — this component only builds the geometry.
 */
export default function Tier2FlightPath({ stops, startId = "tier2-hero" }: { stops: FlightStop[]; startId?: string }) {
  const [geometry, setGeometry] = useState<{ w: number; h: number; d: string; stopPoints: Point[] } | null>(null);
  const lastWidth = useRef(0);
  const lastHeight = useRef(0);
  const lastEndY = useRef(0);

  useLayoutEffect(() => {
    const measure = () => {
      const main = document.querySelector("main");
      const hero = document.getElementById(startId);
      if (!main || !hero) return;
      const w = window.innerWidth;
      const h = main.scrollHeight;
      // A 0-sized viewport (e.g. a not-yet-visible tab) would bake a
      // degenerate zero-length path in permanently, since nothing else
      // forces a re-measure once it's set. Skip and wait for a real size.
      if (w === 0 || h === 0) return;
      // Re-measure on a real width change, a meaningful height change, OR
      // when the final landing point has drifted from where it was drawn.
      // Height matters: fonts and lazy media finishing after the first
      // measure grow the page. The end-anchor check matters even more:
      // layout can redistribute internally (masonry columns, media aspect
      // ratios settling) without changing total height at all, leaving the
      // plane out of sync with the scroll and landing off the boarding
      // pass. Small (<24px) wobble is ignored so observer noise doesn't
      // thrash the SVG. (useTier2Animations watches the path's `d` and
      // rebinds on change, so re-measuring never strands GSAP on stale
      // geometry.)
      const endStop = stops[stops.length - 1];
      const endEl = endStop ? document.getElementById(endStop.id) : null;
      const endAnchor = endEl?.querySelector<HTMLElement>("[data-flight-node]") ?? endEl;
      let liveEndY = lastEndY.current;
      if (endAnchor) {
        const r = endAnchor.getBoundingClientRect();
        liveEndY = r.top + window.scrollY + r.height / 2;
      }
      if (
        w === lastWidth.current &&
        Math.abs(h - lastHeight.current) < 24 &&
        Math.abs(liveEndY - lastEndY.current) < 10
      ) {
        return;
      }
      lastWidth.current = w;
      lastHeight.current = h;

      // Document-true Y via rect + scrollY — offsetTop is relative to the
      // nearest positioned ancestor and collapses for stops nested inside a
      // `relative` wrapper (e.g. timeline rows), which made the path double
      // back on itself.
      const docY = (el: Element, frac = 0.5) => {
        const r = el.getBoundingClientRect();
        return r.top + window.scrollY + r.height * frac;
      };
      const heroPoint: Point = { x: w / 2, y: docY(hero, 0.42) };
      const stopPoints: Point[] = stops.map((s, i) => {
        const el = document.getElementById(s.id);
        if (!el) return { x: w / 2, y: heroPoint.y };
        // A stop may declare an exact landing anchor (e.g. a timeline node):
        // the plane then lands ON it, and consecutive anchors sharing an x
        // make the path fly that line dead straight.
        const anchor = el.querySelector<HTMLElement>("[data-flight-node]");
        if (anchor) {
          const r = anchor.getBoundingClientRect();
          return { x: r.left + window.scrollX + r.width / 2, y: r.top + window.scrollY + r.height / 2 };
        }
        const wiggle = w * 0.09;
        return { x: w / 2 + (i % 2 === 0 ? -wiggle : wiggle), y: docY(el) };
      });

      lastEndY.current = stopPoints[stopPoints.length - 1]?.y ?? 0;
      setGeometry({ w, h, d: buildPath([heroPoint, ...stopPoints]), stopPoints });
    };

    measure();
    window.addEventListener("resize", measure);
    // The guard above makes measure() a cheap no-op when nothing moved, so
    // it can run per scroll tick — this is what catches internal layout
    // shifts that never change the document's total size.
    window.addEventListener("scroll", measure, { passive: true });

    // ResizeObserver as the recovery path instead of requestAnimationFrame:
    // rAF is suspended for hidden/backgrounded tabs, so a tab that becomes
    // visible/sized later would otherwise never get a corrected geometry.
    const ro = new ResizeObserver(() => measure());
    ro.observe(document.documentElement);

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [stops, startId]);

  if (!geometry) return null;

  return (
    <svg
      id="tier2-flight-svg"
      className="absolute top-0 left-0 z-[2] pointer-events-none opacity-55 sm:opacity-100"
      width={geometry.w}
      height={geometry.h}
      viewBox={`0 0 ${geometry.w} ${geometry.h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        id="tier2-flight-path"
        d={geometry.d}
        stroke="#e3c682"
        strokeWidth="1.25"
        fill="none"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
      />

      {stops.map((s, i) => (
        <g key={s.id} id={`tier2-landing-${s.id}`} data-landing transform={`translate(${geometry.stopPoints[i].x} ${geometry.stopPoints[i].y})`}>
          <circle data-landing-glow r="4" fill="#e3c682" opacity="0" />
          <circle data-landing-ring r="4" fill="none" stroke="#e3c682" strokeWidth="1" opacity="0" />
        </g>
      ))}

      <g id="tier2-flight-plane">
        <g transform="rotate(90 12 12) translate(-14 -14) scale(1)">
          <path
            id="tier2-flight-plane-icon"
            fill="#e3c682"
            d="M21,16V14L13,9V3.5C13,2.67 12.33,2 11.5,2C10.67,2 10,2.67 10,3.5V9L2,14V16L10,13.5V19L7.5,20.5V22L11.5,21L15.5,22V20.5L13,19V13.5L21,16Z"
          />
        </g>
      </g>
    </svg>
  );
}
