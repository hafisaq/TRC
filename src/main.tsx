import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./styles/main.css";
import Tier2 from "./pages/Tier2";

const CountryDetailRoute = lazy(() => import("./pages/CountryDetailRoute"));

const path = window.location.pathname.replace(/\/+$/, "");
const routeMatch = path.match(/^\/(asia|alpine)\/([a-z0-9-]+)$/);
// the standalone region pages are gone — home's per-region selector is the
// region browser now; old links land there
if (path === "/asia") {
  window.location.replace("/#tier2-asia-countries");
}
if (path === "/alpine") {
  window.location.replace("/#tier2-alpine-countries");
}
const page = routeMatch ? (
  <Suspense fallback={null}>
    <CountryDetailRoute regionSlug={routeMatch[1]} slug={routeMatch[2]} />
  </Suspense>
) : (
  <Tier2 />
);

// Hydrate content from Sanity BEFORE first render (3s budget) — on any
// failure the bundled demo content renders unchanged. The home page's own
// loader covers the wait.
import { hydrateFromCms } from "./lib/cms";
hydrateFromCms().finally(() => {
  createRoot(document.getElementById("root")!).render(page);
});

const standalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

document.documentElement.dataset.displayMode = standalone ? "standalone" : "browser";

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => registration.update().catch(() => undefined))
      .catch(() => undefined);
  });
}
