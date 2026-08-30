import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./styles/main.css";
import Tier2 from "./pages/Tier2";

const Asia = lazy(() => import("./pages/Asia"));
const CountryDetailRoute = lazy(() => import("./pages/CountryDetailRoute"));

const path = window.location.pathname.replace(/\/+$/, "");
const countrySlug = path.match(/^\/asia\/([a-z0-9-]+)$/)?.[1];
const page = countrySlug ? (
  <Suspense fallback={null}>
    <CountryDetailRoute slug={countrySlug} />
  </Suspense>
) : path === "/asia" ? (
  <Suspense fallback={null}>
    <Asia />
  </Suspense>
) : (
  <Tier2 />
);

createRoot(document.getElementById("root")!).render(page);

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
