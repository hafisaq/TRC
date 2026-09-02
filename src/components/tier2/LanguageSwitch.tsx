import { SETTINGS } from "../../lib/cms";
import { isAr, switchLanguage, t } from "../../lib/i18n";

// The EN / عربية toggle, drawn as a luggage tag — same family as the
// boarding pass and the flight path. Rendered only when Sanity's
// siteSettings says so; switching shows a branded loader and reloads
// into the other language.
export default function LanguageSwitch({ tone = "light" }: { tone?: "light" | "dark" }) {
  if (!SETTINGS.showLanguageSwitch) return null;
  const ar = isAr();
  return (
    <button
      type="button"
      onClick={() => switchLanguage(ar ? "en" : "ar")}
      aria-label={ar ? "Switch to English" : "التبديل إلى العربية"}
      className={`group shrink-0 cursor-pointer bg-transparent border-0 p-0 transition-colors ${
        tone === "light"
          ? "text-white/70 hover:text-gold-light"
          : "text-navy/60 hover:text-gold-deep"
      }`}
    >
      <svg
        width="78"
        height="30"
        viewBox="0 0 78 30"
        fill="none"
        aria-hidden="true"
        className="block transition-transform duration-300 ease-out group-hover:-rotate-6"
        style={{ transformOrigin: "21px 15px" }}
      >
        {/* the cord through the eyelet */}
        <path
          d="M2 24 Q9 22 19.5 16"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.55"
        />
        {/* tag body */}
        <path
          d="M10.5 15 L25 5 H70 Q73.5 5 73.5 8.5 V21.5 Q73.5 25 70 25 H25 Z"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        {/* punched eyelet */}
        <circle cx="21.5" cy="15" r="2.4" stroke="currentColor" strokeWidth="1" />
        <text
          x="49"
          y="15.5"
          dominantBaseline="central"
          textAnchor="middle"
          fill="currentColor"
          fontSize={ar ? 10 : 11.5}
          letterSpacing={ar ? 2 : 0}
          style={{ fontFamily: "inherit" }}
        >
          {ar ? "EN" : "عربية"}
        </text>
      </svg>
    </button>
  );
}

export { t };
