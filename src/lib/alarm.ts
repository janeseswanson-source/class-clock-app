// Synthesized alarm via Web Audio. Auto-silences after N seconds.

type Ctx = AudioContext | null;
let ctx: Ctx = null;
let stopTimer: number | null = null;
let activeOscs: OscillatorNode[] = [];
let activeGain: GainNode | null = null;

function getCtx(): Ctx {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const AC = W.AudioContext ?? W.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
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

export function playAlarm(autoOffSeconds: number) {
  const c = getCtx();
  if (!c) return;
  stopAlarm();
  if (c.state === "suspended") {
    c.resume().catch(() => {});
  }

  const master = c.createGain();
  master.gain.value = 0.001;
  master.gain.exponentialRampToValueAtTime(0.25, c.currentTime + 0.02);
  master.connect(c.destination);
  activeGain = master;

  // Repeating 3-note chime.
  const notes = [880, 660, 990]; // A5, E5, B5
  const noteDur = 0.35;
  const gap = 0.05;
  const cycle = notes.length * (noteDur + gap);
  const t0 = c.currentTime;
  const total = autoOffSeconds;

  let t = t0;
  while (t < t0 + total) {
    notes.forEach((freq) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.8, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + noteDur);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + noteDur + 0.02);
      activeOscs.push(osc);
      t += noteDur + gap;
    });
    t += 0.15;
    if (t - t0 > cycle * 20) break; // safety
  }

  stopTimer = window.setTimeout(() => stopAlarm(), autoOffSeconds * 1000);
}
