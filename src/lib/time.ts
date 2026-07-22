import type { SchedulePeriod } from "./types";

export function parseHHMM(t: string): { h: number; m: number } {
  const [h, m] = t.split(":").map((n) => parseInt(n, 10));
  return { h, m };
}

export function minutesFromMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

export function periodStartMin(p: SchedulePeriod): number {
  const { h, m } = parseHHMM(p.startTime);
  return h * 60 + m;
}
export function periodEndMin(p: SchedulePeriod): number {
  const { h, m } = parseHHMM(p.endTime);
  return h * 60 + m;
}

export function findCurrentPeriod(
  periods: SchedulePeriod[],
  now: Date,
): SchedulePeriod | null {
  const mm = minutesFromMidnight(now);
  return (
    periods.find((p) => mm >= periodStartMin(p) && mm < periodEndMin(p)) ?? null
  );
}

export function findNextPeriod(
  periods: SchedulePeriod[],
  now: Date,
): SchedulePeriod | null {
  const mm = minutesFromMidnight(now);
  const upcoming = periods
    .filter((p) => periodStartMin(p) > mm)
    .sort((a, b) => periodStartMin(a) - periodStartMin(b));
  return upcoming[0] ?? null;
}

export function pastPeriodIds(periods: SchedulePeriod[], now: Date): Set<string> {
  const mm = minutesFromMidnight(now);
  return new Set(periods.filter((p) => periodEndMin(p) <= mm).map((p) => p.id));
}

// Remaining ms until end of period (never negative).
export function remainingMs(period: SchedulePeriod, now: Date): number {
  const end = new Date(now);
  const { h, m } = parseHHMM(period.endTime);
  end.setHours(h, m, 0, 0);
  return Math.max(0, end.getTime() - now.getTime());
}

export function msToHMS(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    h: Math.floor(total / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}
