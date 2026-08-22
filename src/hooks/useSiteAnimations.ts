import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

const $ = <T extends Element>(selector: string, root: ParentNode = document) =>
  root.querySelector<T>(selector);
const $$ = <T extends Element>(selector: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(selector));
const existing = (selectors: string[]) => selectors.filter((selector) => $(selector));

const loadVideo = (video: HTMLVideoElement) => {
  const sources = $$<HTMLSourceElement>("source[data-src]", video);
  if (!sources.length) return;
  sources.forEach((source) => {
    source.src = source.dataset.src || "";
    source.removeAttribute("data-src");
  });
  video.load();
};

const safePlay = (video: HTMLVideoElement) => {
  loadVideo(video);
  const play = video.play();
  if (play) play.catch(() => undefined);
};

/**
 * Draws a PlaneTrail's gold path while flying its plane icon along the same
 * path (GSAP MotionPathPlugin, autoRotate to follow the curve's tangent).
 * Used as a recurring signature moment tied to the brand mark's own swoosh.
 */
function playTrail(id: string, opts: { reducedMotion: boolean; duration?: number; delay?: number }) {
  const path = $<SVGPathElement>(`#${id}-path`);
  const plane = $<SVGGElement>(`#${id}-plane`);
  const wrap = path?.closest("svg");
  if (!path || !plane || !wrap) return undefined;

  const length = path.getTotalLength();
  gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

  if (opts.reducedMotion) {
    gsap.set(wrap, { opacity: 1 });
    gsap.set(path, { strokeDashoffset: 0 });
    gsap.set(plane, { motionPath: { path, align: path, autoRotate: true, alignOrigin: [0.5, 0.5], end: 1 } });
    return undefined;
  }

  gsap.set(wrap, { opacity: 1 });
  const duration = opts.duration ?? 1.8;
  const tl = gsap.timeline({ delay: opts.delay ?? 0 });
  tl.to(path, { strokeDashoffset: 0, duration, ease: "power1.inOut" }, 0);
  tl.to(
    plane,
    { motionPath: { path, align: path, autoRotate: true, alignOrigin: [0.5, 0.5] }, duration, ease: "power1.inOut" },
    0
  );
  return tl;
}

function splitText() {
  $$<HTMLElement>("[data-split]").forEach((el) => {
    if (el.dataset.splitReady) return;
    el.dataset.splitReady = "true";
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);

    nodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      const parts = node.textContent?.split(/(\s+)/) || [];
      parts.forEach((part) => {
        if (!part.trim()) {
          frag.append(part);
          return;
        }
        const mask = document.createElement("span");
        const inner = document.createElement("span");
        mask.className = "split-mask";
        inner.className = "split-inner";
        inner.textContent = part;
        mask.append(inner);
        frag.append(mask);
      });
      node.replaceWith(frag);
    });
  });
}

/**
 * Ports the site's full scroll/interaction choreography (Lenis, hero parallax,
 * reveals, split-text, destinations pin-gallery, chapters crossfade, cursor,
 * counters, video lazy-load, magnetic/glow interactions) into a single
 * React-lifecycle-scoped effect. GSAP context handles teardown so this is
 * safe under StrictMode's mount/unmount/mount dev cycle.
 */
export function useSiteAnimations() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointerFine = window.matchMedia("(pointer: fine)").matches;
    const cleanups: Array<() => void> = [];
    let lenis: Lenis | null = null;

    splitText();

    // ---- Lenis ----
    if (!prefersReducedMotion) {
      lenis = new Lenis({
        duration: 1.15,
        smoothWheel: true,
        wheelMultiplier: 0.85,
        touchMultiplier: 1.15
      });
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
      // ---- chrome: nav flip, scrim, progress bar, section index ----
      const nav = $<HTMLElement>("#nav");
      const scrim = $<HTMLElement>("#scrim");
      const progress = $<HTMLElement>("#progress-bar");
      const index = $<HTMLElement>("#section-index");

      ScrollTrigger.create({
        start: 10,
        end: "max",
        onUpdate: (self) => {
          const pastHero = self.scroll() > window.innerHeight * 0.68;
          nav?.classList.toggle("nav-solid", pastHero);
          if (scrim) scrim.style.opacity = pastHero ? "0" : "1";
          if (index) index.style.opacity = pastHero ? "1" : "0";
          if (progress) progress.style.width = `${self.progress * 100}%`;
        }
      });

      const sections = ["destinations", "chapters", "film", "route", "journey", "standard", "enquire"];
      const indexPlane = $<HTMLElement>("#index-plane");
      const indexCoords = $<HTMLElement>("#index-coords");
      sections.forEach((id) => {
        ScrollTrigger.create({
          trigger: `#${id}`,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (!self.isActive) return;
            $$<HTMLElement>("#section-index [data-idx]").forEach((item) => {
              const active = item.dataset.idx === id;
              item.querySelector<HTMLElement>(".idx-line")!.style.width = active ? "36px" : "18px";
              item.querySelector<HTMLElement>(".idx-line")!.style.background = active
                ? "rgba(200,162,76,.9)"
                : "rgba(22,36,60,.25)";
              item.querySelector<HTMLElement>(".idx-label")!.style.color = active
                ? "rgba(22,36,60,.74)"
                : "rgba(22,36,60,.35)";
              if (active && indexPlane && item.parentElement) {
                const navRect = item.parentElement.getBoundingClientRect();
                const rowRect = item.getBoundingClientRect();
                indexPlane.style.top = `${rowRect.top - navRect.top + rowRect.height / 2}px`;
              }
              if (active && indexCoords) {
                indexCoords.textContent = item.dataset.coords || "";
              }
            });
          }
        });
      });

      // ---- reveal-on-scroll ----
      if (prefersReducedMotion) {
        gsap.set("[data-reveal-line], .split-inner, [data-reveal]", { clearProps: "all" });
      } else {
        gsap.set("[data-reveal-line]", { y: 28, opacity: 0 });
        gsap.set(".split-inner", { yPercent: 112 });

        $$<HTMLElement>("[data-reveal]").forEach((block) => {
          const lines = $$<HTMLElement>("[data-reveal-line]", block);
          if (!lines.length) return;
          gsap.to(lines, {
            y: 0,
            opacity: 1,
            duration: 1.15,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: { trigger: block, start: "top 78%", once: true }
          });
        });

        $$<HTMLElement>("[data-split]").forEach((el) => {
          gsap.to($$<HTMLElement>(".split-inner", el), {
            yPercent: 0,
            duration: 1.2,
            ease: "power4.out",
            stagger: 0.035,
            scrollTrigger: { trigger: el, start: "top 82%", once: true }
          });
        });

        const quoteMark = $<HTMLElement>("[data-quote-mark]");
        if (quoteMark) {
          gsap.to(quoteMark, {
            opacity: 1,
            scale: 1,
            y: 16,
            ease: "none",
            scrollTrigger: { trigger: quoteMark, start: "top 85%", end: "bottom 20%", scrub: true }
          });
        }
      }

      // ---- hero ----
      const curtain = $<HTMLElement>("#curtain");
      const dot = $<HTMLElement>("#curtain-dot");
      const hero = $<HTMLElement>("#hero");

      if (!prefersReducedMotion) {
        const intro = gsap.timeline();
        if (dot) intro.to(dot, { scale: 4, opacity: 0.2, duration: 0.75, ease: "power2.inOut" });
        if (curtain) intro.to(curtain, { yPercent: -100, duration: 1.15, ease: "expo.inOut" }, "-=0.25");
        if ($("#hero-video")) {
          intro.fromTo("#hero-video", { scale: 1.14 }, { scale: 1, duration: 1.65, ease: "power3.out" }, "-=0.8");
        }
        if ($("[data-hero-title]")) {
          intro.fromTo(
            "[data-hero-title]",
            { opacity: 0, y: 54, filter: "blur(8px)" },
            { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.25, ease: "power3.out" },
            "-=0.85"
          );
        }
        if ($("[data-hero-kicker]")) {
          intro.fromTo(
            "[data-hero-kicker]",
            { opacity: 0, x: -28 },
            { opacity: 1, x: 0, duration: 0.95, ease: "power3.out" },
            "-=0.95"
          );
        }
        const letterboxes = existing(["#hero-letterbox-top", "#hero-letterbox-bottom"]);
        if (letterboxes.length) {
          intro.to(letterboxes, { scaleY: 0, duration: 1.35, ease: "expo.inOut" }, "-=1.25");
        }

        const heroTrail = playTrail("hero-trail", { reducedMotion: false, duration: 1.7 });
        if (heroTrail) intro.add(heroTrail, "-=0.9");

        if (hero && $("#hero-trail")) {
          gsap.to("#hero-trail", {
            opacity: 0,
            ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "35% top", scrub: true }
          });
        }

        if (hero && $("#hero-media")) {
          gsap.to("#hero-media", {
            yPercent: 12,
            scale: 1.08,
            ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
          });
        }
        if (hero && $("#hero-veil")) {
          gsap.to("#hero-veil", {
            opacity: 0.86,
            ease: "none",
            scrollTrigger: { trigger: hero, start: "55% top", end: "bottom top", scrub: true }
          });
        }
      } else {
        curtain?.remove();
        $("#hero-letterbox-top")?.remove();
        $("#hero-letterbox-bottom")?.remove();
        playTrail("hero-trail", { reducedMotion: true });
      }

      // ---- flight-line accents: the plane visits every section as you scroll ----
      const sectionTrails: Array<[string, Element | string | null]> = [
        ["ethos-trail", $("#ethos-trail")?.closest("section") ?? null],
        ["destinations-trail", "#destinations"],
        ["chapters-trail", "#chapters"],
        ["film-trail", "#film"],
        ["journey-trail", "#journey"],
        ["standard-trail", "#standard"],
        ["enquire-trail", "#enquire"]
      ];
      sectionTrails.forEach(([trailId, trigger]) => {
        if (!trigger) return;
        ScrollTrigger.create({
          trigger,
          start: "top 75%",
          once: true,
          onEnter: () => playTrail(trailId, { reducedMotion: prefersReducedMotion, duration: 1.1 })
        });
      });

      // ---- count-up stats ----
      $$<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count || "0");
        const suffix = el.dataset.suffix || "";
        const obj = { value: 0 };
        gsap.to(obj, {
          value: target,
          duration: prefersReducedMotion ? 0 : 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
          onUpdate: () => {
            el.textContent = `${Math.round(obj.value)}${suffix}`;
          },
          onComplete: () => {
            el.textContent = `${target}${suffix}`;
          }
        });
      });

      // ---- destinations pin gallery / carousel ----
      const wrap = $<HTMLElement>("[data-pan-wrap]");
      const track = $<HTMLElement>("[data-pan-track]");
      const cards = $$<HTMLElement>("[data-pan-card]");
      if (wrap && track && cards.length) {
        if (!prefersReducedMotion && window.matchMedia("(min-width: 1024px)").matches) {
          const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 180);
          gsap.set(wrap, { height: () => `${Math.max(2200, distance() + window.innerHeight)}px` });

          gsap.to(track, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: wrap,
              start: "top top",
              end: () => `+=${distance()}`,
              scrub: 0.6,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                const idx = Math.min(cards.length, Math.floor(self.progress * cards.length) + 1);
                const bar = $<HTMLElement>("[data-pan-bar]");
                const count = $<HTMLElement>("[data-pan-count]");
                if (bar) bar.style.width = `${self.progress * 100}%`;
                if (count) count.textContent = `${String(idx).padStart(2, "0")} / 04`;
              }
            }
          });
        }

        cards.forEach((card, i) => {
          if (prefersReducedMotion) return;
          gsap.fromTo(
            card,
            { clipPath: "inset(8% 0 8% 0)", y: i % 2 ? 36 : -28 },
            {
              clipPath: "inset(0% 0 0% 0)",
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "left 80%",
                end: "right 20%",
                scrub: true,
                horizontal: window.matchMedia("(min-width: 1024px)").matches
              }
            }
          );
        });
      }

      // ---- chapters pinned crossfade ----
      const chaptersWrap = $<HTMLElement>("[data-chapters-wrap]");
      if (chaptersWrap) {
        const bgs = $$<HTMLElement>("[data-chapter-bg]");
        const captions = $$<HTMLElement>("[data-chapter-caption]");
        const bar = $<HTMLElement>("[data-chapter-bar]");
        const count = $<HTMLElement>("[data-chapter-count]");

        const setChapter = (activeIndex: number) => {
          bgs.forEach((bg, i) => {
            gsap.to(bg, { opacity: i === activeIndex ? 1 : 0, duration: prefersReducedMotion ? 0 : 0.6 });
            const video = $("video", bg) as HTMLVideoElement | null;
            if (!video) return;
            if (i === activeIndex) safePlay(video);
            else video.pause();
          });
          captions.forEach((caption, i) => {
            gsap.to(caption, {
              opacity: i === activeIndex ? 1 : 0,
              y: i === activeIndex ? 0 : 18,
              duration: prefersReducedMotion ? 0 : 0.55,
              ease: "power2.out"
            });
          });
          if (count) count.textContent = `${String(activeIndex + 1).padStart(2, "0")} / 03`;
        };

        setChapter(0);

        if (!prefersReducedMotion) {
          ScrollTrigger.create({
            trigger: chaptersWrap,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onUpdate: (self) => {
              const activeIndex = Math.min(2, Math.floor(self.progress * 3));
              setChapter(activeIndex);
              if (bar) bar.style.width = `${self.progress * 100}%`;
            },
            onLeaveBack: () => setChapter(0)
          });
        }
      }

      // ---- route map (scroll-scrubbed treasure-map journey) ----
      const routeWrap = $<HTMLElement>("[data-route-wrap]");
      if (routeWrap) {
        const routePath = $<SVGPathElement>("[data-route-path]");
        const routePlane = $<SVGGElement>("[data-route-plane]");
        const routeCaptions = $$<HTMLElement>("[data-route-caption]");
        const routePins = $$<SVGGElement>("[data-route-pin]");
        const routeBar = $<HTMLElement>("[data-route-bar]");
        const routeCount = $<HTMLElement>("[data-route-count]");
        const needle = $<SVGLineElement>("#route-compass-needle");

        if (needle && !prefersReducedMotion) {
          gsap.to(needle, { rotate: 360, duration: 24, repeat: -1, ease: "none", transformOrigin: "50% 50%" });
        }

        if (routePath && routePlane) {
          const length = routePath.getTotalLength();
          gsap.set(routePath, { strokeDasharray: `${length}`, strokeDashoffset: prefersReducedMotion ? 0 : length });

          const planeTween = gsap.to(routePlane, {
            motionPath: { path: routePath, align: routePath, autoRotate: true, alignOrigin: [0.5, 0.5] },
            duration: 1,
            ease: "none",
            paused: true
          });

          // Pan/zoom the map toward each pin as its page becomes active — this
          // is what turns "one static map" into "a page per waypoint" while the
          // route line keeps drawing continuously underneath.
          const focusGroup = $<SVGGElement>("[data-route-focus]");
          let focusTween: gsap.core.Timeline | null = null;
          if (focusGroup && routePins.length) {
            const pinPositions = routePins.map((p) => {
              const match = (p.getAttribute("transform") || "").match(/translate\(([-\d.]+)[ ,]([-\d.]+)\)/);
              return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : { x: 500, y: 300 };
            });
            const zoom = 1.55;
            const stages = pinPositions.map((p) => ({ x: 500 - p.x * zoom, y: 300 - p.y * zoom, scale: zoom }));
            gsap.set(focusGroup, { transformOrigin: "0px 0px", ...stages[0] });
            if (!prefersReducedMotion) {
              focusTween = gsap.timeline({ paused: true });
              stages.forEach((stage, i) => {
                focusTween!.to(focusGroup, { ...stage, ease: "power2.inOut", duration: 1 / stages.length }, i / stages.length);
              });
            }
          }

          const setStop = (activeIndex: number) => {
            routeCaptions.forEach((c, i) => {
              gsap.to(c, {
                opacity: i === activeIndex ? 1 : 0,
                y: i === activeIndex ? 0 : i < activeIndex ? -64 : 64,
                duration: prefersReducedMotion ? 0 : 0.6,
                ease: "power3.out"
              });
            });
            routePins.forEach((p, i) => {
              gsap.to(p, { scale: i === activeIndex ? 1.5 : 1, transformOrigin: "50% 50%", duration: 0.4 });
            });
            if (routeCount) routeCount.textContent = `${String(activeIndex + 1).padStart(2, "0")} / 04`;
          };
          setStop(0);

          if (prefersReducedMotion) {
            gsap.set(routePath, { strokeDashoffset: 0 });
            planeTween.progress(1);
          } else {
            ScrollTrigger.create({
              trigger: routeWrap,
              start: "top top",
              end: "bottom bottom",
              scrub: true,
              onUpdate: (self) => {
                gsap.set(routePath, { strokeDashoffset: length * (1 - self.progress) });
                planeTween.progress(self.progress);
                focusTween?.progress(self.progress);
                if (routeBar) routeBar.style.width = `${self.progress * 100}%`;
                const activeIndex = Math.min(3, Math.floor(self.progress * 4));
                setStop(activeIndex);
              },
              onLeaveBack: () => setStop(0)
            });
          }
        }
      }

      // ---- video lazy-load / hover-to-play ----
      $$<HTMLVideoElement>("video[data-eager-video], #hero-video").forEach(safePlay);

      $$<HTMLVideoElement>("video[data-hovervid]").forEach((video) => {
        const media = video.closest<HTMLElement>("[data-media]");
        if (!media) return;
        const poster = video.getAttribute("poster");
        if (poster) {
          media.style.backgroundImage = `linear-gradient(180deg,rgba(255,255,255,.04),rgba(22,36,60,.32)), url("${poster}")`;
          media.classList.add("poster-ready");
        }

        if (!pointerFine || prefersReducedMotion) {
          const onClick = () => {
            const active = video.style.opacity === "1";
            if (active) {
              video.style.opacity = "0";
              video.pause();
            } else {
              video.style.opacity = "1";
              safePlay(video);
            }
          };
          media.addEventListener("click", onClick);
          cleanups.push(() => media.removeEventListener("click", onClick));
          return;
        }

        const onEnter = () => {
          video.style.opacity = "1";
          safePlay(video);
        };
        const onLeave = () => {
          video.style.opacity = "0";
          video.pause();
        };
        media.addEventListener("mouseenter", onEnter);
        media.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          media.removeEventListener("mouseenter", onEnter);
          media.removeEventListener("mouseleave", onLeave);
        });
      });

      $$<HTMLVideoElement>("[data-chapter-bg] video").forEach((video) => {
        ScrollTrigger.create({
          trigger: video.closest("[data-chapters-wrap]") || video,
          start: "top 80%",
          end: "bottom 20%",
          onEnter: () => loadVideo(video),
          onEnterBack: () => loadVideo(video)
        });
      });

      // ---- film mock progress meter ----
      const filmBar = $<HTMLElement>("[data-vid-bar]");
      const filmTime = $<HTMLElement>("[data-vid-time]");
      if (filmBar && filmTime) {
        const dur = Number(filmTime.dataset.dur || "242");
        gsap.to(
          { value: 0 },
          {
            value: dur,
            repeat: -1,
            duration: 18,
            ease: "none",
            onUpdate() {
              const current = Math.floor(this.targets()[0].value);
              const mins = Math.floor(current / 60);
              const secs = current % 60;
              filmBar.style.width = `${(current / dur) * 100}%`;
              filmTime.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} / 04:02`;
            }
          }
        );
      }

      // ---- custom cursor ----
      if (pointerFine) {
        const ring = $<HTMLElement>("#cursor-ring");
        const dotEl = $<HTMLElement>("#cursor-dot");
        const label = $<HTMLElement>("#cursor-label");
        if (ring && dotEl && label) {
          let x = window.innerWidth / 2;
          let y = window.innerHeight / 2;
          let rx = x;
          let ry = y;
          let raf = 0;

          const onMove = (event: PointerEvent) => {
            x = event.clientX;
            y = event.clientY;
            ring.style.opacity = "1";
            dotEl.style.opacity = "1";
          };
          window.addEventListener("pointermove", onMove);

          const tick = () => {
            rx += (x - rx) * 0.18;
            ry += (y - ry) * 0.18;
            ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
            dotEl.style.transform = `translate3d(${x}px,${y}px,0)`;
            raf = requestAnimationFrame(tick);
          };
          tick();

          const hoverables = $$<HTMLElement>("a, button, [data-media]");
          const onEnter = (el: HTMLElement) => () => {
            ring.style.width = "58px";
            ring.style.height = "58px";
            ring.style.margin = "-29px 0 0 -29px";
            ring.style.background = "rgba(200,162,76,.12)";
            label.textContent = el.matches("[data-media]") ? "Play" : "";
            label.style.opacity = el.matches("[data-media]") ? "1" : "0";
          };
          const onLeave = () => {
            ring.style.width = "34px";
            ring.style.height = "34px";
            ring.style.margin = "-17px 0 0 -17px";
            ring.style.background = "transparent";
            label.style.opacity = "0";
          };
          const listeners: Array<[HTMLElement, () => void, () => void]> = [];
          hoverables.forEach((el) => {
            const enter = onEnter(el);
            el.addEventListener("mouseenter", enter);
            el.addEventListener("mouseleave", onLeave);
            listeners.push([el, enter, onLeave]);
          });

          cleanups.push(() => {
            window.removeEventListener("pointermove", onMove);
            cancelAnimationFrame(raf);
            listeners.forEach(([el, enter, leave]) => {
              el.removeEventListener("mouseenter", enter);
              el.removeEventListener("mouseleave", leave);
            });
          });
        }
      }

      // ---- chips + magnetic glow ----
      const chipListeners: Array<[HTMLButtonElement, () => void]> = [];
      $$<HTMLButtonElement>("[data-chip]").forEach((chip) => {
        const onClick = () => chip.classList.toggle("chip-active");
        chip.addEventListener("click", onClick);
        chipListeners.push([chip, onClick]);
      });
      cleanups.push(() => chipListeners.forEach(([chip, fn]) => chip.removeEventListener("click", fn)));

      const glowSection = $<HTMLElement>("[data-glow-section]");
      const glow = $<HTMLElement>("[data-cursor-glow]");
      if (glowSection && glow && pointerFine) {
        const onMove = (event: PointerEvent) => {
          const rect = glowSection.getBoundingClientRect();
          glow.style.opacity = "1";
          glow.style.transform = `translate3d(${event.clientX - rect.left - 210}px,${event.clientY - rect.top - 210}px,0)`;
        };
        const onLeave = () => {
          glow.style.opacity = "0";
        };
        glowSection.addEventListener("pointermove", onMove);
        glowSection.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          glowSection.removeEventListener("pointermove", onMove);
          glowSection.removeEventListener("pointerleave", onLeave);
        });
      }
    });

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    cleanups.push(() => window.removeEventListener("load", onLoad));

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);
}
