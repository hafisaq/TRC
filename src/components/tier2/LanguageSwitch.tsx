import { SETTINGS } from "../../lib/cms";
import { isAr, switchLanguage, t } from "../../lib/i18n";

// The EN / عربية toggle. Rendered only when Sanity's siteSettings says so;
// switching shows a branded loader and reloads into the other language.
export default function LanguageSwitch({ tone = "light" }: { tone?: "light" | "dark" }) {
  if (!SETTINGS.showLanguageSwitch) return null;
  const ar = isAr();
  return (
    <button
      type="button"
      onClick={() => switchLanguage(ar ? "en" : "ar")}
      aria-label={ar ? "Switch to English" : "التبديل إلى العربية"}
      className={`shrink-0 border px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase transition-colors ${
        tone === "light"
          ? "border-white/25 text-white/70 hover:border-gold/60 hover:text-gold-light"
          : "border-navy/25 text-navy/60 hover:border-gold hover:text-gold-deep"
      }`}
    >
      {ar ? "EN" : "عربية"}
    </button>
  );
}

export { t };
