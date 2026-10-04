// The wellness page's sound, made in the browser rather than played from a
// file: nothing to license, nothing to download. Two quiet layers through
// one soft reverb —
//   · a drone on A, its fifth and its octave: sine waves that swell and
//     ebb on slow, unequal cycles, so the chord never sits still
//   · singing bowls: one note of a pentatonic scale struck every several
//     seconds, with a bowl's inharmonic overtones and slow beating, left
//     to ring for ten seconds
// No noise layers (synthesised rain reads as hiss on small speakers).
// Everything is kept low; the master fades in and out, never cuts.

type Ambient = { start: () => Promise<boolean>; setMuted: (muted: boolean) => void; dispose: () => void; running: () => boolean };

const LEVEL = 0.38; // master, over layers that are already quiet
const SCALE = [220, 246.94, 293.66, 329.63, 392, 440, 587.33]; // A pentatonic-ish, low register

export function createAmbient(): Ambient {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let bowlTimer: ReturnType<typeof setTimeout> | undefined;
  let muted = false;
  let disposed = false;

  const build = () => {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    const c = ctx;
    master = c.createGain();
    master.gain.value = 0;
    master.connect(c.destination);

    const toneBus = c.createGain();
    toneBus.gain.value = 1;
    const ceiling = c.createBiquadFilter(); // the tones are never bright or harsh
    ceiling.type = "lowpass";
    ceiling.frequency.value = 5200;
    toneBus.connect(ceiling).connect(master);

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
    wet.gain.value = 0.7;
    reverb.connect(wet).connect(toneBus);
    const dry = c.createGain();
    dry.gain.value = 0.55;
    dry.connect(toneBus);
    const bus = c.createGain(); // the tones play into this: part dry, part into the room
    bus.connect(dry);
    bus.connect(reverb);

    // ---- drone ----
    const drone = (freq: number, level: number, lfoHz: number, detune = 0) => {
      const osc = c.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const g = c.createGain();
      g.gain.value = level * 0.6;
      // the swell: an LFO riding the layer's own gain
      const lfo = c.createOscillator();
      lfo.frequency.value = lfoHz;
      const depth = c.createGain();
      depth.gain.value = level * 0.4;
      lfo.connect(depth).connect(g.gain);
      osc.connect(g).connect(bus);
      osc.start();
      lfo.start();
    };
    drone(110, 0.085, 0.043);
    drone(110, 0.05, 0.031, 5);          // a few cents apart: warmth, slow beating
    drone(164.81, 0.045, 0.057);
    drone(220, 0.03, 0.071, -4);
    drone(55, 0.06, 0.023);              // the floor under it all

    // ---- bowls ----
    const strike = () => {
      if (disposed || !ctx) return;
      if (ctx.state === "running" && !muted) {
        const now = c.currentTime;
        const f = SCALE[Math.floor(Math.random() * SCALE.length)];
        const ring = 9 + Math.random() * 4;
        // a bowl's overtones are not whole multiples of its note
        [[1, 1], [2.76, 0.32], [5.4, 0.1]].forEach(([ratio, weight]) => {
          [0, 0.6].forEach((beat, k) => {
            const osc = c.createOscillator();
            osc.type = "sine";
            osc.frequency.value = f * ratio + beat; // two voices a hair apart: the bowl's slow wobble
            const g = c.createGain();
            const peak = 0.05 * weight * (k ? 0.7 : 1);
            g.gain.setValueAtTime(0.0001, now);
            g.gain.exponentialRampToValueAtTime(peak, now + 0.04);
            g.gain.exponentialRampToValueAtTime(0.0001, now + ring / (ratio > 1 ? 1.8 : 1));
            osc.connect(g).connect(bus);
            osc.start(now);
            osc.stop(now + ring + 0.2);
          });
        });
      }
      bowlTimer = setTimeout(strike, 6500 + Math.random() * 7000);
    };
    bowlTimer = setTimeout(strike, 1800);
    return true;
  };

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
    else if (!muted) ctx.resume().then(() => fade(LEVEL, 1.5)).catch(() => undefined);
  };

  return {
    // Tried once on load (works where the browser already trusts the page:
    // arriving by a click from the home page in Chrome, for one) and again
    // from inside the visitor's first tap, click or key press.
    async start() {
      if (disposed) return false;
      if (!ctx && !build()) return false;
      // Without a user gesture some browsers leave resume() pending
      // forever, so it is given a moment and then judged by the state.
      try { await Promise.race([ctx!.resume(), new Promise((r) => setTimeout(r, 300))]); } catch { return false; }
      if (ctx!.state !== "running") return false;
      document.removeEventListener("visibilitychange", onVisibility);
      document.addEventListener("visibilitychange", onVisibility);
      if (!muted) fade(LEVEL, 3);
      return true;
    },
    setMuted(next) {
      muted = next;
      if (!ctx) return;
      if (next) { fade(0, 0.6); setTimeout(() => muted && ctx?.suspend(), 700); }
      else ctx.resume().then(() => fade(LEVEL, 1.2)).catch(() => undefined);
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
