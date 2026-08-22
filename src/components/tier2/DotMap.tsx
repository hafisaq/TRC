import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

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
  { cx: 0.22, cy: 0.34, rx: 0.1, ry: 0.16, count: 220 }, // the Americas (north)
  { cx: 0.26, cy: 0.62, rx: 0.07, ry: 0.16, count: 160 }, // the Americas (south)
  { cx: 0.48, cy: 0.28, rx: 0.09, ry: 0.1, count: 150 }, // Europe
  { cx: 0.52, cy: 0.5, rx: 0.11, ry: 0.16, count: 220 }, // Africa
  { cx: 0.68, cy: 0.32, rx: 0.16, ry: 0.14, count: 260 }, // Asia
  { cx: 0.78, cy: 0.62, rx: 0.08, ry: 0.09, count: 130 } // Oceania
];

function buildDots(): Dot[] {
  const dots: Dot[] = [];
  CONTINENTS.forEach((c) => {
    for (let i = 0; i < c.count; i++) {
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
  const dotsRef = useRef<Dot[]>(buildDots());
  const pingsRef = useRef<Ping[]>([]);
  const rafRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
    };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    const tick = () => {
      t += 0.016;
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);

      // idle + excited dots
      dotsRef.current.forEach((d) => {
        const shimmer = 0.55 + Math.sin(t * 0.6 + d.phase) * 0.18;
        const baseAlpha = shimmer * 0.4;
        const alpha = baseAlpha + d.excite * 0.6;
        const radius = d.r * (1 + d.excite * 2.2);
        const cr = 255 + (d.exciteR - 255) * d.excite;
        const cg = 255 + (d.exciteG - 255) * d.excite;
        const cb = 255 + (d.exciteB - 255) * d.excite;

        if (d.excite > 0.02) {
          ctx.shadowBlur = 10 * d.excite;
          ctx.shadowColor = `rgba(${d.exciteR},${d.exciteG},${d.exciteB},${d.excite})`;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${Math.min(1, alpha)})`;
        ctx.fill();

        d.excite *= 0.965;
      });
      ctx.shadowBlur = 0;

      // expanding ping rings
      pingsRef.current = pingsRef.current.filter((p) => p.age < 1.4);
      pingsRef.current.forEach((p) => {
        p.age += 0.016;
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

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

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
