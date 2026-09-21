import { createRoot } from "react-dom/client";
import "./styles/main.css";
import { initializeAppFeatures } from "./lib/pwa";

initializeAppFeatures();

const path = window.location.pathname.replace(/\/+$/, "");
const routeMatch = path.match(/^\/(asia|alpine|coast|desert|cities)\/([a-z0-9-]+)$/);
// the standalone region pages are gone — home's per-region selector is the
// region browser now; old links land there
if (path === "/asia") {
  window.location.replace("/#tier2-asia-countries");
}
if (path === "/alpine") {
  window.location.replace("/#tier2-alpine-countries");
}
if (path === "/coast") {
  window.location.replace("/#tier2-coast-countries");
}
if (path === "/desert") {
  window.location.replace("/#tier2-desert-countries");
}
if (path === "/cities") {
  window.location.replace("/#tier2-cities-countries");
}
// Start the selected page chunk and CMS request together.
const page = routeMatch
  ? import("./pages/CountryDetailRoute").then(({ default: Page }) => <Page regionSlug={routeMatch[1]} slug={routeMatch[2]} />)
  : path === "/about"
    ? import("./pages/AboutPage").then(({ default: Page }) => <Page />)
    : import("./pages/Tier2").then(({ default: Page }) => <Page />);

// The HTML loading mark covers the network wait, before React is ready.
import { hydrateFromCms, SETTINGS } from "./lib/cms";
import { initAnalytics } from "./lib/analytics";
import ConsentBanner from "./components/ConsentBanner";
import { isAr } from "./lib/i18n";

// direction + Arabic type must be in place BEFORE first paint
if (isAr()) {
  document.documentElement.setAttribute("dir", "rtl");
  document.documentElement.setAttribute("lang", "ar");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Sans+Arabic:wght@200;300;400;500&display=swap";
  document.head.appendChild(link);
}
Promise.all([hydrateFromCms(), page]).then(([, content]) => {
  createRoot(document.getElementById("root")!).render(<>{content}<ConsentBanner /></>);
  // after first paint, so measurement never delays the page
  (window.requestIdleCallback ?? ((fn: () => void) => setTimeout(fn, 1200)))(() => initAnalytics(SETTINGS.analytics));
}).catch(() => {
  const status = document.getElementById("boot-status");
  if (status) status.textContent = "The route could not load. Please refresh to try again.";
});

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => registration.update().catch(() => undefined))
      .catch(() => undefined);
  });
}
