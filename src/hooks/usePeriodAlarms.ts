import { useEffect, useRef } from "react";
import { playAlarm } from "@/lib/alarm";
import { cleanupMinutesFor } from "@/lib/schedule";
import type { SchedulePeriod, TimerSettings } from "@/lib/types";

interface UsePeriodAlarmsArgs {
  /** The period running right now, or null between periods. */
  currentPeriod: SchedulePeriod | null;
  /** Milliseconds left in `currentPeriod`. */
  remainingMs: number;
  /** "YYYY-MM-DD" — keys the fired-once bookkeeping so tomorrow rings again. */
  dateISO: string;
  settings: TimerSettings;
  enabled?: boolean;
}

export interface PeriodAlarmState {
  /** True once the clean-up window has been entered for the current period. */
  inCleanup: boolean;
  /** True for `alarmAutoOffSeconds` after a period ends. */
  justEnded: boolean;
}

/**
 * Fires the two class alarms, each at most once per period per day:
 *
 *  - clean-up, when the countdown first drops inside the period's lead time
 *  - end of class, when the period stops being current
 *
 * Bookkeeping is keyed by `date:periodId` so the dev time scrubber can jump
 * backwards and replay a boundary, and so a display left running overnight
 * rings again the next morning.
 */
export function usePeriodAlarms({
  currentPeriod,
  remainingMs,
  dateISO,
  settings,
  enabled = true,
}: UsePeriodAlarmsArgs): PeriodAlarmState {
  const firedCleanup = useRef<string | null>(null);
  const endedAt = useRef<{ key: string; at: number } | null>(null);
  const prev = useRef<{ key: string; period: SchedulePeriod } | null>(null);

  const currentKey = currentPeriod ? `${dateISO}:${currentPeriod.id}` : null;
  const cleanupLead = currentPeriod ? cleanupMinutesFor(currentPeriod, settings) : 0;
  const inCleanup =
    cleanupLead > 0 && remainingMs > 0 && remainingMs <= cleanupLead * 60_000;

  // Clean-up alarm.
  useEffect(() => {
    if (!enabled || !currentKey) return;
    if (!inCleanup) {
      // Left the window without the period changing — the dev scrubber went
      // backwards. Re-arm so the boundary can be replayed.
      if (firedCleanup.current === currentKey) firedCleanup.current = null;
      return;
    }
    if (firedCleanup.current === currentKey) return;
    firedCleanup.current = currentKey;
    if (settings.cleanupAlarmEnabled) {
      playAlarm(settings.alarmAutoOffSeconds, settings.cleanupAlarmStyle);
    }
  }, [
    enabled,
    currentKey,
    inCleanup,
    settings.cleanupAlarmEnabled,
    settings.cleanupAlarmStyle,
    settings.alarmAutoOffSeconds,
  ]);

  // End-of-class alarm: the previously-current period is no longer current.
  useEffect(() => {
    const before = prev.current;
    if (before && before.key !== currentKey) {
      // Reset the clean-up flag so re-entering this period (scrubbing back, or
      // tomorrow) can ring again.
      if (firedCleanup.current === before.key) firedCleanup.current = null;
      if (enabled) {
        endedAt.current = { key: before.key, at: Date.now() };
        if (settings.endAlarmEnabled) {
          playAlarm(settings.alarmAutoOffSeconds, settings.alarmStyle);
        }
      }
    }
    prev.current =
      currentKey && currentPeriod ? { key: currentKey, period: currentPeriod } : null;
  }, [
    currentKey,
    currentPeriod,
    enabled,
    settings.endAlarmEnabled,
    settings.alarmStyle,
    settings.alarmAutoOffSeconds,
  ]);

  const justEnded =
    endedAt.current !== null &&
    Date.now() - endedAt.current.at < settings.alarmAutoOffSeconds * 1000;

  return { inCleanup, justEnded };
}
