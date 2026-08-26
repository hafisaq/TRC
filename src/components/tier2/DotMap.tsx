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

function buildDots(isMobile: boolean): Dot[] {
  const dots: Dot[] = [];
  CONTINENTS.forEach((c) => {
    const count = Math.round(c.count * (isMobile ? MOBILE_DOT_RATIO : 1));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radiusFalloff = Math.pow(Math.random(), 0.5);
      const jitter = 0.55 + Math.random() * 0.45;
      const xPct = c.cx + Math.cos(angle) * c.rx * radiusFalloff * jitter;
      const yPct = c.cy + Math.sin(angle) * c.ry * radiusFalloff * jitter;
      dots.push({
        xPct,
        yPct,
        x: 0,
        y: 0,
        r: 0.7 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        shimmer: 0.18 + Math.random() * 0.16,
        excite: 0,
        exciteR: 255,
        exciteG: 255,
        exciteB: 255
      });
    }
  });
  return dots;
}

const DotMap = forwardRef<DotMapHandle, { className?: string }>(function DotMap({ className = "" }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMobile = useMemo(() => window.matchMedia("(max-width: 640px)").matches, []);
  const dotsRef = useRef<Dot[]>(buildDots(isMobile));
  const pingsRef = useRef<Ping[]>([]);
  const rafRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const lastFrameRef = useRef(0);

  useImperativeHandle(ref, () => ({
    burst(xPct, yPct, color = "#c8a24c") {
      const { w, h } = sizeRef.current;
      const bx = xPct * w;
      const by = yPct * h;
      const rgb = hexToRgb(color);
      dotsRef.current.forEach((d) => {
        const dist = Math.hypot(d.x - bx, d.y - by);
        const falloff = Math.max(0, 1 - dist / (w * 0.22));
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
        d.x = d.xPct * w;
        d.y = d.yPct * h;
      });
      draw(0, true);
    };

    const draw = (time = 0, staticFrame = false) => {
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);

      dotsRef.current.forEach((d) => {
        const shimmer = staticFrame || prefersReducedMotion ? d.shimmer : d.shimmer + Math.sin(time * 0.00045 + d.phase) * 0.035;
        const baseAlpha = shimmer;
        const alpha = baseAlpha + d.excite * 0.6;
        const radius = d.r * (1 + d.excite * 2.2);
        const cr = 255 + (d.exciteR - 255) * d.excite;
        const cg = 255 + (d.exciteG - 255) * d.excite;
        const cb = 255 + (d.exciteB - 255) * d.excite;

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
      }, 900);
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

export default DotMap;
