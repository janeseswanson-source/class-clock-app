// Schedule maths shared by the editor, the wall display, and the alarms.
// Everything here works in "minutes from midnight" and converts back to "HH:mm"
// at the edges, so no component has to reason about time strings itself.

import { periodEndMin, periodStartMin } from "./time";
import type { DayOfWeek, SchedulePeriod, TimerSettings } from "./types";

export const SNAP_MINUTES = 5;
export const DAY_MINUTES = 24 * 60;

export const DAYS: Array<{ id: DayOfWeek; label: string; short: string }> = [
  { id: 1, label: "Monday", short: "Mon" },
  { id: 2, label: "Tuesday", short: "Tue" },
  { id: 3, label: "Wednesday", short: "Wed" },
  { id: 4, label: "Thursday", short: "Thu" },
  { id: 5, label: "Friday", short: "Fri" },
];

export const GRADES = [
  "Kinder",
  "1st grade",
  "2nd grade",
  "3rd grade",
  "4th grade",
  "5th grade",
  "6th grade",
];

/* ── conversions ─────────────────────────────────────────────────────────── */

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  const hours = parseInt(h, 10);
  const mins = parseInt(m, 10);
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return 0;
  return clampMinutes(hours * 60 + mins);
}

export function toHHMM(minutes: number): string {
  const m = clampMinutes(Math.round(minutes));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function clampMinutes(m: number): number {
  return Math.min(DAY_MINUTES - 1, Math.max(0, m));
}

export function addMinutes(hhmm: string, delta: number): string {
  return toHHMM(toMinutes(hhmm) + delta);
}

export function snap(minutes: number, step = SNAP_MINUTES): number {
  return Math.round(minutes / step) * step;
}

/** "09:35" → "9:35 AM". The display format used everywhere teachers read a time. */
export function formatTime(hhmm: string): string {
  const [hStr, m] = hhmm.split(":");
  let h = parseInt(hStr, 10);
  if (!Number.isFinite(h)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${suffix}`;
}

export function formatRange(p: SchedulePeriod): string {
  return `${formatTime(p.startTime)} – ${formatTime(p.endTime)}`;
}

/**
 * Reads whatever a teacher types into a time box: "945", "9:45", "9:45 pm",
 * "0945", "9". Returns "HH:mm", or null if it can't be understood.
 *
 * The native <input type="time"> this replaces threw away a lone hour until the
 * minutes were also filled in, which is what "I had to enter minutes first" was
 * about.
 *
 * Without an am/pm the hour resolves against a school day: 7–12 is morning,
 * 1–6 is afternoon. The field always re-renders as "1:45 PM" afterwards, so a
 * wrong guess is visible immediately.
 */
export function parseTimeInput(raw: string): string | null {
  const text = raw.trim().toLowerCase();
  if (!text) return null;

  const meridiem = /(a|p)\.?m?\.?$/.exec(text)?.[1] as "a" | "p" | undefined;
  const digits = text.replace(/[^0-9]/g, "");
  if (digits.length === 0 || digits.length > 4) return null;

  let hours: number;
  let minutes: number;

  if (text.includes(":")) {
    const [h, m = "0"] = text.split(":");
    hours = parseInt(h.replace(/[^0-9]/g, ""), 10);
    minutes = parseInt(m.replace(/[^0-9]/g, "") || "0", 10);
  } else if (digits.length <= 2) {
    hours = parseInt(digits, 10);
    minutes = 0;
  } else {
    hours = parseInt(digits.slice(0, digits.length - 2), 10);
    minutes = parseInt(digits.slice(-2), 10);
  }

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (minutes > 59) return null;
  if (hours > 23) return null;

  if (meridiem === "p" && hours < 12) hours += 12;
  else if (meridiem === "a" && hours === 12) hours = 0;
  else if (!meridiem && hours >= 1 && hours <= 6) hours += 12; // school-day afternoon

  return toHHMM(hours * 60 + minutes);
}

export function durationMinutes(p: SchedulePeriod): number {
  return periodEndMin(p) - periodStartMin(p);
}

/* ── ordering ────────────────────────────────────────────────────────────── */

/**
 * Chronological order. The display used to render periods in insertion order,
 * so a class added after setup showed up at the bottom of the day regardless of
 * its time — everything that renders a day runs through this.
 */
export function sortByStart(periods: SchedulePeriod[]): SchedulePeriod[] {
  return [...periods].sort(
    (a, b) => periodStartMin(a) - periodStartMin(b) || periodEndMin(a) - periodEndMin(b),
  );
}

export function periodsForDay(periods: SchedulePeriod[], day: DayOfWeek): SchedulePeriod[] {
  return sortByStart(periods.filter((p) => p.dayOfWeek === day));
}

export function isChronological(periods: SchedulePeriod[]): boolean {
  for (let i = 1; i < periods.length; i += 1) {
    if (periodStartMin(periods[i]) < periodStartMin(periods[i - 1])) return false;
  }
  return true;
}

/* ── creating periods ────────────────────────────────────────────────────── */

export function newPeriodId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Where a newly added period should go: straight after the last one on that day
 * (plus passing time), or at the teacher's day-start on an empty day.
 *
 * Previously every new period was hardcoded to 09:00–09:40, so adding a class to
 * a day that was already full dropped it into the middle of the list and
 * collided with whatever was already there.
 */
export function nextFreeSlot(
  dayPeriods: SchedulePeriod[],
  settings: Pick<
    TimerSettings,
    "dayStartTime" | "defaultPeriodMinutes" | "defaultPassingMinutes"
  >,
): { startTime: string; endTime: string } {
  const latestEnd = dayPeriods.reduce(
    (max, p) => Math.max(max, periodEndMin(p)),
    Number.NEGATIVE_INFINITY,
  );
  const start =
    latestEnd === Number.NEGATIVE_INFINITY
      ? toMinutes(settings.dayStartTime)
      : latestEnd + settings.defaultPassingMinutes;
  return {
    startTime: toHHMM(start),
    endTime: toHHMM(start + settings.defaultPeriodMinutes),
  };
}

export function createPeriod(
  day: DayOfWeek,
  dayPeriods: SchedulePeriod[],
  settings: Pick<
    TimerSettings,
    "dayStartTime" | "defaultPeriodMinutes" | "defaultPassingMinutes"
  >,
  periodType: SchedulePeriod["periodType"] = "class",
): SchedulePeriod {
  const { startTime, endTime } = nextFreeSlot(dayPeriods, settings);
  const base: SchedulePeriod = {
    id: newPeriodId(),
    dayOfWeek: day,
    startTime,
    endTime,
    periodType,
    cleanupMinutes: null,
  };
  if (periodType === "class") {
    return { ...base, grade: GRADES[0], classroomTeacher: "", roomNumber: "" };
  }
  return { ...base, dutyLabel: periodType === "recess" ? "Recess" : "" };
}

export interface RotationSpec {
  dayStartTime: string;
  periodMinutes: number;
  passingMinutes: number;
  count: number;
  days: DayOfWeek[];
}

/** Lays out `count` back-to-back periods per day — the specialist rotation pattern. */
export function generateRotation(spec: RotationSpec): SchedulePeriod[] {
  const out: SchedulePeriod[] = [];
  for (const day of spec.days) {
    let cursor = toMinutes(spec.dayStartTime);
    for (let i = 0; i < spec.count; i += 1) {
      out.push({
        id: newPeriodId(),
        dayOfWeek: day,
        startTime: toHHMM(cursor),
        endTime: toHHMM(cursor + spec.periodMinutes),
        periodType: "class",
        grade: GRADES[Math.min(i, GRADES.length - 1)],
        classroomTeacher: "",
        roomNumber: "",
        cleanupMinutes: null,
      });
      cursor += spec.periodMinutes + spec.passingMinutes;
    }
  }
  return out;
}

/** Copies one day's periods onto other days, replacing whatever was there. */
export function copyDayTo(
  periods: SchedulePeriod[],
  from: DayOfWeek,
  targets: DayOfWeek[],
): SchedulePeriod[] {
  const source = periodsForDay(periods, from);
  const kept = periods.filter((p) => !targets.includes(p.dayOfWeek));
  const clones = targets.flatMap((day) =>
    source.map((p) => ({ ...p, id: newPeriodId(), dayOfWeek: day })),
  );
  return [...kept, ...clones];
}

/* ── editing ─────────────────────────────────────────────────────────────── */

/**
 * Moves `fromId` and everything starting at or after it on the same day by
 * `deltaMin` — "my 9:00 slipped to 9:15, push the rest of the day along".
 */
export function shiftPeriodsFrom(
  periods: SchedulePeriod[],
  fromId: string,
  deltaMin: number,
): SchedulePeriod[] {
  const anchor = periods.find((p) => p.id === fromId);
  if (!anchor || deltaMin === 0) return periods;
  const anchorStart = periodStartMin(anchor);
  return periods.map((p) => {
    if (p.dayOfWeek !== anchor.dayOfWeek) return p;
    if (p.id !== fromId && periodStartMin(p) < anchorStart) return p;
    return {
      ...p,
      startTime: addMinutes(p.startTime, deltaMin),
      endTime: addMinutes(p.endTime, deltaMin),
    };
  });
}

/** Moves a single period, preserving its length. */
export function movePeriod(period: SchedulePeriod, newStartMin: number): SchedulePeriod {
  const length = durationMinutes(period);
  const start = clampMinutes(Math.min(newStartMin, DAY_MINUTES - 1 - length));
  return { ...period, startTime: toHHMM(start), endTime: toHHMM(start + length) };
}

/** Resizes from one edge, never letting a period collapse below one snap step. */
export function resizePeriod(
  period: SchedulePeriod,
  edge: "start" | "end",
  newMin: number,
): SchedulePeriod {
  const start = periodStartMin(period);
  const end = periodEndMin(period);
  if (edge === "start") {
    return { ...period, startTime: toHHMM(Math.min(clampMinutes(newMin), end - SNAP_MINUTES)) };
  }
  return { ...period, endTime: toHHMM(Math.max(clampMinutes(newMin), start + SNAP_MINUTES)) };
}

/* ── validation ──────────────────────────────────────────────────────────── */

export type ConflictKind = "invalid" | "overlap";

export interface Conflict {
  kind: ConflictKind;
  periodIds: string[];
  message: string;
}

function describe(p: SchedulePeriod): string {
  if (p.periodType === "class") return p.grade || "Class";
  return p.dutyLabel || (p.periodType === "recess" ? "Recess" : "Duty");
}

/** Zero/negative-length periods and overlapping pairs within a single day. */
export function detectConflicts(dayPeriods: SchedulePeriod[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const sorted = sortByStart(dayPeriods);

  for (const p of sorted) {
    if (periodEndMin(p) <= periodStartMin(p)) {
      conflicts.push({
        kind: "invalid",
        periodIds: [p.id],
        message: `${describe(p)} ends at or before it starts (${formatRange(p)}).`,
      });
    }
  }

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (periodStartMin(cur) < periodEndMin(prev)) {
      conflicts.push({
        kind: "overlap",
        periodIds: [prev.id, cur.id],
        message: `${describe(prev)} (${formatRange(prev)}) overlaps ${describe(cur)} (${formatRange(cur)}).`,
      });
    }
  }

  return conflicts;
}

export function conflictsByDay(periods: SchedulePeriod[]): Map<DayOfWeek, Conflict[]> {
  const map = new Map<DayOfWeek, Conflict[]>();
  for (const { id } of DAYS) {
    const found = detectConflicts(periods.filter((p) => p.dayOfWeek === id));
    if (found.length > 0) map.set(id, found);
  }
  return map;
}

export function conflictingPeriodIds(periods: SchedulePeriod[]): Set<string> {
  const ids = new Set<string>();
  for (const list of conflictsByDay(periods).values()) {
    for (const c of list) c.periodIds.forEach((id) => ids.add(id));
  }
  return ids;
}

/* ── clean-up alarm ──────────────────────────────────────────────────────── */

/** Only classes get a clean-up alarm — recess and duty periods have nothing to tidy. */
export function hasCleanup(period: SchedulePeriod): boolean {
  return period.periodType === "class";
}

/** The period's own lead time if it set one, otherwise the app-wide default. */
export function cleanupMinutesFor(
  period: SchedulePeriod,
  settings: Pick<TimerSettings, "cleanupLeadMinutes">,
): number {
  if (!hasCleanup(period)) return 0;
  const own = period.cleanupMinutes;
  const lead = own == null ? settings.cleanupLeadMinutes : own;
  // A lead longer than the class itself would fire before the class begins.
  return Math.max(0, Math.min(lead, durationMinutes(period)));
}

/** Wall-clock time the clean-up alarm rings, e.g. "9:35 AM". Null when it doesn't. */
export function cleanupTimeLabel(
  period: SchedulePeriod,
  settings: Pick<TimerSettings, "cleanupLeadMinutes">,
): string | null {
  const lead = cleanupMinutesFor(period, settings);
  if (lead <= 0) return null;
  return formatTime(addMinutes(period.endTime, -lead));
}
