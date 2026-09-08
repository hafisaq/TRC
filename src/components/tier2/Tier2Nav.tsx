import type { MouseEvent } from "react";
import type { Destination } from "../../data/tier2Destinations";
import { scrollToHash } from "../../lib/scroll";
import LanguageSwitch from "./LanguageSwitch";
import { t } from "../../lib/i18n";
import MobileAppTools from "../MobileAppTools";
import RouteBar from "../RouteBar";

type Tier2NavProps = {
  destinations: Destination[];
  activeStopId: string;
  statusText: string;
  onEnquire: () => void;
};

export default function Tier2Nav({ destinations, activeStopId, statusText, onEnquire }: Tier2NavProps) {
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
    { label: t("nav.enquire"), href: "#tier2-enquire" }
  ];

  return (
    <>
      <header
        id="tier2-nav"
        className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-ink/94 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 sm:bg-ink/72 sm:backdrop-blur-xl xl:flex xl:items-center xl:gap-8 xl:px-8 xl:py-5"
      >
        <a
          href="#tier2-hero"
          onClick={(e) => handleClick(e, "#tier2-hero")}
          className="mx-auto block w-fit xl:mx-0"
          aria-label="The Retreat Collection"
        >
          <img
            src="/media/brand/GOLD.png"
            alt="The Retreat Collection"
            width={697}
            height={226}
            decoding="async"
            fetchPriority="high"
            className="w-[154px] h-auto xl:w-[190px]"
          />
        </a>
        <MobileAppTools />
        <div className="mobile-language-switch">
          <LanguageSwitch tone="light" />
        </div>
        <nav className="mt-3 hidden flex-1 items-center justify-center gap-7 xl:flex xl:justify-end">
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
          <LanguageSwitch tone="light" />
        </nav>
      </header>

      <RouteBar
        items={navItems}
        activeHref={`#${activeStopId}`}
        onSelect={handleClick}
        status={statusText}
        tone="dark"
        ariaLabel="Destination navigation"
      />
    </>
  );
}
