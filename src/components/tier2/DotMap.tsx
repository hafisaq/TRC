import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";

export type DotMapHandle = {
  /** Trigger a landing burst at a normalized (0-1, 0-1) point on the canvas. */
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
  continent: number;
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

// Rough, stylized "continent" blobs — not geographically literal, just enough
// scattered dot mass in the right neighborhoods to read as a world map.
const CONTINENTS: Array<{ cx: number; cy: number; rx: number; ry: number; count: number }> = [
  { cx: 0.22, cy: 0.34, rx: 0.1, ry: 0.16, count: 150 }, // the Americas (north)
  { cx: 0.26, cy: 0.62, rx: 0.07, ry: 0.16, count: 110 }, // the Americas (south)
  { cx: 0.48, cy: 0.28, rx: 0.09, ry: 0.1, count: 105 }, // Europe
  { cx: 0.52, cy: 0.5, rx: 0.11, ry: 0.16, count: 150 }, // Africa
  { cx: 0.68, cy: 0.32, rx: 0.16, ry: 0.14, count: 180 }, // Asia
  { cx: 0.78, cy: 0.62, rx: 0.08, ry: 0.09, count: 90 } // Oceania
];

const MOBILE_DOT_RATIO = 0.62;
const CITY_LIGHTS: Array<[number, number, number]> = [
  [255, 236, 184],
  [238, 188, 92],
  [205, 149, 58],
  [184, 214, 255],
  [255, 255, 245]
];

function buildDots(isMobile: boolean): Dot[] {
  const dots: Dot[] = [];
  CONTINENTS.forEach((c, continent) => {
    const count = Math.round(c.count * (isMobile ? MOBILE_DOT_RATIO : 1));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radiusFalloff = Math.pow(Math.random(), 0.5);
      const jitter = 0.55 + Math.random() * 0.45;
      const metropolitan = Math.random() > 0.86;
      const color = CITY_LIGHTS[Math.floor(Math.random() * CITY_LIGHTS.length)];
      const xPct = c.cx + Math.cos(angle) * c.rx * radiusFalloff * jitter;
      const yPct = c.cy + Math.sin(angle) * c.ry * radiusFalloff * jitter;
      dots.push({
        xPct,
        yPct,
        x: 0,
        y: 0,
        r: metropolitan ? 1.05 + Math.random() * 0.95 : 0.55 + Math.random() * 0.72,
        phase: Math.random() * Math.PI * 2,
        shimmer: metropolitan ? 0.34 + Math.random() * 0.2 : 0.14 + Math.random() * 0.18,
        twinkle: metropolitan ? 0.13 + Math.random() * 0.12 : 0.04 + Math.random() * 0.075,
        color,
        continent,
        excite: 0,
        exciteR: 255,
        exciteG: 255,
        exciteB: 255
      });
    }
  });
  return dots;
}

export type DotMapFocus = { cx: number; cy: number; zoom: number };

const DotMap = forwardRef<DotMapHandle, { className?: string; focus?: DotMapFocus }>(function DotMap({ className = "", focus }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMobile = useMemo(() => window.matchMedia("(max-width: 640px)").matches, []);
  const dotsRef = useRef<Dot[]>(buildDots(isMobile));
  const pingsRef = useRef<Ping[]>([]);
  const rafRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const lastFrameRef = useRef(0);
  // Kept in a ref (not state) since resize()/draw()/burst() are plain
  // functions defined once in the effect below, not re-created on re-render.
  const focusRef = useRef(focus);
  focusRef.current = focus;

  const toScreen = (xPct: number, yPct: number, w: number, h: number) => {
    const f = focusRef.current;
    if (!f) return { x: xPct * w, y: yPct * h };
    return {
      x: (xPct * w - f.cx * w) * f.zoom + w / 2,
      y: (yPct * h - f.cy * h) * f.zoom + h / 2
    };
  };

  useImperativeHandle(ref, () => ({
    burst(xPct, yPct, color = "#c8a24c") {
      const { w, h } = sizeRef.current;
      const { x: bx, y: by } = toScreen(xPct, yPct, w, h);
      const zoom = focusRef.current?.zoom ?? 1;
      const rgb = hexToRgb(color);
      dotsRef.current.forEach((d) => {
        const dist = Math.hypot(d.x - bx, d.y - by);
        const falloff = Math.max(0, 1 - dist / (w * 0.22 * zoom));
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
      dotsRef.current.forEach((d) => {
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

      dotsRef.current.forEach((d) => {
        const wave = staticFrame || prefersReducedMotion ? 0 : getContinentWave(time, d.continent);
        const twinkle = staticFrame || prefersReducedMotion ? 0 : Math.max(0, Math.sin(time * 0.00125 + d.phase)) * d.twinkle;
        const light = wave + twinkle;
        const alpha = d.shimmer + wave * 0.78 + twinkle * 0.72 + d.excite * 0.62;
        const radius = d.r * zoom * (1 + wave * 2 + twinkle * 3.2 + d.excite * 2.2);
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

    const tick = (time: number) => {
      if (time - lastFrameRef.current >= targetFrameMs) {
        lastFrameRef.current = time;
        draw(time);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    if (!prefersReducedMotion) {
      const startTimer = window.setTimeout(() => {
        rafRef.current = requestAnimationFrame(tick);
      }, 350);
      return () => {
        window.clearTimeout(startTimer);
        cancelAnimationFrame(rafRef.current);
        window.removeEventListener("resize", resize);
      };
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
});

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean.length === 3 ? clean.replace(/./g, (c) => c + c) : clean, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function getContinentWave(time: number, continent: number) {
  const phase = continent * 0.92;
  const slowWave = Math.max(0, Math.sin(time * 0.00062 + phase));
  const glint = Math.max(0, Math.sin(time * 0.0017 + phase * 1.7));
  return slowWave * slowWave * 0.3 + glint * glint * 0.1;
}

export default DotMap;
