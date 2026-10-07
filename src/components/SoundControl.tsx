import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createAmbient } from "../lib/ambient";
import { t } from "../lib/i18n";
import "./sound-control.css";

const MUTE_KEY = "trc-sound";       // session: a mute lasts the visit
const VOLUME_KEY = "trc-sound-vol"; // remembered

// The site's sound and its controls, on every page: a small bars icon in
// the header (each page's header renders a `.sound-slot` for it to live
// in) that opens a panel below itself with a mute and a volume slider.
// The icon's ring pulses while the browser is still waiting for the
// visitor's first touch (browsers accept a click, tap or key — never a
// scroll). Sound is ON by default on every visit; a mute lasts for the
// browsing session, the volume is remembered.
export default function SoundControl() {
  const ambient = useRef<ReturnType<typeof createAmbient> | null>(null);
  const [muted, setMuted] = useState(() => { try { return sessionStorage.getItem(MUTE_KEY) === "off"; } catch { return false; } });
  const [volume, setVolume] = useState(() => { try { const v = Number(localStorage.getItem(VOLUME_KEY)); return v >= 0 && v <= 1 && localStorage.getItem(VOLUME_KEY) !== null ? v : 0.5; } catch { return 0.5; } });
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const rootRef = useRef<HTMLDivElement>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => { setSlot(document.querySelector<HTMLElement>(".sound-slot")); }, []);

  useEffect(() => {
    const a = (ambient.current = createAmbient());
    a.setMuted(mutedRef.current);
    a.setVolume(volume);
    const begin = (e: Event) => {
      if ((e.target as Element | null)?.closest?.("[data-sound-control]")) return; // the control handles its own press
      if (mutedRef.current) return;
      a.start().then((ok) => { if (ok) { setPlaying(true); stop(); } });
    };
    const events = ["pointerdown", "pointerup", "mousedown", "keydown", "touchend", "click"] as const;
    const stop = () => events.forEach((ev) => window.removeEventListener(ev, begin, true));
    events.forEach((ev) => window.addEventListener(ev, begin, { passive: true, capture: true }));
    if (!mutedRef.current) a.start().then((ok) => { if (ok) { setPlaying(true); stop(); } });
    return () => { stop(); a.dispose(); ambient.current = null; };
    // volume is applied through its own effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { ambient.current?.setVolume(volume); }, [volume]);

  // the panel closes on a press anywhere else, or Escape
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", away, true);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", away, true); document.removeEventListener("keydown", key); };
  }, [open]);

  const ensureStarted = () => {
    const a = ambient.current;
    if (a && !playing && !mutedRef.current) a.start().then((ok) => setPlaying(ok));
  };
  const toggleMute = () => {
    const a = ambient.current;
    if (!a) return;
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    try { sessionStorage.setItem(MUTE_KEY, next ? "off" : "on"); } catch { /* private mode */ }
    a.setMuted(next);
    if (!next) a.start().then((ok) => setPlaying(ok));
  };
  const changeVolume = (v: number) => {
    setVolume(v);
    try { localStorage.setItem(VOLUME_KEY, String(v)); } catch { /* private mode */ }
    if (v > 0 && muted) toggleMute();
    ensureStarted();
  };

  const waiting = !muted && !playing;
  const on = playing && !muted;
  const state = muted ? t("sound.off") : waiting ? t("sound.tap") : t("sound.on");

  const control = (
    <div ref={rootRef} data-sound-control className={`sound-control ${open ? "is-open" : ""} ${on ? "is-on" : ""} ${muted ? "is-muted" : ""} ${waiting ? "is-waiting" : ""}`}>
      <button
        type="button"
        className="sound-control__pill"
        onClick={() => { ensureStarted(); setOpen((o) => !o); }}
        aria-expanded={open}
        aria-label={state}
        title={state}
      >
        <span className="sound-control__bars" aria-hidden="true"><i /><i /><i /><i /></span>
      </button>
      <div className="sound-control__panel" role="group" aria-label={t("sound.volume")}>
        <button type="button" className="sound-control__mute" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? t("sound.unmute") : t("sound.mute")}>
          <SpeakerIcon muted={muted} />
        </button>
        <input
          type="range" min={0} max={100} step={1} value={Math.round(volume * 100)}
          onChange={(e) => changeVolume(Number(e.target.value) / 100)}
          aria-label={t("sound.volume")}
          className="sound-control__slider"
          style={{ ["--fill" as string]: `${Math.round((muted ? 0 : volume) * 100)}%` }}
        />
        <span className="sound-control__value">{Math.round((muted ? 0 : volume) * 100)}</span>
        <span className="sound-control__state">{state}</span>
      </div>
    </div>
  );
  // in the header when the page offers a slot; otherwise (no header on
  // the page) at the bottom right of the screen
  return slot ? createPortal(control, slot) : <div className="sound-control-float">{control}</div>;
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
      {muted ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <><path d="M15.5 9.2a4 4 0 0 1 0 5.6" /><path d="M18.2 6.8a7.5 7.5 0 0 1 0 10.4" /></>}
    </svg>
  );
}
