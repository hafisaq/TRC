import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { NIGHT_LIGHTS } from "../../data/nightLights";

export type DotMapHandle = {
  /** Trigger a landing burst at a map point (equirectangular 0-1 fractions). */
  burst: (xPct: number, yPct: number, color?: string) => void;
};

type Dot = {
  xPct: number;
  yPct: number;
  x: number;
  y: number;
  r: number;
  phase: number;
  shimmer: number;
  twinkle: number;
  color: [number, number, number];
  band: number;
  excite: number;
  exciteR: number;
  exciteG: number;
  exciteB: number;
};

type Ping = {
  xPct: number;
  yPct: number;
  x: number;
  y: number;
  age: number;
  color: string;
};

// The world at night. Dot positions come from NASA's Black Marble composite
// (see data/nightLights.ts): metropolitan corridors glow warm, town light
// is fainter, and unlit land carries a barely-there stipple so the
// continents keep their shape. Everything is projected as a 2:1
// equirectangular map that COVERS the viewport, so mapPos/focus values
// are real longitude/latitude fractions.
const MOBILE_DOT_RATIO = 0.75;
const WARM: Array<[number, number, number]> = [
  [255, 236, 184],
  [238, 188, 92],
  [205, 149, 58],
  [255, 255, 245]
];
const COOL: [number, number, number] = [184, 214, 255];
const LAND: [number, number, number] = [138, 150, 178];

function buildDots(isMobile: boolean): Dot[] {
  const dots: Dot[] = [];
  NIGHT_LIGHTS.forEach((d, i) => {
    if (isMobile && i % 5 >= MOBILE_DOT_RATIO * 5) return;
    const metro = d.tier === 2;
    const land = d.tier === 0;
    const color: [number, number, number] = land
      ? LAND
      : Math.random() > 0.82
        ? COOL
        : WARM[Math.floor(Math.random() * WARM.length)];
    dots.push({
      xPct: d.x,
      yPct: d.y,
      x: 0,
      y: 0,
      r: metro ? 1.4 + Math.random() * 1.0 : land ? 0.7 + Math.random() * 0.4 : 0.9 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
      shimmer: metro ? 0.4 + Math.random() * 0.2 : land ? 0.11 + Math.random() * 0.06 : 0.2 + Math.random() * 0.16,
      twinkle: metro ? 0.12 + Math.random() * 0.1 : land ? 0.02 : 0.05 + Math.random() * 0.06,
      color,
      // longitude band drives the slow "time-zone" wave rolling across the map
      band: Math.floor(d.x * 8),
      excite: 0,
      exciteR: 255,
      exciteG: 255,
      exciteB: 255
    });
  });
  return dots;
}

export type DotMapFocus = { cx: number; cy: number; zoom: number };

const DotMap = forwardRef<DotMapHandle, { className?: string; focus?: DotMapFocus }>(function DotMap({ className = "", focus }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMobile = useMemo(() => window.matchMedia("(max-width: 640px)").matches, []);
  const dotsRef = useRef<Dot[] | null>(null);
  if (!dotsRef.current) dotsRef.current = buildDots(isMobile);
  const pingsRef = useRef<Ping[]>([]);
  const rafRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const lastFrameRef = useRef(0);
  // Kept in a ref (not state) since resize()/draw()/burst() are plain
  // functions defined once in the effect below, not re-created on re-render.
  const focusRef = useRef(focus);
  focusRef.current = focus;

  // The 2:1 map box that covers the viewport (centred; overflow is clipped
  // by the canvas). The inhabited band (roughly 60°N to 40°S, map y≈0.45)
  // is what gets centred, not the equator — so the north isn't cropped
  // while the empty Southern Ocean fills the bottom of the screen.
  const mapBox = (w: number, h: number) => {
    // phones: the map spans the viewport height (Atlantic to India across
    // the width) so whole continents stay legible instead of a sliver
    const mw = isMobile ? Math.max(w * 2.6, h * 2) : Math.max(w, h * 2) * 1.08;
    const mh = mw / 2;
    return { mw, mh, ox: (w - mw) / 2, oy: h / 2 - mh * (isMobile ? 0.42 : 0.45) };
  };

  const toScreen = (xPct: number, yPct: number, w: number, h: number) => {
    const { mw, mh, ox, oy } = mapBox(w, h);
    const sx = ox + xPct * mw;
    const sy = oy + yPct * mh;
    const f = focusRef.current;
    if (!f) return { x: sx, y: sy };
    const fx = ox + f.cx * mw;
    const fy = oy + f.cy * mh;
    return { x: (sx - fx) * f.zoom + w / 2, y: (sy - fy) * f.zoom + h / 2 };
  };

  useImperativeHandle(ref, () => ({
    burst(xPct, yPct, color = "#c8a24c") {
      const { w, h } = sizeRef.current;
      const { x: bx, y: by } = toScreen(xPct, yPct, w, h);
      const zoom = focusRef.current?.zoom ?? 1;
      const rgb = hexToRgb(color);
      dotsRef.current!.forEach((d) => {
        const dist = Math.hypot(d.x - bx, d.y - by);
        const falloff = Math.max(0, 1 - dist / (w * 0.16 * zoom));
        if (falloff > 0) {
          d.excite = Math.max(d.excite, falloff);
          d.exciteR = rgb.r;
          d.exciteG = rgb.g;
          d.exciteB = rgb.b;
        }
      });
      pingsRef.current.push({ xPct, yPct, x: bx, y: by, age: 0, color });
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targetFrameMs = isMobile ? 1000 / 24 : 1000 / 30;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5);
      const w = window.innerWidth;
      const h = window.innerHeight;
      sizeRef.current = { w, h, dpr };
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dotsRef.current!.forEach((d) => {
        const p = toScreen(d.xPct, d.yPct, w, h);
        d.x = p.x;
        d.y = p.y;
      });
      draw(0, true);
    };

    const draw = (time = 0, staticFrame = false) => {
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);
      const zoom = focusRef.current?.zoom ?? 1;

      const waves = Array.from({ length: 8 }, (_, band) => staticFrame || prefersReducedMotion ? 0 : getBandWave(time, band));
      dotsRef.current!.forEach((d) => {
        // off-canvas dots (the map overflows the viewport) cost nothing
        if (d.x < -6 || d.x > w + 6 || d.y < -6 || d.y > h + 6) return;
        const wave = waves[d.band] ?? 0;
        const twinkle = staticFrame || prefersReducedMotion ? 0 : Math.max(0, Math.sin(time * 0.00125 + d.phase)) * d.twinkle;
        const alpha = d.shimmer + wave * 0.6 + twinkle * 0.72 + d.excite * 0.62;
        const radius = d.r * Math.sqrt(zoom) * (1 + wave * 1.4 + twinkle * 3.2 + d.excite * 2.2);
        const cr = d.color[0] + (d.exciteR - d.color[0]) * d.excite;
        const cg = d.color[1] + (d.exciteG - d.color[1]) * d.excite;
        const cb = d.color[2] + (d.exciteB - d.color[2]) * d.excite;

        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${Math.min(1, alpha)})`;
        ctx.fill();

        if (!staticFrame) d.excite *= 0.955;
      });

      pingsRef.current = pingsRef.current.filter((p) => p.age < 1.4);
      pingsRef.current.forEach((p) => {
        if (!staticFrame) p.age += targetFrameMs / 1000;
        const progress = p.age / 1.4;
        const radius = progress * Math.min(w, h) * 0.32;
        const alpha = Math.max(0, 1 - progress) * 0.5;
        const rgb = hexToRgb(p.color);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      });
    };

    // On touch devices the map yields to the scroll: redrawing thousands
    // of points at 24fps under a flick competes with the compositor and
    // shows up as plane/reveal jitter. Freeze while the page is moving.
    let scrollingUntil = 0;
    const onScroll = () => { scrollingUntil = performance.now() + 140; };
    if (window.matchMedia("(pointer: coarse)").matches) window.addEventListener("scroll", onScroll, { passive: true });
    const tick = (time: number) => {
      if (document.hidden) return;
      if (time - lastFrameRef.current >= targetFrameMs && time > scrollingUntil) {
        lastFrameRef.current = time;
        draw(time);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    const onVisibility = () => {
      cancelAnimationFrame(rafRef.current);
      if (!document.hidden && !prefersReducedMotion) rafRef.current = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVisibility);
    if (!prefersReducedMotion) {
      const startTimer = window.setTimeout(() => {
        rafRef.current = requestAnimationFrame(tick);
      }, 350);
      return () => {
        window.clearTimeout(startTimer);
        cancelAnimationFrame(rafRef.current);
        window.removeEventListener("resize", resize);
        window.removeEventListener("scroll", onScroll);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
});

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean.length === 3 ? clean.replace(/./g, (c) => c + c) : clean, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

// a slow wave of brightness rolling west→east across the longitude bands,
// like dusk sweeping the planet, plus a faster glint
function getBandWave(time: number, band: number) {
  const phase = band * 0.7;
  const slowWave = Math.max(0, Math.sin(time * 0.00062 - phase));
  const glint = Math.max(0, Math.sin(time * 0.0017 + phase * 1.7));
  return slowWave * slowWave * 0.3 + glint * glint * 0.1;
}

export default DotMap;
