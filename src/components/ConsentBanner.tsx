import { useEffect, useState } from "react";
import { needsConsentChoice, onConsentChange, setConsent } from "../lib/analytics";
import { t } from "../lib/i18n";
import "./consent-banner.css";

// Shown once, only when analytics is switched on in Sanity and the visitor
// has not chosen yet. Sits above the bottom route strip on small screens.
export default function ConsentBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const sync = () => setShow(needsConsentChoice());
    const timer = window.setTimeout(sync, 2200); // after the loader and hero have had their moment
    const off = onConsentChange(sync);
    return () => { window.clearTimeout(timer); off(); };
  }, []);
  if (!show) return null;
  return (
    <div className="consent-banner" role="dialog" aria-live="polite" aria-label={t("consent.title")}>
      <p><strong>{t("consent.title")}</strong> {t("consent.text")}</p>
      <div className="consent-actions">
        <button type="button" className="consent-decline" onClick={() => setConsent("denied")}>{t("consent.decline")}</button>
        <button type="button" className="consent-accept" onClick={() => setConsent("granted")}>{t("consent.accept")}</button>
      </div>
    </div>
  );
}
