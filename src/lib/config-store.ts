import type {
  LegacyTimerSettings,
  SchedulePeriod,
  TimerInstance,
  TimerSettings,
} from "./types";

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
  endAlarmEnabled: true,
  alarmAutoOffSeconds: 6,
  cleanupLeadMinutes: 5,
  cleanupAlarmEnabled: true,
  cleanupAlarmStyle: "soft_tone",
  behaviorScoringEnabled: true,
  dayStartTime: "08:05",
  defaultPeriodMinutes: 40,
  defaultPassingMinutes: 5,
};

const ALARM_STYLES = ["chime", "buzzer", "bell", "soft_tone"] as const;

function num(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function style(v: unknown, fallback: TimerSettings["alarmStyle"]) {
  return (ALARM_STYLES as readonly string[]).includes(v as string)
    ? (v as TimerSettings["alarmStyle"])
    : fallback;
}

function hhmm(v: unknown, fallback: string): string {
  return typeof v === "string" && /^\d{2}:\d{2}$/.test(v) ? v : fallback;
}

/**
 * Fills in any settings a stored profile predates. Profiles saved before the
 * clean-up alarm carry transitionSameGradeMin/transitionGradeChangeMin instead
 * of cleanupLeadMinutes — the same-grade value is the closest equivalent, so it
 * carries over rather than silently resetting a teacher's timing to 5.
 */
export function normalizeSettings(raw: unknown): TimerSettings {
  const s = (raw ?? {}) as Partial<TimerSettings> & LegacyTimerSettings;
  const legacyLead = s.transitionSameGradeMin;
  return {
    alarmStyle: style(s.alarmStyle, DEFAULT_SETTINGS.alarmStyle),
    endAlarmEnabled: s.endAlarmEnabled ?? DEFAULT_SETTINGS.endAlarmEnabled,
    alarmAutoOffSeconds: num(s.alarmAutoOffSeconds, DEFAULT_SETTINGS.alarmAutoOffSeconds, 2, 15),
    cleanupLeadMinutes: num(
      s.cleanupLeadMinutes ?? legacyLead,
      DEFAULT_SETTINGS.cleanupLeadMinutes,
      0,
      60,
    ),
    cleanupAlarmEnabled: s.cleanupAlarmEnabled ?? DEFAULT_SETTINGS.cleanupAlarmEnabled,
    cleanupAlarmStyle: style(s.cleanupAlarmStyle, DEFAULT_SETTINGS.cleanupAlarmStyle),
    behaviorScoringEnabled:
      s.behaviorScoringEnabled ?? DEFAULT_SETTINGS.behaviorScoringEnabled,
    dayStartTime: hhmm(s.dayStartTime, DEFAULT_SETTINGS.dayStartTime),
    defaultPeriodMinutes: num(s.defaultPeriodMinutes, DEFAULT_SETTINGS.defaultPeriodMinutes, 5, 240),
    defaultPassingMinutes: num(
      s.defaultPassingMinutes,
      DEFAULT_SETTINGS.defaultPassingMinutes,
      0,
      60,
    ),
  };
}

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
