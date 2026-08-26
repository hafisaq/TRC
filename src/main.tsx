import { createRoot } from "react-dom/client";
import "./styles/main.css";
import Tier2 from "./pages/Tier2";

createRoot(document.getElementById("root")!).render(<Tier2 />);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
