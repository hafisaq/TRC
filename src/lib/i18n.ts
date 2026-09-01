// Language state + UI-string translation. The site boots in the stored
// language; switching stores the choice, shows a full-screen loader, and
// reloads so hydration re-runs with the other language's strings applied.
export type Lang = "en" | "ar";

const KEY = "trc-lang";

export function currentLang(): Lang {
  try {
    return localStorage.getItem(KEY) === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

export const isAr = () => currentLang() === "ar";

// ---- fixed UI chrome ----
// English defaults; Arabic arrives from the CMS `ar--ui` translation doc
// at hydration via setUiStrings(). Keys match scripts/i18n/extract.py.
const EN: Record<string, string> = {
  "nav.about": "About",
  "nav.enquire": "Enquire",
  "hero.kicker": "An itinerary, mapped — scroll to follow the route",
  "hero.scroll": "Scroll",
  "hero.scrollRoute": "Scroll to fly the route",
  "loader.preparing": "Preparing route",
  "status.approaching": "TRC 001 · Approaching",
  "stop.bestSeason": "Best season",
  "stop.enquireRoute": "Enquire about this route",
  "strip.choose": "Choose your route",
  "strip.explore": "Explore {country} →",
  "board.choose": "Choose your altitude",
  "fan.kicker": "Postcards from the coast",
  "fan.hint": "scroll to deal the next card · click the front card to travel",
  "caravan.kicker": "The caravan route",
  "page.home": "Home",
  "page.overview": "Overview",
  "page.signatures": "Signatures",
  "page.essentials": "Essentials",
  "page.gallery": "Gallery",
  "page.theStays": "The stays",
  "page.framed": "{country}, framed",
  "page.galleryHint": "frames · hover to play · tap to open",
  "page.whereStay": "Where you'll stay",
  "page.staysIn": "The stays in {country}",
  "page.staysCount": "stays",
  "page.otherRoutes": "Other routes in",
  "page.speakToUs": "Speak to us about {country}",
  "page.theSignatures": "The signatures",
  "page.signatureBySignature": "{country}, signature by signature",
  "page.notItinerary": "Not an itinerary — the marks of the Maison, one signature at a time.",
  "page.beforeYouPack": "Before you pack",
  "page.practicalSide": "The practical side of {country}, one sheet at a time.",
  "dossier.title": "Stay dossier",
  "dossier.open": "Open the dossier",
  "dossier.enquire": "Enquire",
  "dossier.closerLook": "A closer look",
  "dossier.brochures": "Brochures",
  "dossier.download": "Download",
  "dossier.enquireStay": "Enquire about this stay",
  "dossier.film": "Film",
  "dossier.still": "Still"
};

let ui: Record<string, string> = { ...EN };

export function setUiStrings(overrides: Record<string, string>) {
  ui = { ...EN, ...overrides };
}

export function t(key: string, vars?: Record<string, string | number>): string {
  let s = ui[key] ?? EN[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

// ---- the switch ----
// Shows a full-screen loader (in the target language) and reloads; the
// stored language then drives dir/lang/fonts and Arabic hydration.
export function switchLanguage(lang: Lang) {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* private mode — reload still switches for this load via query */
  }
  const toAr = lang === "ar";
  const overlay = document.createElement("div");
  overlay.setAttribute("dir", toAr ? "rtl" : "ltr");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:9999;background:#0e0d0c;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;";
  overlay.innerHTML = `
    <img src="/media/brand/GOLD.png" alt="" style="width:150px;opacity:.95" />
    <div style="width:26px;height:26px;border:1.5px solid rgba(200,162,76,.25);border-top-color:#c8a24c;border-radius:50%;animation:trc-spin .9s linear infinite"></div>
    <div style="color:#e3c682;font-size:10px;letter-spacing:.28em;text-transform:uppercase;font-family:${
      toAr ? "'IBM Plex Sans Arabic'," : ""
    } Jost, system-ui, sans-serif">${toAr ? "نجهّز المسار" : "Preparing route"}</div>
    <style>@keyframes trc-spin{to{transform:rotate(360deg)}}</style>`;
  document.body.appendChild(overlay);
  // let the overlay paint before the reload takes over
  setTimeout(() => window.location.reload(), 350);
}

// ---- applying CMS translations to raw documents ----
// Paths look like "stops[k000s].title.line1" or "highlights[0]" — segments
// separated by dots, arrays indexed by [_key] or [number].
type AnyObj = Record<string, unknown>;

export function applyTranslation(target: AnyObj, path: string, value: string) {
  const parts = path.match(/[^.[\]]+|\[[^\]]+\]/g);
  if (!parts) return;
  let node: unknown = target;
  for (let i = 0; i < parts.length; i++) {
    const raw = parts[i];
    const isIndex = raw.startsWith("[");
    const key = isIndex ? raw.slice(1, -1) : raw;
    const last = i === parts.length - 1;
    if (node == null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      const idx = /^\d+$/.test(key)
        ? Number(key)
        : node.findIndex((it) => (it as AnyObj)?._key === key);
      if (idx < 0 || idx >= node.length) return;
      if (last) node[idx] = value;
      else node = node[idx];
    } else {
      const obj = node as AnyObj;
      if (last) obj[key] = value;
      else node = obj[key];
    }
  }
}
