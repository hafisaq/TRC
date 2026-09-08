import type Lenis from "lenis";

let activeLenis: Lenis | null = null;

export function setActiveLenis(instance: Lenis | null) {
  activeLenis = instance;
}

export function pauseSmoothScroll() {
  const instance = activeLenis;
  const wasStopped = instance?.isStopped;
  instance?.stop();
  return () => {
    if (instance === activeLenis && !wasStopped) instance?.start();
  };
}

export function scrollToHash(hash: string, extraOffset = 0) {
  const target = document.querySelector<HTMLElement>(hash);
  if (!target) return;
  // Measured live rather than hardcoded — the sticky nav is a different
  // height on mobile (single row, smaller type) than on desktop (adds the
  // wordmark), so a fixed offset either overshoots or clips on one of them.
  const nav = document.getElementById("tier2-nav");
  const isMobile = window.matchMedia("(max-width: 639px)").matches;
  const navClearance = nav && !isMobile ? nav.getBoundingClientRect().height + 12 : 0;
  const offset = -navClearance + extraOffset;
  // Scroll-held scenes declare their exact clearance. A numeric Lenis
  // target avoids subtracting CSS scroll-padding a second time.
  const sceneClearance = target.getAttribute("data-scroll-clearance");
  const sceneY = sceneClearance === null ? null : target.getBoundingClientRect().top + window.scrollY - Number(sceneClearance) + extraOffset;
  if (activeLenis) {
    activeLenis.scrollTo(sceneY ?? target, { offset: sceneY === null ? offset : 0, duration: isMobile ? 0.95 : 1.2 });
  } else {
    const y = sceneY ?? target.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}
