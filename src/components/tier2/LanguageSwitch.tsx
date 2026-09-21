import { SETTINGS } from "../../lib/cms";
import { isAr, switchLanguage, t } from "../../lib/i18n";

// The language toggle: EN · ع, the current one lit. Rendered only when
// Sanity's siteSettings says so; switching shows a branded loader and
// reloads into the other language.
export default function LanguageSwitch({ tone = "light" }: { tone?: "light" | "dark" }) {
  if (!SETTINGS.showLanguageSwitch) return null;
  const ar = isAr();
  const idle = tone === "light" ? "text-white/45 group-hover:text-white/80" : "text-navy/45 group-hover:text-navy/80";
  const lit = tone === "light" ? "text-gold-light" : "text-gold-deep";
  const rule = tone === "light" ? "bg-white/25" : "bg-navy/25";
  // sizes carry `!`: the global `button { font: inherit }` is unlayered and
  // would otherwise set this to the page's 16px
  return (
    <button
      type="button"
      onClick={() => switchLanguage(ar ? "en" : "ar")}
      aria-label={ar ? "Switch to English" : "التبديل إلى العربية"}
      dir="ltr"
      className="group inline-flex h-11 shrink-0 cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 px-1 text-[11px]! leading-none tracking-[0.18em]"
    >
      <span className={`transition-colors ${ar ? idle : lit}`} style={{ fontFamily: "var(--font-sans)" }}>EN</span>
      <span aria-hidden="true" className={`h-3 w-px ${rule}`} />
      <span className={`text-[15px] transition-colors ${ar ? lit : idle}`} style={{ fontFamily: "'IBM Plex Sans Arabic', 'Geeza Pro', system-ui, sans-serif" }}>ع</span>
    </button>
  );
}

export { t };
