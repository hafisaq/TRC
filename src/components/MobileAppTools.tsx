import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, Check, Copy, Ellipsis, Maximize, Minimize, Share2, Smartphone, X } from "lucide-react";
import { canUseFullscreen, getAppState, isAppleMobile, requestAppInstall, subscribeAppState } from "../lib/pwa";
import { pauseSmoothScroll } from "../lib/scroll";
import { t } from "../lib/i18n";
import "./mobile-app-tools.css";


export default function MobileAppTools({ tone = "light" }: { tone?: "light" | "dark" }) {
  const app = useSyncExternalStore(subscribeAppState, getAppState);
  // every label is an app.* string, editable in Sanity (en--ui / ar--ui)
  const copy = {
    options: t("app.options"),
    title: t("app.title"),
    close: t("app.close"),
    back: t("app.back"),
    install: t("app.install"),
    add: t("app.add"),
    installed: t("app.installed"),
    share: t("app.share"),
    copy: t("app.copy"),
    copied: t("app.copied"),
    fullscreen: t("app.fullscreen"),
    exit: t("app.exit"),
    requested: t("app.requested"),
    installError: t("app.installError"),
    fullscreenError: t("app.fullscreenError"),
    shareError: t("app.shareError"),
    manualCopy: t("app.manualCopy"),
    offline: t("app.offline"),
    browserNote: t("app.browserNote"),
    appleSteps: [t("app.apple1"), t("app.apple2"), t("app.apple3")],
    browserSteps: [t("app.browser1"), t("app.browser2")],
  };
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [manualLink, setManualLink] = useState("");

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!open) return;
    const element = dialog.current!;
    const resumeScroll = pauseSmoothScroll();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      resumeScroll();
      trigger.current?.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (open) (help && !app.installed ? backButton : closeButton).current?.focus({ preventScroll: true });
  }, [open, help, app.installed]);

  const close = () => setOpen(false);
  const show = () => {
    setMessage("");
    setManualLink("");
    setHelp(false);
    setOpen(true);
  };
  const copyLink = async () => {
    const url = window.location.href;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      setManualLink("");
      setMessage(copy.copied);
    } catch {
      setManualLink(url);
      setMessage(copy.manualCopy);
    }
  };
  const share = async () => {
    setBusy(true);
    setMessage("");
    try {
      await navigator.share({ title: document.title, url: window.location.href });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setMessage(copy.shareError);
    } finally { setBusy(false); }
  };
  const install = async () => {
    if (!app.installReady) { setHelp(true); setMessage(""); return; }
    setBusy(true);
    setMessage("");
    try {
      const outcome = await requestAppInstall();
      if (outcome === "accepted") setMessage(copy.requested);
    } catch { setMessage(copy.installError); }
    finally { setBusy(false); }
  };
  const toggleFullscreen = async () => {
    setBusy(true);
    setMessage("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen({ navigationUI: "hide" });
      close();
    } catch { setMessage(copy.fullscreenError); }
    finally { setBusy(false); }
  };
  const shareAvailable = typeof navigator.share === "function" &&
    (!navigator.canShare || navigator.canShare({ title: document.title, url: window.location.href }));

  return (
    <div className={`mobile-app-tools mobile-app-tools--${tone}`}>
      <button ref={trigger} type="button" className="app-tools-trigger" aria-label={copy.options}
        title={copy.options} aria-haspopup="dialog" aria-controls={id} aria-expanded={open} onClick={show}>
        <Ellipsis size={24} strokeWidth={1.5} aria-hidden="true" />
      </button>
      <dialog ref={dialog} id={id} className="app-tools-sheet" aria-labelledby={`${id}-title`} aria-modal="true" data-lenis-prevent
        onCancel={close} onClose={close} onKeyDown={event => {
          if (event.key !== "Tab") return;
          const controls = [...event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled)")];
          const first = controls[0];
          const last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }} onClick={event => {
          if (event.target !== event.currentTarget) return;
          const r = event.currentTarget.getBoundingClientRect();
          if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
        }}>
        <div className="app-tools-heading">
          {help && !app.installed && <button ref={backButton} type="button" className="app-tools-icon" aria-label={copy.back} title={copy.back} onClick={() => setHelp(false)}><ArrowLeft size={20} aria-hidden="true" /></button>}
          <h2 id={`${id}-title`}>{help && !app.installed ? copy.add : copy.title}</h2>
          <button ref={closeButton} type="button" className="app-tools-icon" aria-label={copy.close} title={copy.close} onClick={close} autoFocus><X size={20} aria-hidden="true" /></button>
        </div>
        {help && !app.installed ? (
          <div className="app-tools-help">
            <ol>{(isAppleMobile() ? copy.appleSteps : copy.browserSteps).map(step => <li key={step}>{step}</li>)}</ol>
            {!isAppleMobile() && <p>{copy.browserNote}</p>}
          </div>
        ) : (
          <div className="app-tools-actions">
            {shareAvailable && <button type="button" disabled={busy} onClick={share}><Share2 aria-hidden="true" /><span>{copy.share}</span></button>}
            <button type="button" disabled={busy} onClick={copyLink}><Copy aria-hidden="true" /><span>{copy.copy}</span></button>
            {(app.fullscreen || canUseFullscreen()) && <button type="button" disabled={busy} onClick={toggleFullscreen}>
              {app.fullscreen ? <Minimize aria-hidden="true" /> : <Maximize aria-hidden="true" />}<span>{app.fullscreen ? copy.exit : copy.fullscreen}</span>
            </button>}
            {app.installed ? <p className="app-tools-installed"><Check size={20} aria-hidden="true" />{copy.installed}</p> : (
              <button type="button" disabled={busy} onClick={install}><Smartphone aria-hidden="true" /><span>{app.installReady ? copy.install : copy.add}</span></button>
            )}
          </div>
        )}
        <p role="status" className="app-tools-status">{message}</p>
        {manualLink && <input className="app-tools-link" aria-label={copy.manualCopy} value={manualLink} readOnly onFocus={event => event.currentTarget.select()} />}
        {!app.online && <p className="app-tools-offline">{copy.offline}</p>}
      </dialog>
    </div>
  );
}
