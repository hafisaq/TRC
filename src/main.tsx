import { createRoot } from "react-dom/client";
import "./styles/main.css";
import Tier2 from "./pages/Tier2";
import Asia from "./pages/Asia";
import CountryDetail from "./pages/CountryDetail";
import { ASIA } from "./data/regions/asia";

const path = window.location.pathname.replace(/\/+$/, "");
const countrySlug = path.match(/^\/asia\/([a-z0-9-]+)$/)?.[1];
const page = countrySlug ? (
  <CountryDetail region={ASIA} slug={countrySlug} />
) : path === "/asia" ? (
  <Asia />
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
