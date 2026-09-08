import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, Check, Copy, Ellipsis, Maximize, Minimize, Share2, Smartphone, X } from "lucide-react";
import { canUseFullscreen, getAppState, isAppleMobile, requestAppInstall, subscribeAppState } from "../lib/pwa";
import { pauseSmoothScroll } from "../lib/scroll";
import { isAr } from "../lib/i18n";
import "./mobile-app-tools.css";

const labels = {
  en: {
    options: "App options", title: "Your journey", close: "Close", back: "Back",
    install: "Install Retreat", add: "Add to Home Screen", installed: "Retreat is installed",
    share: "Share this journey", copy: "Copy link", copied: "Link copied",
    fullscreen: "Full screen", exit: "Exit full screen", requested: "Installation requested",
    installError: "Installation is not available right now. Try again from your browser menu.",
    fullscreenError: "Full screen was not allowed by this browser.",
    shareError: "Sharing is unavailable right now. You can copy the link instead.",
    manualCopy: "Select and copy this link", offline: "You are offline. Some photos and films may be unavailable.",
    appleSteps: ["Open this page in Safari, then open the browser's Share menu (it may be under More).", "Choose Add to Home Screen.", "Keep Open as Web App on, if shown, then tap Add."],
    browserSteps: ["Open your browser's menu.", "Choose Install app or Add to Home screen, if offered, and confirm."],
    browserNote: "If that option is missing, open this page in Safari on iPhone or Chrome on Android.",
  },
  ar: {
    options: "خيارات التطبيق", title: "رحلتك", close: "إغلاق", back: "رجوع",
    install: "تثبيت ريتريت", add: "إضافة إلى الشاشة الرئيسية", installed: "تم تثبيت ريتريت",
    share: "مشاركة هذه الرحلة", copy: "نسخ الرابط", copied: "تم نسخ الرابط",
    fullscreen: "ملء الشاشة", exit: "الخروج من ملء الشاشة", requested: "تم طلب التثبيت",
    installError: "التثبيت غير متاح حالياً. حاول مجدداً من قائمة المتصفح.",
    fullscreenError: "لم يسمح المتصفح بوضع ملء الشاشة.",
    shareError: "المشاركة غير متاحة حالياً. يمكنك نسخ الرابط بدلاً من ذلك.",
    manualCopy: "حدد هذا الرابط وانسخه", offline: "أنت غير متصل بالإنترنت. قد لا تتوفر بعض الصور ومقاطع الفيديو.",
    appleSteps: ["افتح هذه الصفحة في سفاري، ثم افتح قائمة المشاركة في المتصفح، وقد تجدها ضمن المزيد.", "اختر إضافة إلى الشاشة الرئيسية.", "اترك خيار فتح كتطبيق ويب مفعّلاً إن ظهر، ثم اضغط إضافة."],
    browserSteps: ["افتح قائمة المتصفح.", "اختر تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية، إن كان متاحاً، ثم أكد الاختيار."],
    browserNote: "إذا لم يظهر الخيار، افتح الصفحة في سفاري على آيفون أو كروم على أندرويد.",
  },
};

export default function MobileAppTools({ tone = "light" }: { tone?: "light" | "dark" }) {
  const app = useSyncExternalStore(subscribeAppState, getAppState);
  const copy = labels[isAr() ? "ar" : "en"];
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
