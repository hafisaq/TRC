// Analytics: Google Analytics 4 (numbers, funnels, acquisition) and
// Microsoft Clarity (heatmaps, session recordings). Both IDs live in
// Sanity's Site settings; with no IDs nothing loads. Nothing personal is
// ever sent — never a name, an email, or what someone typed.
//
// Consent: GA4 starts in Consent Mode v2 with everything denied (cookieless
// pings only) and is upgraded when the visitor accepts; Clarity loads only
// after they accept. The choice is remembered on this device.

export type AnalyticsSettings = { enabled: boolean; ga4Id: string; clarityId: string; askConsent: boolean; domain: string };
type Params = Record<string, string | number | boolean | undefined>;
type Consent = "granted" | "denied" | null;

const CONSENT_KEY = "trc-consent";
const TOUCH_KEY = "trc-first-touch";

declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; clarity?: (...args: unknown[]) => void }
}

let settings: AnalyticsSettings = { enabled: false, ga4Id: "", clarityId: "", askConsent: true, domain: "" };

// with a domain set in Sanity, only that site reports (www or not); the
// replica and local builds stay silent
const bare = (h: string) => h.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
const onMeasuredHost = () => !settings.domain || bare(location.hostname) === bare(settings.domain);
let started = false;
const listeners = new Set<() => void>();

export function getConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}
export const analyticsActive = () => settings.enabled && onMeasuredHost() && (!!settings.ga4Id || !!settings.clarityId);
export const needsConsentChoice = () => analyticsActive() && settings.askConsent && getConsent() === null;
export function onConsentChange(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

export function setConsent(value: "granted" | "denied") {
  try { localStorage.setItem(CONSENT_KEY, value); } catch { /* private mode */ }
  applyConsent();
  listeners.forEach((fn) => fn());
  track("consent_choice", { choice: value });
}

const allowed = () => !settings.askConsent || getConsent() === "granted";

function loadScript(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function applyConsent() {
  const ok = allowed();
  window.gtag?.("consent", "update", {
    analytics_storage: ok ? "granted" : "denied",
    ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied"
  });
  if (ok && settings.clarityId && !window.clarity) {
    // Microsoft's loader, unchanged in behaviour: queues calls until the tag arrives
    const q: unknown[][] = [];
    const clarity = (...args: unknown[]) => { q.push(args); };
    (clarity as unknown as { q: unknown[][] }).q = q;
    window.clarity = clarity;
    loadScript(`https://www.clarity.ms/tag/${encodeURIComponent(settings.clarityId)}`);
    window.clarity("set", "language", document.documentElement.lang || "en");
  }
}

// ---- where the visitor first came from (kept on this device, attached to
// the enquiry so the company email says which campaign produced the lead) ----
export type FirstTouch = { source: string; medium: string; campaign: string; referrer: string; landing: string };
export function firstTouch(): FirstTouch {
  try {
    const saved = localStorage.getItem(TOUCH_KEY);
    if (saved) return JSON.parse(saved) as FirstTouch;
  } catch { /* fall through */ }
  const q = new URLSearchParams(location.search);
  let referrer = "";
  try { referrer = document.referrer && new URL(document.referrer).host !== location.host ? new URL(document.referrer).host : ""; } catch { /* bad referrer */ }
  const touch: FirstTouch = {
    source: q.get("utm_source") || referrer || "direct",
    medium: q.get("utm_medium") || (referrer ? "referral" : "none"),
    campaign: q.get("utm_campaign") || "",
    referrer,
    landing: location.pathname
  };
  try { localStorage.setItem(TOUCH_KEY, JSON.stringify(touch)); } catch { /* private mode */ }
  return touch;
}

export function track(name: string, params: Params = {}) {
  if (!started || !analyticsActive()) return;
  const clean: Params = { language: document.documentElement.lang || "en" };
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") clean[k] = typeof v === "string" ? v.slice(0, 100) : v;
  window.gtag?.("event", name, clean);
  if (allowed()) window.clarity?.("event", name);
}

const pageType = () => (/^\/(asia|alpine|coast|desert|cities)\//.test(location.pathname) ? "country" : location.pathname.startsWith("/about") ? "about" : "home");
const sectionOf = (el: Element | null) => el?.closest("[data-tier2-stop], section[id], footer[id]")?.id || "";

export function initAnalytics(next: AnalyticsSettings) {
  settings = next;
  firstTouch();
  if (started || !analyticsActive()) return;
  started = true;

  if (settings.ga4Id) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer!.push(arguments); };
    window.gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", wait_for_update: 500 });
    window.gtag("js", new Date());
    window.gtag("config", settings.ga4Id, { anonymize_ip: true, page_type: pageType(), site_language: document.documentElement.lang || "en" });
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(settings.ga4Id)}`);
  }
  applyConsent();
  instrument();
}

// ---- automatic tracking: one set of delegated listeners for the whole site ----
function instrument() {
  // every part of the journey, once, as it arrives on screen
  const seen = new Set<string>();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const id = (e.target as HTMLElement).id;
      if (!e.isIntersecting || !id || seen.has(id)) return;
      seen.add(id);
      track("section_view", { section: id, page_type: pageType() });
    });
  // a section counts once it crosses the middle of the screen — a ratio
  // threshold would never fire for the pinned scenes, which are far taller
  // than the viewport
  }, { rootMargin: "-45% 0px -45% 0px" });
  const watch = () => document.querySelectorAll<HTMLElement>("[data-tier2-stop][id], #journey-footer, #cd-gallery, #cd-stays").forEach((el) => io.observe(el));
  watch();
  setTimeout(watch, 2500);

  // how far down the page people get
  const marks = [25, 50, 75, 100];
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (max <= 0) return;
    const pct = (scrollY / max) * 100;
    while (marks.length && pct >= marks[0] - 0.5) track("scroll_depth", { percent: marks.shift(), page_type: pageType() });
    if (!marks.length) removeEventListener("scroll", onScroll);
  };
  addEventListener("scroll", onScroll, { passive: true });

  // clicks that mean something
  document.addEventListener("click", (ev) => {
    const a = (ev.target as Element | null)?.closest?.("a[href], button");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    const section = sectionOf(a);
    const country = href.match(/^\/(asia|alpine|coast|desert|cities)\/([a-z0-9-]+)\/?$/);
    if (country) return track("select_country", { region: country[1], country: country[2], section });
    if (/^https:\/\/wa\.me\//.test(href)) return track("contact_click", { method: "whatsapp", section });
    if (href.startsWith("tel:")) return track("contact_click", { method: "phone", section });
    if (href.startsWith("mailto:")) return track("contact_click", { method: "email", section });
    if (href.endsWith("#tier2-enquire")) return track("enquiry_intent", { section });
    if (href === "/about") return track("about_open", { section });
    if (/\.pdf($|\?)/i.test(href)) return track("brochure_download", { file: href.split("/").pop()?.split("?")[0], section });
    if (/^https?:\/\//.test(href) && !href.includes(location.host)) return track("outbound_click", { host: href.split("/")[2], section });
    if (a.matches(".route-bar-stop a, #tier2-nav nav a")) return track("nav_jump", { target: href.replace(/^.*#/, ""), page_type: pageType() });
  }, true);

  // a film actually playing (once per film per page) — says which footage holds people
  const played = new WeakSet<Element>();
  document.addEventListener("playing", (ev) => {
    const v = ev.target as HTMLVideoElement;
    if (!(v instanceof HTMLVideoElement) || played.has(v)) return;
    played.add(v);
    track("film_play", { section: sectionOf(v), page_type: pageType() });
  }, true);

  // real-world speed, as visitors experience it
  try {
    let lcp = 0; let cls = 0;
    new PerformanceObserver((l) => { const e = l.getEntries().pop(); if (e) lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) if (!e.hadRecentInput) cls += e.value; }).observe({ type: "layout-shift", buffered: true });
    addEventListener("pagehide", () => track("web_vitals", { lcp_ms: Math.round(lcp), cls: Math.round(cls * 1000) / 1000, page_type: pageType() }), { once: true });
  } catch { /* older browsers */ }
}
