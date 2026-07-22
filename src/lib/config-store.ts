import type { SchedulePeriod, TimerInstance, TimerSettings } from "./types";

export const CONFIG_VERSION = 1;
const KEY = "nst.config.v1";

export interface StoredConfig {
  version: number;
  instance: TimerInstance;
  schedule: SchedulePeriod[];
  settings: TimerSettings;
}

export const DEFAULT_SETTINGS: TimerSettings = {
  alarmStyle: "chime",
  alarmAutoOffSeconds: 6,
  transitionSameGradeMin: 5,
  transitionGradeChangeMin: 10,
  behaviorScoringEnabled: true,
};

export function loadConfig(): StoredConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConfig;
    if (!parsed || parsed.version !== CONFIG_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveConfig(cfg: Omit<StoredConfig, "version">) {
  if (typeof window === "undefined") return;
  const payload: StoredConfig = { version: CONFIG_VERSION, ...cfg };
  window.localStorage.setItem(KEY, JSON.stringify(payload));
  // Notify same-tab listeners.
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

export function clearConfig() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

export const CONFIG_STORAGE_KEY = KEY;
