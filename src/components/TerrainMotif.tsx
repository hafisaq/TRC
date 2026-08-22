import type { ReactElement } from "react";

type Biome = "mountain" | "coast" | "desert" | "city";

const MOTIFS: Record<Biome, ReactElement> = {
  mountain: (
    <>
      <path d="M2,100 L34,38 L52,66 L78,16 L104,62 L128,32 L158,100" strokeWidth="1.4" />
      <circle cx="78" cy="16" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="34" cy="38" r="2" fill="currentColor" stroke="none" />
      <path d="M70,30 L78,16 L86,30" strokeWidth="1" opacity="0.6" />
      <path d="M10,92 L30,92 M120,92 L150,92" strokeWidth="0.8" strokeDasharray="1 4" opacity="0.5" />
    </>
  ),
  coast: (
    <>
      <path d="M0,54 Q20,44 40,54 T80,54 T120,54 T160,54" strokeWidth="1.2" />
      <path d="M0,72 Q20,64 40,72 T80,72 T120,72 T160,72" strokeWidth="1" opacity="0.6" />
      <ellipse cx="120" cy="34" rx="16" ry="7" strokeWidth="1.2" />
      <path d="M120,34 L120,18 M120,20 L114,14 M120,20 L126,14" strokeWidth="1" opacity="0.7" />
    </>
  ),
  desert: (
    <>
      <path d="M0,80 Q40,58 80,80 T160,80" strokeWidth="1.4" />
      <path d="M0,98 Q40,84 80,98 T160,98" strokeWidth="1" opacity="0.6" />
      <circle cx="128" cy="26" r="10" strokeWidth="1.2" />
      <path d="M128,8 L128,2 M146,26 L152,26 M141,13 L145,9 M115,13 L111,9" strokeWidth="1" opacity="0.7" />
    </>
  ),
  city: (
    <>
      <path d="M0,110 L160,110" strokeWidth="1" opacity="0.5" />
      <path d="M14,110 L14,60 L30,60 L30,110" strokeWidth="1.2" />
      <path d="M42,110 L42,38 L60,38 L60,110" strokeWidth="1.2" />
      <path d="M72,110 L72,72 L86,72 L86,110" strokeWidth="1.2" />
      <path d="M48,50 L54,50 M48,58 L54,58 M18,70 L26,70 M18,80 L26,80" strokeWidth="0.8" opacity="0.6" />
    </>
  )
};

export default function TerrainMotif({ biome, className = "" }: { biome: Biome; className?: string }) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {MOTIFS[biome]}
    </svg>
  );
}
