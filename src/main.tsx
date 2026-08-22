import { createRoot } from "react-dom/client";
import "./styles/main.css";
import App from "./App";
import Tier2 from "./pages/Tier2";

const isTier2 = window.location.pathname.replace(/\/+$/, "") === "/tier2";

createRoot(document.getElementById("root")!).render(isTier2 ? <Tier2 /> : <App />);
