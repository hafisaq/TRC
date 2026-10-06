// The site's sound, made in the browser rather than played from a file:
// nothing to license, nothing to download. Three layers through one soft
// reverb —
//   · a drone on A, its fifth and its octave: sine waves that swell and
//     ebb on slow, unequal cycles, so the chord never sits still
//   · a pad an octave above: softened, filtered, breathing with the drone,
//     which is what gives the bed its body on small speakers
//   · singing bowls: one note of a pentatonic scale struck every few
//     seconds — sometimes two together — with a bowl's inharmonic
//     overtones and slow beating, left to ring for ten seconds
// The master fades in and out, never cuts; the visitor's volume rides on
// top of it. On iPhones the ring/silent switch mutes web audio unless a
// real <audio> element is playing, so a silent one is started with the
// first touch (see unlockSession).

type Ambient = {
  start: () => Promise<boolean>;
  setMuted: (muted: boolean) => void;
  setVolume: (v: number) => void; // 0..1
  dispose: () => void;
  running: () => boolean;
};

const LEVEL = 0.9; // the bed at full volume (layers below are themselves quiet)
const SCALE = [220, 246.94, 293.66, 329.63, 392, 440, 493.88, 587.33]; // A pentatonic-ish, low register
const CHORD_PAIRS: Array<[number, number]> = [[220, 329.63], [246.94, 392], [293.66, 440], [329.63, 493.88], [392, 587.33]];

// a quarter-second of silence as a WAV, for the iPhone session trick
function silentWav() {
  const rate = 8000, n = rate / 4, size = 44 + n;
  const b = new DataView(new ArrayBuffer(size));
  const str = (o: number, s: string) => [...s].forEach((ch, i) => b.setUint8(o + i, ch.charCodeAt(0)));
  str(0, "RIFF"); b.setUint32(4, size - 8, true); str(8, "WAVE"); str(12, "fmt "); b.setUint32(16, 16, true);
  b.setUint16(20, 1, true); b.setUint16(22, 1, true); b.setUint32(24, rate, true); b.setUint32(28, rate, true);
  b.setUint16(32, 1, true); b.setUint16(34, 8, true); str(36, "data"); b.setUint32(40, n, true);
  for (let i = 0; i < n; i++) b.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([b.buffer], { type: "audio/wav" }));
}
let session: HTMLAudioElement | null = null;
function unlockSession() {
  if (session) return;
  try {
    session = new Audio(silentWav());
    session.loop = true;
    session.volume = 0.01;
    session.setAttribute("playsinline", "");
    session.play().catch(() => { session = null; });
  } catch { session = null; }
}

export function createAmbient(): Ambient {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let bowlTimer: ReturnType<typeof setTimeout> | undefined;
  let muted = false;
  let volume = 1;
  let disposed = false;

  const build = () => {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    const c = ctx;
    master = c.createGain();
    master.gain.value = 0;
    master.connect(c.destination);

    const ceiling = c.createBiquadFilter(); // the tones are never bright or harsh
    ceiling.type = "lowpass";
    ceiling.frequency.value = 5600;
    ceiling.connect(master);

    // the room: a few seconds of decaying noise as an impulse response
    const reverb = c.createConvolver();
    const seconds = 4.5;
    const ir = c.createBuffer(2, Math.floor(c.sampleRate * seconds), c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.6);
    }
    reverb.buffer = ir;
    const wet = c.createGain();
    wet.gain.value = 0.65;
    reverb.connect(wet).connect(ceiling);
    const dry = c.createGain();
    dry.gain.value = 0.6;
    dry.connect(ceiling);
    const bus = c.createGain(); // everything plays into this: part dry, part into the room
    bus.connect(dry);
    bus.connect(reverb);

    // ---- drone ----
    const voice = (type: OscillatorType, freq: number, level: number, lfoHz: number, detune = 0, cutoff?: number) => {
      const osc = c.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const g = c.createGain();
      g.gain.value = level * 0.65;
      // the swell: an LFO riding the layer's own gain
      const lfo = c.createOscillator();
      lfo.frequency.value = lfoHz;
      const depth = c.createGain();
      depth.gain.value = level * 0.35;
      lfo.connect(depth).connect(g.gain);
      if (cutoff) {
        const lp = c.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = cutoff;
        lp.Q.value = 0.4;
        osc.connect(lp).connect(g).connect(bus);
      } else {
        osc.connect(g).connect(bus);
      }
      osc.start();
      lfo.start();
    };
    voice("sine", 110, 0.12, 0.043);
    voice("sine", 110, 0.07, 0.031, 6);           // a few cents apart: warmth, slow beating
    voice("sine", 164.81, 0.07, 0.057);
    voice("sine", 220, 0.05, 0.071, -5);
    voice("sine", 55, 0.08, 0.023);               // the floor under it all
    // ---- pad: the same chord an octave up, softened — the part a phone can hear ----
    voice("triangle", 220, 0.045, 0.037, 4, 900);
    voice("triangle", 329.63, 0.035, 0.049, -3, 1100);
    voice("triangle", 440, 0.028, 0.061, 5, 1300);

    // ---- bowls ----
    const bowl = (f: number, when: number, loud = 1) => {
      const ring = 9 + Math.random() * 4;
      // a bowl's overtones are not whole multiples of its note
      [[1, 1], [2.76, 0.32], [5.4, 0.1]].forEach(([ratio, weight]) => {
        [0, 0.6].forEach((beat, k) => {
          const osc = c.createOscillator();
          osc.type = "sine";
          osc.frequency.value = f * ratio + beat; // two voices a hair apart: the bowl's slow wobble
          const g = c.createGain();
          const peak = 0.11 * loud * weight * (k ? 0.7 : 1);
          g.gain.setValueAtTime(0.0001, when);
          g.gain.exponentialRampToValueAtTime(peak, when + 0.04);
          g.gain.exponentialRampToValueAtTime(0.0001, when + ring / (ratio > 1 ? 1.8 : 1));
          osc.connect(g).connect(bus);
          osc.start(when);
          osc.stop(when + ring + 0.2);
        });
      });
    };
    const strike = () => {
      if (disposed || !ctx) return;
      if (ctx.state === "running" && !muted) {
        const now = c.currentTime;
        if (Math.random() < 0.3) {
          // now and then, two notes a fifth apart, the second a breath later
          const [a, b] = CHORD_PAIRS[Math.floor(Math.random() * CHORD_PAIRS.length)];
          bowl(a, now);
          bowl(b, now + 0.9, 0.8);
        } else {
          bowl(SCALE[Math.floor(Math.random() * SCALE.length)], now);
        }
      }
      bowlTimer = setTimeout(strike, 4000 + Math.random() * 5000);
    };
    bowlTimer = setTimeout(strike, 1500);
    return true;
  };

  const target = () => (muted ? 0 : LEVEL * volume);
  const fade = (to: number, seconds: number) => {
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(to, now + seconds);
  };

  const onVisibility = () => {
    if (!ctx) return;
    if (document.hidden) { fade(0, 0.4); setTimeout(() => document.hidden && ctx?.suspend(), 450); }
    else if (!muted) ctx.resume().then(() => fade(target(), 1.5)).catch(() => undefined);
  };

  return {
    // Tried once on load (works where the browser already trusts the page:
    // arriving by a click from another page of the site, in Chrome) and
    // again from inside the visitor's first tap, click or key press.
    async start() {
      if (disposed) return false;
      unlockSession();
      if (!ctx && !build()) return false;
      // Without a user gesture some browsers leave resume() pending
      // forever, so it is given a moment and then judged by the state.
      try { await Promise.race([ctx!.resume(), new Promise((r) => setTimeout(r, 300))]); } catch { return false; }
      if (ctx!.state !== "running") return false;
      document.removeEventListener("visibilitychange", onVisibility);
      document.addEventListener("visibilitychange", onVisibility);
      if (!muted) fade(target(), 3);
      return true;
    },
    setMuted(next) {
      muted = next;
      if (!ctx) return;
      if (next) { fade(0, 0.6); setTimeout(() => muted && ctx?.suspend(), 700); }
      else ctx.resume().then(() => fade(target(), 1.2)).catch(() => undefined);
    },
    setVolume(v) {
      volume = Math.min(1, Math.max(0, v));
      if (ctx && ctx.state === "running" && !muted) fade(target(), 0.15);
    },
    running: () => !!ctx && ctx.state === "running" && !muted,
    dispose() {
      disposed = true;
      clearTimeout(bowlTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      ctx?.close().catch(() => undefined);
      ctx = null;
    }
  };
}
