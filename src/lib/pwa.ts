type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type AppState = {
  installed: boolean;
  appMode: boolean;
  installReady: boolean;
  fullscreen: boolean;
  online: boolean;
};

let deferredPrompt: InstallPrompt | null = null;
let installedThisSession = false;
const listeners = new Set<() => void>();
let dispose: (() => void) | undefined;

function readState(): AppState {
  const fullscreen = Boolean(document.fullscreenElement);
  // API fullscreen is a temporary browser state, not proof of installation.
  const appMode = Boolean((navigator as Navigator & { standalone?: boolean }).standalone) ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    (window.matchMedia("(display-mode: fullscreen)").matches && !fullscreen);
  return {
    installed: appMode || installedThisSession,
    appMode,
    installReady: Boolean(deferredPrompt) && !appMode && !installedThisSession,
    fullscreen,
    online: navigator.onLine,
  };
}

let state = readState();

function publish() {
  const next = readState();
  document.documentElement.dataset.displayMode = next.appMode ? "standalone" : next.fullscreen ? "fullscreen" : "browser";
  if ((Object.keys(next) as (keyof AppState)[]).every(key => next[key] === state[key])) return;
  state = next;
  listeners.forEach(listener => listener());
}

// Register before the asynchronous CMS/page load so Chrome's event is not lost.
export function initializeAppFeatures() {
  if (dispose) return;
  const capture = (event: Event) => {
    if (typeof (event as InstallPrompt).prompt !== "function" || state.installed) return;
    event.preventDefault();
    deferredPrompt = event as InstallPrompt;
    publish();
  };
  const installed = () => {
    installedThisSession = true;
    deferredPrompt = null;
    publish();
  };
  const modes = ["standalone", "minimal-ui", "fullscreen"].map(mode => window.matchMedia(`(display-mode: ${mode})`));
  modes.forEach(mode => mode.addEventListener("change", publish));
  window.addEventListener("beforeinstallprompt", capture);
  window.addEventListener("appinstalled", installed);
  window.addEventListener("pageshow", publish);
  window.addEventListener("online", publish);
  window.addEventListener("offline", publish);
  document.addEventListener("fullscreenchange", publish);
  publish();
  dispose = () => {
    modes.forEach(mode => mode.removeEventListener("change", publish));
    window.removeEventListener("beforeinstallprompt", capture);
    window.removeEventListener("appinstalled", installed);
    window.removeEventListener("pageshow", publish);
    window.removeEventListener("online", publish);
    window.removeEventListener("offline", publish);
    document.removeEventListener("fullscreenchange", publish);
  };
}

export const getAppState = () => state;
export function subscribeAppState(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export async function requestAppInstall() {
  const prompt = deferredPrompt;
  if (!prompt || state.installed) return null;
  deferredPrompt = null;
  publish();
  // A captured event is single-use. Keep the native call in the click gesture.
  await prompt.prompt();
  return (await prompt.userChoice).outcome;
}

export function isAppleMobile() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

export function canUseFullscreen() {
  return document.fullscreenEnabled === true && typeof document.documentElement.requestFullscreen === "function";
}

if (import.meta.hot) import.meta.hot.dispose(() => dispose?.());
