import { useEffect, type RefObject } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import type { DotMapHandle } from "../components/tier2/DotMap";
import { setActiveLenis } from "../lib/scroll";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

const $ = <T extends Element>(selector: string, root: ParentNode = document) => root.querySelector<T>(selector);
const $$ = <T extends Element>(selector: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(selector));

const safePlay = (video: HTMLVideoElement) => {
  const source = video.querySelector<HTMLSourceElement>("source[data-src]");
  if (source) {
    source.src = source.dataset.src || "";
    source.removeAttribute("data-src");
    video.load();
  }
  const play = video.play();
  if (play) play.catch(() => undefined);
};

export type Tier2Stop = {
  id: string;
  mapPos: [number, number];
  theme: "gold" | "white";
  coords: string;
};

type Tier2AnimationOptions = {
  onActiveStopChange?: (id: string) => void;
  onProgressChange?: (progress: number) => void;
  heroReady?: boolean;
};

const ACCENT_FOR_THEME = { gold: "#ffffff", white: "#c8a24c" } as const;
const DEFAULT_ACCENT = "#e3c682";

/**
 * Tier2FlightPath measures the journey's real pixel height in its own
 * effect and only then renders the SVG (path/plane start as null). That
 * commit can land in a separate React flush than this hook's — even with
 * useLayoutEffect on both sides, in practice the SVG isn't guaranteed to
 * exist yet when this runs. MutationObserver sidesteps the race entirely
 * (and isn't rAF-gated, so it isn't affected by tab-visibility throttling
 * either): fire once the elements genuinely exist in the DOM.
 */
function whenElementsExist(ids: string[], callback: () => void): () => void {
  const ready = () => ids.every((id) => document.getElementById(id));
  if (ready()) {
    callback();
    return () => {};
  }
  const observer = new MutationObserver(() => {
    if (ready()) {
      observer.disconnect();
      callback();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

export function useTier2Animations(dotMapRef: RefObject<DotMapHandle | null>, stops: Tier2Stop[], options: Tier2AnimationOptions = {}) {
  useEffect(() => {
    if (!options.heroReady) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];
    let lenis: Lenis | null = null;

    if (!prefersReducedMotion) {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.85, touchMultiplier: 1.15 });
      setActiveLenis(lenis);
      const onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);
      const tick = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      cleanups.push(() => {
        gsap.ticker.remove(tick);
        setActiveLenis(null);
        lenis?.destroy();
      });
    }

    const ctx = gsap.context(() => {
      // ---- hero entrance (the flight path/plane wake up in the SVG block below) ----
      const tl = gsap.timeline({ delay: prefersReducedMotion ? 0 : 0.1 });
      tl.to("#tier2-emblem", { opacity: 1, scale: 1, duration: prefersReducedMotion ? 0 : 0.8, ease: "power2.out" });
      tl.to("#tier2-title", { opacity: 1, y: 0, duration: prefersReducedMotion ? 0 : 1.1, ease: "power3.out" }, "-=0.35");
      tl.to("#tier2-subtitle", { opacity: 1, duration: prefersReducedMotion ? 0 : 0.75 }, "-=0.6");
      tl.to("#tier2-kicker", { opacity: 1, duration: prefersReducedMotion ? 0 : 0.75 }, "-=0.45");
      if (prefersReducedMotion) {
        gsap.set("#tier2-emblem, #tier2-title, #tier2-subtitle, #tier2-kicker", { opacity: 1 });
      }

      // ---- each stop: landing pulse (at its exact path point) + text/video reveal ----
      // Reveals fire through TWO independent triggers guarded by a Set:
      // ScrollTrigger (normal path) and a plain scroll-listener fallback that
      // measures live getBoundingClientRect. The fallback exists because
      // ScrollTrigger caches trigger positions at refresh time — if a refresh
      // ever runs with a stale scroll cache (slow load, bfcache restore,
      // background tab), every cached position skews and sections would never
      // reveal. Rect measurement can't skew, so the reveal always lands.
      const revealed = new Set<string>();
      const revealStop = (stop: Tier2Stop, section: HTMLElement) => {
        if (revealed.has(stop.id)) return;
        revealed.add(stop.id);
        const texts = $$<HTMLElement>("[data-stop-text]", section);
        const titles = $$<HTMLElement>("[data-stop-title]", section);
        const wash = $<HTMLElement>("[data-stop-wash]", section);
        const videoWraps = $$<HTMLElement>("[data-stop-video]", section);
        const accent = ACCENT_FOR_THEME[stop.theme];
        const revealDelay = prefersReducedMotion ? 0 : 0.2;

        const landing = $<SVGGElement>(`#tier2-landing-${stop.id}`);
        const glow = landing?.querySelector<SVGCircleElement>("[data-landing-glow]");
        const ring = landing?.querySelector<SVGCircleElement>("[data-landing-ring]");
        if (glow && ring) {
          gsap.set([glow, ring], { fill: accent, stroke: accent });
          gsap.fromTo(glow, { attr: { r: 4 }, opacity: 0.9 }, { attr: { r: 46 }, opacity: 0, duration: 1.2, ease: "power2.out" });
          gsap.fromTo(ring, { attr: { r: 4 }, opacity: 1 }, { attr: { r: 30 }, opacity: 0, duration: 1.2, ease: "power2.out", delay: 0.1 });
        }
        if (wash) {
          gsap.to(wash, { opacity: 1, duration: prefersReducedMotion ? 0 : 0.9, ease: "power2.out" });
        }
        if (texts.length) {
          gsap.fromTo(
            texts,
            { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
            { opacity: 1, y: 0, duration: prefersReducedMotion ? 0 : 0.9, delay: revealDelay, ease: "power3.out", stagger: 0.08 }
          );
        }
        if (titles.length) {
          gsap.fromTo(
            titles,
            { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
            { opacity: 1, y: 0, duration: prefersReducedMotion ? 0 : 0.95, delay: revealDelay + 0.16, ease: "power3.out", stagger: 0.04 }
          );
        }
        videoWraps.forEach((videoWrap) => {
          gsap.fromTo(
            videoWrap,
            { opacity: 0, scale: prefersReducedMotion ? 1 : 0.92 },
            { opacity: 1, scale: 1, duration: prefersReducedMotion ? 0 : 1, delay: revealDelay, ease: "power3.out" }
          );
          const video = videoWrap.querySelector<HTMLVideoElement>("video");
          if (video) safePlay(video);
        });
        dotMapRef.current?.burst(stop.mapPos[0], stop.mapPos[1], accent);
      };

      const watched: Array<{ stop: Tier2Stop; section: HTMLElement }> = [];
      stops.forEach((stop) => {
        const section = $<HTMLElement>(`#${stop.id}`);
        if (!section) return;
        watched.push({ stop, section });

        ScrollTrigger.create({
          trigger: section,
          start: "top 55%",
          once: true,
          onEnter: () => revealStop(stop, section)
        });

        ScrollTrigger.create({
          trigger: section,
          start: "top 58%",
          end: "bottom 42%",
          onEnter: () => options.onActiveStopChange?.(stop.id),
          onEnterBack: () => options.onActiveStopChange?.(stop.id)
        });
      });

      // position-cache-free fallback (see comment above)
      const checkReveals = () => {
        if (revealed.size >= watched.length) return;
        const vh = window.innerHeight;
        watched.forEach(({ stop, section }) => {
          if (revealed.has(stop.id)) return;
          const rect = section.getBoundingClientRect();
          if (rect.top < vh * 0.6 && rect.bottom > 0) revealStop(stop, section);
        });
      };
      window.addEventListener("scroll", checkReveals, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", checkReveals));
      checkReveals();

      // re-measure once every asset has loaded — trigger positions computed
      // against a half-loaded layout would otherwise stay subtly wrong
      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", onLoad);
      cleanups.push(() => window.removeEventListener("load", onLoad));

      // ---- final CTA reveal ----
      const enquireText = $<HTMLElement>("#tier2-enquire [data-stop-text]");
      const mobileEnquireCta = $<HTMLElement>("#mobile-enquire-cta");
      if (enquireText) {
        ScrollTrigger.create({
          trigger: "#tier2-enquire",
          start: "top 65%",
          once: true,
          onEnter: () =>
            gsap.fromTo(
              enquireText,
              { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
              { opacity: 1, y: 0, duration: prefersReducedMotion ? 0 : 0.9, ease: "power3.out" }
            )
        });
      }
      if (mobileEnquireCta) {
        ScrollTrigger.create({
          trigger: "#tier2-enquire",
          start: "top 78%",
          end: "bottom bottom",
          onToggle: (self) => {
            mobileEnquireCta.style.opacity = self.isActive ? "0" : "1";
            mobileEnquireCta.style.pointerEvents = self.isActive ? "none" : "auto";
          }
        });
      }
    });

    // ---- the flight path: one continuous scroll-scrubbed line + plane ----
    // Set up separately once its SVG genuinely exists in the DOM (see
    // whenElementsExist above) rather than assuming effect-ordering timing.
    const stopFlightWatch = whenElementsExist(["tier2-journey", "tier2-flight-path", "tier2-flight-plane"], () => {
      const flightCtx = gsap.context(() => {
        const journey = $<HTMLElement>("#tier2-journey")!;
        const path = $<SVGPathElement>("#tier2-flight-path")!;
        const plane = $<SVGGElement>("#tier2-flight-plane")!;
        const planeIcon = $<SVGPathElement>("#tier2-flight-plane-icon");

        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: prefersReducedMotion ? 0 : length, opacity: 1 });
        gsap.set(plane, { opacity: 1 });

        const planeTween = gsap.to(plane, {
          motionPath: { path, align: path, autoRotate: true, alignOrigin: [0.5, 0.5] },
          duration: 1,
          ease: "none",
          paused: true
        });

        // Each stop owns a vertical band of scroll progress; while inside
        // it, the path/plane wear that stop's accent color.
        const journeyHeight = journey.scrollHeight;
        const zones = stops.map((s) => {
          const el = document.getElementById(s.id);
          const center = el ? el.offsetTop + el.offsetHeight / 2 : 0;
          return { progress: journeyHeight ? center / journeyHeight : 0, accent: ACCENT_FOR_THEME[s.theme] };
        });

        let currentAccent = DEFAULT_ACCENT;
        const setAccent = (accent: string) => {
          if (accent === currentAccent) return;
          currentAccent = accent;
          // path must never get a fill — it's an open, curvy stroke-only
          // line; setting fill on it makes SVG render the enclosed area as
          // a solid shape (the wedge). Only its stroke color should change.
          gsap.to(path, { stroke: accent, duration: 0.5, ease: "power2.out" });
          if (planeIcon) gsap.to(planeIcon, { fill: accent, duration: 0.5, ease: "power2.out" });
        };

        if (prefersReducedMotion) {
          planeTween.progress(1);
          options.onProgressChange?.(1);
        } else {
          const applyProgress = (progress: number) => {
            gsap.set(path, { strokeDashoffset: length * (1 - progress) });
            planeTween.progress(progress);
            options.onProgressChange?.(progress);

            let accent = DEFAULT_ACCENT;
            for (const zone of zones) {
              if (progress >= zone.progress - 0.06) accent = zone.accent;
            }
            setAccent(accent);
          };

          const trigger = ScrollTrigger.create({
            trigger: journey,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.4,
            onUpdate: (self) => applyProgress(self.progress)
          });

          // ScrollTrigger only calls onUpdate on an actual scroll event, so
          // without this the plane never renders its path-start position
          // until the user first scrolls.
          applyProgress(trigger.progress);
        }

        ScrollTrigger.refresh();
      });

      cleanups.push(() => flightCtx.revert());
    });
    cleanups.push(stopFlightWatch);

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, [options.heroReady]);
}
