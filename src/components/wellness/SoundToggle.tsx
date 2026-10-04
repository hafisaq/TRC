import { useEffect, useRef, useState } from "react";
import { createAmbient } from "../../lib/ambient";
import { t } from "../../lib/i18n";

const KEY = "trc-wellness-sound";

// The wellness page's sound, and its switch. Browsers only allow audio
// after the visitor has touched the page, so the sound waits for the first
// tap, click or key anywhere, then fades in; this button mutes and unmutes
// it. The sound is ON by default on every visit: a mute lasts for the
// browsing session (so moving around the page or reloading keeps it
// quiet), but a new visit starts with sound again. The bars move only
// while it plays.
export default function SoundToggle({ className = "" }: { className?: string }) {
  const ambient = useRef<ReturnType<typeof createAmbient> | null>(null);
  const [muted, setMuted] = useState(() => {
    try { return sessionStorage.getItem(KEY) === "off"; } catch { return false; }
  });
  const [playing, setPlaying] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    const a = (ambient.current = createAmbient());
    a.setMuted(mutedRef.current);
    const begin = (e: Event) => {
      // the button handles its own press
      if ((e.target as Element | null)?.closest?.("[data-sound-toggle]")) return;
      if (mutedRef.current) return;
      a.start().then((ok) => { if (ok) { setPlaying(true); stop(); } });
    };
    const events = ["pointerdown", "pointerup", "mousedown", "keydown", "touchend", "click"] as const;
    const stop = () => events.forEach((ev) => window.removeEventListener(ev, begin, true));
    events.forEach((ev) => window.addEventListener(ev, begin, { passive: true, capture: true }));
    // on by default: try at once. A browser that already trusts the page
    // (a visitor who clicked through from the home page, in Chrome) plays
    // straight away; the rest start with the first touch above. Scrolling
    // alone is not a touch a browser accepts, hence the hint on the switch.
    if (!mutedRef.current) a.start().then((ok) => { if (ok) { setPlaying(true); stop(); } });
    return () => { stop(); a.dispose(); ambient.current = null; };
  }, []);

  const toggle = () => {
    const a = ambient.current;
    if (!a) return;
    if (!muted && !playing) {
      // not started yet: this press is the gesture that starts it
      a.start().then((ok) => setPlaying(ok));
      return;
    }
    const next = !muted;
    setMuted(next);
    try { sessionStorage.setItem(KEY, next ? "off" : "on"); } catch { /* private mode */ }
    a.setMuted(next);
    if (!next) a.start().then((ok) => setPlaying(ok));
  };

  const on = playing && !muted;
  const waiting = !muted && !playing; // wants to play; the browser is waiting for a touch
  const label = muted ? t("sound.unmute") : waiting ? t("sound.tap") : t("sound.mute");
  return (
    <button
      type="button"
      data-sound-toggle
      onClick={toggle}
      aria-pressed={!muted}
      aria-label={label}
      title={label}
      className={`sound-toggle ${on ? "is-on" : ""} ${muted ? "is-muted" : ""} ${waiting ? "is-waiting" : ""} ${className}`}
    >
      <span className="sound-toggle__bars" aria-hidden="true">
        <i /><i /><i /><i />
      </span>
      <span className="sound-toggle__label" aria-hidden="true">{muted ? t("sound.off") : waiting ? t("sound.tap") : t("sound.on")}</span>
    </button>
  );
}
