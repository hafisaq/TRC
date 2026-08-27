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

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
