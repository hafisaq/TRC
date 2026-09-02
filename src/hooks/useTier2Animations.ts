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
  const tryPlay = () => {
    const play = video.play();
    if (play) play.catch(() => undefined);
  };
  tryPlay();
  // Safari can reject a play() issued in the same tick as load() (resource
  // selection hasn't run yet) and never recovers on its own — retry once
  // the element says it actually has playable frames.
  video.addEventListener("canplay", tryPlay, { once: true });
};

export type Tier2Stop = {
  id: string;
  mapPos: [number, number];
  theme: "gold" | "white";
  coords: string;
  // A waypoint the plane passes (landing pulse + accent zone) that is NOT
  // a destination: no nav/status identity, so it never becomes the
  // "active stop". Used for the country strip's hold.
  passive?: boolean;
};

type Tier2AnimationOptions = {
  onActiveStopChange?: (id: string) => void;
  onProgressChange?: (progress: number) => void;
  heroReady?: boolean;
};

const ACCENT_FOR_THEME = { gold: "#ffffff", white: "#c8a24c" } as const;
const DEFAULT_ACCENT = "#e3c682";
// The colour the plane settles into once it lands on the boarding pass —
// matches the deep gold the card's own type is set in, so a plane that
// arrived white or gold-light reads as "arrived" rather than "still flying".
const LANDED_ACCENT = "#8f7231";

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

        // lookahead: start buffering the NEXT stop's film now, so by the
        // time the user scrolls there it plays instead of holding on its
        // poster. One section ahead keeps at most one film in flight.
        const at = watched.findIndex((w) => w.stop.id === stop.id);
        const next = watched[at + 1];
        if (next && !revealed.has(next.stop.id)) {
          $$<HTMLVideoElement>("[data-stop-video] video", next.section).forEach((video) => {
            const source = video.querySelector<HTMLSourceElement>("source[data-src]");
            if (source) {
              source.src = source.dataset.src || "";
              source.removeAttribute("data-src");
              video.preload = "auto";
              video.load();
            }
          });
        }
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

        if (!stop.passive) {
          ScrollTrigger.create({
            trigger: section,
            start: "top 58%",
            end: "bottom 42%",
            onEnter: () => options.onActiveStopChange?.(stop.id),
            onEnterBack: () => options.onActiveStopChange?.(stop.id)
          });
        }
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
      const enquireSection = $<HTMLElement>("#tier2-enquire");
      const enquireText = $<HTMLElement>("#tier2-enquire [data-stop-text]");
      let enquireRevealed = false;
      const revealEnquire = () => {
        if (enquireRevealed || !enquireText) return;
        enquireRevealed = true;
        gsap.fromTo(
          enquireText,
          { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
          { opacity: 1, y: 0, duration: prefersReducedMotion ? 0 : 0.9, ease: "power3.out" }
        );
        // The plane landing (trail fade, colour settle, the glow pulse) is
        // handled separately below, bidirectionally — this reveal is a
        // one-way form appearance and shouldn't hide again on scroll-up,
        // but the plane should keep flying back out when you do.
      };
      if (enquireText) {
        ScrollTrigger.create({
          trigger: "#tier2-enquire",
          start: "top 65%",
          once: true,
          onEnter: revealEnquire
        });
        // same position-cache-free fallback as the stop reveals above —
        // the boarding pass sits at the very bottom of long, image/video
        // -heavy pages (especially the country pages), exactly where a
        // stale ScrollTrigger cache is most likely to have skewed, so it
        // needs the same live-measurement guarantee the stops already get.
        const checkEnquireReveal = () => {
          if (enquireRevealed || !enquireSection) return;
          const rect = enquireSection.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.65 && rect.bottom > 0) revealEnquire();
        };
        window.addEventListener("scroll", checkEnquireReveal, { passive: true });
        cleanups.push(() => window.removeEventListener("scroll", checkEnquireReveal));
        checkEnquireReveal();
      }
    });

    // ---- the flight path: one continuous scroll-scrubbed line + plane ----
    // Set up separately once its SVG genuinely exists in the DOM (see
    // whenElementsExist above) rather than assuming effect-ordering timing.
    const stopFlightWatch = whenElementsExist(["tier2-journey", "tier2-flight-path", "tier2-flight-plane"], () => {
      let flightCtx: gsap.Context | null = null;
      const initFlight = () => {
        flightCtx?.revert();
        flightCtx = gsap.context(() => {
        const journey = $<HTMLElement>("#tier2-journey")!;
        const path = $<SVGPathElement>("#tier2-flight-path")!;
        const plane = $<SVGGElement>("#tier2-flight-plane")!;
        const planeIcon = $<SVGPathElement>("#tier2-flight-plane-icon");

        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: prefersReducedMotion ? 0 : length, opacity: 1 });
        gsap.set(plane, { opacity: 1 });

        // Scroll is linear in document Y, but motionPath progress is linear
        // in ARC LENGTH — long horizontal excursions (map wiggles, the jump
        // to a section's straight lane) make arc length run ahead of Y, so
        // late in the journey the plane rides a segment whose Y is a whole
        // viewport above where the user is looking. Build a Y→arc-fraction
        // lookup (the path only ever descends, so Y is monotonic) and drive
        // the plane by the Y the scroll implies instead.
        const SAMPLES = 512;
        const sampleY: number[] = new Array(SAMPLES + 1);
        for (let i = 0; i <= SAMPLES; i++) {
          sampleY[i] = path.getPointAtLength((i / SAMPLES) * length).y;
        }
        const startY = sampleY[0];
        const endY = sampleY[SAMPLES];
        const fractionAtY = (y: number) => {
          if (y <= startY) return 0;
          if (y >= endY) return 1;
          let lo = 0, hi = SAMPLES;
          while (hi - lo > 1) {
            const mid = (lo + hi) >> 1;
            if (sampleY[mid] < y) lo = mid;
            else hi = mid;
          }
          const span = sampleY[hi] - sampleY[lo] || 1;
          return (lo + (y - sampleY[lo]) / span) / SAMPLES;
        };

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
          // The plane is ALWAYS scroll-scrubbed — it never takes over and
          // flies on its own, so it can never park out of view or stop
          // answering the scroll. The path's geometry ends on the boarding
          // pass, so at full scroll the plane is simply resting there.
          // Arrival happens in two scroll-driven beats: the TRAIL fades the
          // moment the boarding pass enters the viewport (so the plane
          // finishes its descent clean and lands on the card, no line
          // crossing it), then at touchdown the plane settles into the
          // card's own gold with one landing pulse. Both reverse on
          // scroll-up.
          const ARRIVAL = 0.985;
          // the progress at which the boarding pass's top crosses the
          // bottom of the viewport — recomputed on every rebind, so it
          // tracks layout changes like everything else here
          const enquireEl = document.getElementById("tier2-enquire");
          const vh = window.innerHeight || 1;
          const journeyDocTop = journey.getBoundingClientRect().top + window.scrollY;
          const enquireDocTop = enquireEl ? enquireEl.getBoundingClientRect().top + window.scrollY : Infinity;
          const scrollSpan = Math.max(1, journeyHeight - vh);
          const TRAIL_FADE = Math.min(0.99, Math.max(0.5, (enquireDocTop - journeyDocTop - vh * 0.92) / scrollSpan));
          // The plane must be LANDED once Journey's End fills the screen —
          // not still descending through the last stretch of scroll (the
          // section is taller than a viewport, so raw progress only hits 1
          // at the absolute document bottom, leaving the plane hanging
          // above the card while the user is already looking at it). Remap
          // so the full path completes exactly when the section's top
          // reaches the top of the viewport; it then rests on the card for
          // whatever scroll remains. Still 100% scroll-driven either way.
          const LAND_AT = Math.min(1, Math.max(0.6, (enquireDocTop - journeyDocTop) / scrollSpan));
          let trailShown = true;
          let pulsed = false;
          const applyProgress = (progress: number) => {
            options.onProgressChange?.(progress);
            const scrollP = Math.min(1, progress / LAND_AT);
            // where the scroll says the plane should BE, in document Y —
            // then convert to the arc fraction that actually sits there
            const flightP = fractionAtY(startY + scrollP * (endY - startY));
            gsap.set(path, { strokeDashoffset: length * (1 - flightP) });
            planeTween.progress(flightP);

            const showTrail = progress < TRAIL_FADE;
            if (showTrail !== trailShown) {
              trailShown = showTrail;
              gsap.killTweensOf(path, "opacity");
              gsap.to(path, { opacity: showTrail ? 1 : 0, duration: showTrail ? 0.4 : 0.6, ease: "power2.out" });
            }
            const nowArrived = flightP >= ARRIVAL;
            if (nowArrived) {
              setAccent(LANDED_ACCENT);
              if (!pulsed) {
                pulsed = true;
                const landingGroup = $<SVGGElement>("#tier2-landing-tier2-enquire");
                const glow = landingGroup?.querySelector<SVGCircleElement>("[data-landing-glow]");
                const ring = landingGroup?.querySelector<SVGCircleElement>("[data-landing-ring]");
                if (glow && ring) {
                  gsap.set([glow, ring], { fill: LANDED_ACCENT, stroke: LANDED_ACCENT });
                  gsap.fromTo(glow, { attr: { r: 4 }, opacity: 0.9 }, { attr: { r: 46 }, opacity: 0, duration: 1.2, ease: "power2.out" });
                  gsap.fromTo(ring, { attr: { r: 4 }, opacity: 1 }, { attr: { r: 30 }, opacity: 0, duration: 1.2, ease: "power2.out", delay: 0.1 });
                }
              }
            } else {
              pulsed = false; // re-arm so a return visit pulses again
              let accent = DEFAULT_ACCENT;
              for (const zone of zones) {
                if (progress >= zone.progress - 0.06) accent = zone.accent;
              }
              setAccent(accent);
            }
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
      };
      initFlight();

      // Tier2FlightPath re-measures update the SAME <path> node's `d` in
      // place (React patches attributes, it doesn't replace the node) —
      // but the tween, path length, and colour zones captured at init are
      // then stale, leaving the plane out of sync with the scroll and
      // landing above the boarding pass. Watch `d` and rebind on change so
      // every re-measure (fonts loading, lazy media growing the page,
      // viewport resize) re-syncs the whole flight system.
      const pathEl = document.getElementById("tier2-flight-path");
      const rebind = new MutationObserver(() => initFlight());
      if (pathEl) rebind.observe(pathEl, { attributes: true, attributeFilter: ["d"] });

      cleanups.push(() => {
        rebind.disconnect();
        flightCtx?.revert();
      });
    });
    cleanups.push(stopFlightWatch);

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, [options.heroReady]);
}
