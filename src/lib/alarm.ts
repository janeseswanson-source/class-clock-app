// Synthesized alarm via Web Audio. Auto-silences after N seconds.
import type { AlarmStyle } from "./types";

type Ctx = AudioContext | null;
let ctx: Ctx = null;
let stopTimer: number | null = null;
let activeOscs: OscillatorNode[] = [];
let activeGain: GainNode | null = null;

function getCtx(): Ctx {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const W = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const AC = W.AudioContext ?? W.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/* ── autoplay unlock ──────────────────────────────────────────────────────
 * Browsers refuse to start an AudioContext that has never seen a user gesture.
 * A wall display gets loaded once and then left alone, so if the first thing to
 * touch audio is the alarm itself, the alarm is silent for the whole day. These
 * helpers unlock the context on the first interaction and let the UI prompt for
 * one when it hasn't happened yet.
 */

const readyListeners = new Set<(ready: boolean) => void>();

function notifyReady() {
  const ready = isAudioReady();
  readyListeners.forEach((l) => l(ready));
}

export function isAudioReady(): boolean {
  return ctx !== null && ctx.state === "running";
}

export function onAudioReadyChange(listener: (ready: boolean) => void): () => void {
  readyListeners.add(listener);
  return () => readyListeners.delete(listener);
}

/** Starts (or resumes) the audio context. Must be called from a user gesture. */
export async function unlockAudio(): Promise<boolean> {
  const c = getCtx();
  if (!c) return false;
  try {
    if (c.state === "suspended") await c.resume();
    // A zero-length silent buffer is enough to satisfy iOS Safari.
    const buffer = c.createBuffer(1, 1, c.sampleRate);
    const source = c.createBufferSource();
    source.buffer = buffer;
    source.connect(c.destination);
    source.start(0);
  } catch {
    /* ignore — reported through isAudioReady() */
  }
  notifyReady();
  return isAudioReady();
}

/** Unlocks audio on the first pointer/key event anywhere in the app. */
export function installAudioUnlock(): () => void {
  if (typeof window === "undefined") return () => {};
  const events = ["pointerdown", "keydown", "touchstart"] as const;
  const handler = () => {
    void unlockAudio().then((ok) => {
      if (ok) remove();
    });
  };
  const remove = () => events.forEach((e) => window.removeEventListener(e, handler));
  events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
  return remove;
}

export function stopAlarm() {
  if (stopTimer !== null) {
    window.clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (activeGain && ctx) {
    try {
      activeGain.gain.cancelScheduledValues(ctx.currentTime);
      activeGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
    } catch {
      /* ignore */
    }
  }
  activeOscs.forEach((o) => {
    try {
      o.stop();
    } catch {
      /* ignore */
    }
  });
  activeOscs = [];
  activeGain = null;
}

interface StylePreset {
  wave: OscillatorType;
  notes: number[];
  noteDur: number;
  gap: number;
  cycleGap: number;
  peak: number;
}

const PRESETS: Record<AlarmStyle, StylePreset> = {
  chime: { wave: "sine", notes: [880, 660, 990], noteDur: 0.35, gap: 0.05, cycleGap: 0.15, peak: 0.8 },
  bell: { wave: "triangle", notes: [1320, 990, 1760], noteDur: 0.45, gap: 0.05, cycleGap: 0.3, peak: 0.7 },
  buzzer: { wave: "square", notes: [220, 220], noteDur: 0.2, gap: 0.08, cycleGap: 0.05, peak: 0.35 },
  soft_tone: { wave: "sine", notes: [523, 659], noteDur: 0.6, gap: 0.15, cycleGap: 0.4, peak: 0.5 },
};

export function playAlarm(autoOffSeconds: number, style: AlarmStyle = "chime") {
  const c = getCtx();
  if (!c) return;
  stopAlarm();
  if (c.state === "suspended") {
    c.resume()
      .then(notifyReady)
      .catch(() => {});
  }

  const preset = PRESETS[style] ?? PRESETS.chime;

  const master = c.createGain();
  master.gain.value = 0.001;
  master.gain.exponentialRampToValueAtTime(0.25, c.currentTime + 0.02);
  master.connect(c.destination);
  activeGain = master;

  const t0 = c.currentTime;
  const total = autoOffSeconds;
  let t = t0;
  let safety = 0;

  while (t < t0 + total && safety < 400) {
    preset.notes.forEach((freq) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = preset.wave;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(preset.peak, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + preset.noteDur);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + preset.noteDur + 0.02);
      activeOscs.push(osc);
      t += preset.noteDur + preset.gap;
      safety += 1;
    });
    t += preset.cycleGap;
  }

  stopTimer = window.setTimeout(() => stopAlarm(), autoOffSeconds * 1000);
}
