// Dev-only time offset. Not persisted; resets on reload.
let offsetMs = 0;
const listeners = new Set<() => void>();

export const devClock = {
  getOffset: () => offsetMs,
  setOffset: (ms: number) => {
    offsetMs = ms;
    listeners.forEach((l) => l());
  },
  adjust: (deltaMs: number) => {
    offsetMs += deltaMs;
    listeners.forEach((l) => l());
  },
  reset: () => {
    offsetMs = 0;
    listeners.forEach((l) => l());
  },
  now: () => new Date(Date.now() + offsetMs),
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

if (typeof window !== "undefined") {
  (window as unknown as { __nsc?: typeof devClock }).__nsc = devClock;
}
