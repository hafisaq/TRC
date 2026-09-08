import type { MouseEvent } from "react";
import "./route-bar.css";

export type RouteBarItem = { href: string; label: string };

type RouteBarProps = {
  items: RouteBarItem[];
  activeHref: string;
  onSelect: (e: MouseEvent<HTMLAnchorElement>, href: string) => void;
  status: string;
  // dark = on the ink home page, light = on the cream country pages
  tone: "dark" | "light";
  ariaLabel: string;
  navAttrs?: Record<string, string>;
};

// The mobile bottom bar as a route strip: every stop is a waypoint on one
// line, labels alternate above/below so each gets two columns of room, and
// the line fills up to the current stop. Nothing scrolls — the strip always
// fits the viewport, whatever the number of stops.
export default function RouteBar({ items, activeHref, onSelect, status, tone, ariaLabel, navAttrs }: RouteBarProps) {
  const activeIndex = Math.max(0, items.findIndex((item) => item.href === activeHref));
  const fill = items.length > 1 ? (activeIndex / (items.length - 1)) * 100 : 0;

  return (
    <nav aria-label={ariaLabel} className={`route-bar route-bar--${tone}`} {...navAttrs}>
      <div className="route-bar-progress" aria-hidden="true"><span /></div>
      <div className="route-bar-status">{status}</div>
      <ol className="route-bar-track" style={{ "--n": items.length } as React.CSSProperties}>
        <li className="route-bar-line" aria-hidden="true"><span style={{ width: `${fill}%` }} /></li>
        {items.map((item, i) => {
          const state = i === activeIndex ? "is-active" : i < activeIndex ? "is-passed" : "";
          return (
            <li key={item.href} className={`route-bar-stop ${i % 2 ? "is-below" : "is-above"} ${state}`}>
              <a href={item.href} onClick={(e) => onSelect(e, item.href)} aria-current={i === activeIndex ? "location" : undefined}>
                <span className="route-bar-node" aria-hidden="true" />
                <span className="route-bar-label">{item.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
