import type { MouseEvent } from "react";
import type { Destination } from "../../data/tier2Destinations";
import { scrollToHash } from "../../lib/scroll";

type Tier2NavProps = {
  destinations: Destination[];
  activeStopId: string;
  routeProgress: number;
  statusText: string;
  onEnquire: () => void;
};

export default function Tier2Nav({ destinations, activeStopId, routeProgress, statusText, onEnquire }: Tier2NavProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href === "#tier2-enquire") {
      onEnquire();
      return;
    }
    scrollToHash(href);
    history.replaceState(null, "", href);
  };
  const navItems = [
    ...destinations.map((destination) => ({ label: destination.navLabel, href: `#${destination.id}` })),
    { label: "Enquire", href: "#tier2-enquire" }
  ];

  return (
    <>
      <header
        id="tier2-nav"
        className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-ink/72 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 backdrop-blur-xl sm:flex sm:items-center sm:gap-8 sm:px-8 sm:py-5"
      >
        <a
          href="#tier2-hero"
          onClick={(e) => handleClick(e, "#tier2-hero")}
          className="mx-auto block w-fit sm:mx-0"
          aria-label="The Retreat Collection"
        >
          <img
            src="/media/brand/retreat-collection-logo-crop.png"
            alt="The Retreat Collection"
            className="w-[154px] h-auto opacity-85 sm:w-[190px]"
          />
        </a>
        <nav className="mt-3 hidden flex-1 items-center justify-center gap-7 sm:flex sm:justify-end">
          <div className="mr-auto hidden items-center gap-3 text-[9px] tracking-[0.22em] uppercase text-white/45 lg:flex">
            <span className="h-px w-8 bg-gold/45" />
            <span>{statusText}</span>
          </div>
          {navItems.map((item) => {
            const isActive = item.href === `#${activeStopId}`;
            return (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleClick(e, item.href)}
              aria-current={isActive ? "location" : undefined}
              className={`shrink-0 text-[10px] tracking-[0.24em] uppercase transition-colors hover:text-gold-light ${
                isActive ? "text-gold-light" : "text-white/65"
              }`}
            >
              {item.label}
            </a>
            );
          })}
        </nav>
      </header>

      <nav
        aria-label="Destination navigation"
        className="fixed inset-x-0 bottom-0 z-50 sm:hidden border-t border-white/10 bg-ink/88 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)] shadow-[0_-18px_50px_rgba(0,0,0,.28)] backdrop-blur-xl"
      >
        <div className="absolute left-0 right-0 top-0 h-px bg-white/10">
          <div
            className="h-full bg-gold shadow-[0_0_14px_rgba(227,198,130,.75)] transition-[width] duration-200"
            style={{ width: `${Math.max(0, Math.min(1, routeProgress)) * 100}%` }}
          />
        </div>
        <div className="mb-1 truncate px-2 text-center text-[7.5px] tracking-[0.2em] uppercase text-white/42">{statusText}</div>
        <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain px-0.5 pb-0.5 no-scrollbar">
          {navItems.map((item) => {
            const isActive = item.href === `#${activeStopId}`;
            return (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleClick(e, item.href)}
              aria-current={isActive ? "location" : undefined}
              className={`grid min-h-12 min-w-[78px] place-items-center rounded-md border px-2 text-center text-[8px] tracking-[0.1em] uppercase transition-colors active:bg-white/5 active:text-gold-light ${
                isActive
                  ? "border-gold/35 bg-gold/12 text-gold-light shadow-[0_0_18px_rgba(200,162,76,.22)]"
                  : "border-white/0 text-white/58"
              }`}
            >
              {item.label}
            </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}
