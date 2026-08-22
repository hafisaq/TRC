import { useEffect, type RefObject } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { DotMapHandle } from "../components/tier2/DotMap";

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends Element>(selector: string, root: ParentNode = document) => root.querySelector<T>(selector);
const $$ = <T extends Element>(selector: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(selector));

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

const ACCENT_FOR_THEME = { gold: "#ffffff", white: "#c8a24c" } as const;

export function useTier2Animations(dotMapRef: RefObject<DotMapHandle | null>, stops: Tier2Stop[]) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];
    let lenis: Lenis | null = null;

    if (!prefersReducedMotion) {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.85, touchMultiplier: 1.15 });
      const onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);
      const tick = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      cleanups.push(() => {
        gsap.ticker.remove(tick);
        lenis?.destroy();
      });
    }

    const ctx = gsap.context(() => {
      // ---- hero entrance ----
      const tl = gsap.timeline({ delay: 0.2 });
      tl.to("#tier2-emblem", { opacity: 1, duration: prefersReducedMotion ? 0 : 0.9, ease: "power2.out" });
      tl.to(
        "#tier2-title",
        { opacity: 1, y: 0, duration: prefersReducedMotion ? 0 : 1.1, ease: "power3.out" },
        "-=0.5"
      );
      tl.to("#tier2-subtitle", { opacity: 1, duration: prefersReducedMotion ? 0 : 0.8 }, "-=0.6");
      tl.to("#tier2-kicker", { opacity: 1, duration: prefersReducedMotion ? 0 : 0.8 }, "-=0.5");

      if (!prefersReducedMotion) {
        const path = $<SVGPathElement>("#tier2-hero-trail-path");
        const plane = $<SVGGElement>("#tier2-hero-trail-plane");
        const wrap = path?.closest("svg");
        if (path && plane && wrap) {
          const length = path.getTotalLength();
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
          gsap.set(wrap, { opacity: 1 });
          const trailTl = gsap.timeline();
          trailTl.to(path, { strokeDashoffset: 0, duration: 2, ease: "power1.inOut" }, 0);
          trailTl.to(
            plane,
            { motionPath: { path, align: path, autoRotate: true, alignOrigin: [0.5, 0.5] }, duration: 2, ease: "power1.inOut" },
            0
          );
          tl.add(trailTl, "-=1.4");
        }
      } else {
        gsap.set("#tier2-emblem, #tier2-title, #tier2-subtitle, #tier2-kicker", { opacity: 1 });
      }

      // ---- persistent center plane: idle drift, retints per landing, and a "landing" beat ----
      const centerPlane = $<HTMLElement>("#tier2-center-plane");
      const planeIcon = $<SVGPathElement>("#tier2-plane-icon");
      const planeSquiggle = $<SVGPathElement>("#tier2-plane-squiggle");
      const pulse = $<HTMLElement>("#tier2-plane-pulse");
      const pulseGlow = $<HTMLElement>("#tier2-plane-pulse-glow");
      const pulseRing = $<HTMLElement>("#tier2-plane-pulse-ring");
      const pulseCoords = $<HTMLElement>("#tier2-plane-pulse-coords");
      if (centerPlane) gsap.set(centerPlane, { xPercent: -50, yPercent: -50 });

      let idleDrift: gsap.core.Tween | null = null;
      const landPlane = (accent: string, coords: string) => {
        if (!centerPlane) return;
        if (prefersReducedMotion) {
          if (planeIcon) gsap.set(planeIcon, { fill: accent });
          if (planeSquiggle) gsap.set(planeSquiggle, { stroke: accent });
          if (pulseCoords) pulseCoords.textContent = coords;
          return;
        }

        idleDrift?.pause();
        const beat = gsap.timeline({ onComplete: () => idleDrift?.play() });
        beat
          .to(centerPlane, { x: 0, y: 0, rotation: 0, scale: 1.3, duration: 0.4, ease: "power2.out" })
          .to([planeIcon, planeSquiggle].filter(Boolean), { fill: accent, stroke: accent, duration: 0.3 }, "<")
          .to(centerPlane, { scale: 0.85, opacity: 0.35, duration: 0.35, ease: "power2.in" })
          .to(centerPlane, { scale: 1, opacity: 1, rotation: 6, duration: 0.55, ease: "power2.out" });

        if (pulse && pulseGlow && pulseRing && pulseCoords) {
          pulseCoords.textContent = coords;
          gsap.set([pulseGlow, pulseRing], { backgroundColor: accent, borderColor: accent });
          gsap.set(pulseCoords, { color: accent });
          beat.set(pulse, { opacity: 1 }, "-=0.5");
          beat.fromTo(pulseGlow, { scale: 0.6, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 1.1, ease: "power2.out" }, "<");
          beat.fromTo(pulseRing, { scale: 0.6, opacity: 1 }, { scale: 1.8, opacity: 0, duration: 1.1, ease: "power2.out" }, "<0.15");
          beat.to(pulse, { opacity: 0, duration: 0.6, delay: 1.2 });
        }
      };

      if (centerPlane) {
        if (prefersReducedMotion) {
          gsap.set(centerPlane, { opacity: 0 });
        } else {
          tl.to(centerPlane, { opacity: 1, duration: 0.8 }, "-=0.3");
          tl.call(() => {
            idleDrift = gsap.to(centerPlane, {
              x: 22,
              y: -16,
              rotation: 10,
              duration: 3.4,
              yoyo: true,
              repeat: -1,
              ease: "sine.inOut"
            });
          });
        }
      }

      // ---- each stop: land the plane (retinted + pulsing coords), then text + video, burst the dot map ----
      stops.forEach((stop) => {
        const section = $<HTMLElement>(`#${stop.id}`);
        if (!section) return;
        const text = $<HTMLElement>("[data-stop-text]", section);
        const videoWrap = $<HTMLElement>("[data-stop-video]", section);
        const video = videoWrap?.querySelector<HTMLVideoElement>("video") ?? null;
        const accent = ACCENT_FOR_THEME[stop.theme];

        ScrollTrigger.create({
          trigger: section,
          start: "top 55%",
          once: true,
          onEnter: () => {
            landPlane(accent, stop.coords);
            const revealDelay = prefersReducedMotion ? 0 : 0.35;

            if (text) {
              gsap.fromTo(
                text,
                { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
                { opacity: 1, y: 0, duration: prefersReducedMotion ? 0 : 0.9, delay: revealDelay, ease: "power3.out" }
              );
            }
            if (videoWrap) {
              gsap.fromTo(
                videoWrap,
                { opacity: 0, scale: prefersReducedMotion ? 1 : 0.92 },
                { opacity: 1, scale: 1, duration: prefersReducedMotion ? 0 : 1, delay: revealDelay, ease: "power3.out" }
              );
            }
            if (video) safePlay(video);
            dotMapRef.current?.burst(stop.mapPos[0], stop.mapPos[1], accent === "#ffffff" ? "#ffffff" : "#c8a24c");
          }
        });
      });

      // ---- final CTA reveal ----
      const enquireText = $<HTMLElement>("#tier2-enquire [data-stop-text]");
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
    });

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);
}
