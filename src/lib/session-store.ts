import type { BehaviorScore, ClassSession } from "./types";
import { RATING_LABELS } from "./types";

const KEY = "nst.sessions.v1";

// date (YYYY-MM-DD) → sessions[]
export type SessionsMap = Record<string, ClassSession[]>;

export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function loadSessions(): SessionsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SessionsMap;
  } catch {
    return {};
  }
}

function persist(map: SessionsMap) {
  window.localStorage.setItem(KEY, JSON.stringify(map));
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

export function getSession(
  date: string,
  schedulePeriodId: string,
): ClassSession | null {
  const map = loadSessions();
  return map[date]?.find((s) => s.schedulePeriodId === schedulePeriodId) ?? null;
}

export function upsertSession(
  date: string,
  schedulePeriodId: string,
  score: BehaviorScore,
): ClassSession {
  const map = loadSessions();
  const list = map[date] ?? [];
  const idx = list.findIndex((s) => s.schedulePeriodId === schedulePeriodId);
  const now = new Date().toISOString();
  const next: ClassSession = {
    date,
    schedulePeriodId,
    behaviorScore: score,
    ratingLabel: RATING_LABELS[score],
    scoreLoggedAt: now,
    edited: idx >= 0,
  };
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  map[date] = list;
  persist(map);
  return next;
}

export function clearSession(date: string, schedulePeriodId: string) {
  const map = loadSessions();
  const list = map[date] ?? [];
  map[date] = list.filter((s) => s.schedulePeriodId !== schedulePeriodId);
  if (map[date].length === 0) delete map[date];
  persist(map);
}

export function clearAllSessions() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

export const SESSIONS_STORAGE_KEY = KEY;
