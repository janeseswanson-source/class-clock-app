import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Volume2 } from "lucide-react";
import { AnalogClock } from "@/components/display/AnalogClock";
import { CountdownStand } from "@/components/display/CountdownStand";
import { DisplayHeader } from "@/components/display/DisplayHeader";
import { ScheduleList } from "@/components/display/ScheduleList";
import { ReportFooter } from "@/components/display/ReportFooter";
import { TimeScrubber } from "@/components/dev/TimeScrubber";
import { useNow } from "@/hooks/useNow";
import { useConfig } from "@/hooks/useConfig";
import { useSessions } from "@/hooks/useSessions";
import { usePeriodAlarms } from "@/hooks/usePeriodAlarms";
import { useWakeLock } from "@/hooks/useWakeLock";
import {
  findCurrentPeriod,
  findNextPeriod,
  msToHMS,
  pastPeriodIds,
  remainingMs,
} from "@/lib/time";
import { DAYS, formatTime, sortByStart } from "@/lib/schedule";
import { isAudioReady, onAudioReadyChange, unlockAudio } from "@/lib/alarm";
import { DEFAULT_SETTINGS } from "@/lib/config-store";
import { todayISO } from "@/lib/session-store";
import type { BehaviorScore, DayOfWeek, SchedulePeriod } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Next Specials Timer" },
      {
        name: "description",
        content:
          "Classroom wall display for specialist teachers: analog clock, live countdown, and daily schedule with behavior scoring.",
      },
      { property: "og:title", content: "Next Specials Timer" },
      {
        property: "og:description",
        content:
          "Classroom wall display for specialist teachers: analog clock, live countdown, and daily schedule with behavior scoring.",
      },
    ],
  }),
  component: Index,
});

function formatDateLabel(d: Date) {
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function isWeekday(dow: number): dow is DayOfWeek {
  return dow >= 1 && dow <= 5;
}

function Index() {
  const { config, isLoaded } = useConfig();
  const { sessions, upsert } = useSessions();
  const now = useNow(250);
  const dateISO = todayISO(now);

  const [wallMode, setWallMode] = useState(false);
  const [audioReady, setAudioReady] = useState(true);

  useWakeLock(true);

  // Alarms need one user gesture before the browser will let them make noise.
  useEffect(() => {
    setAudioReady(isAudioReady());
    return onAudioReadyChange(setAudioReady);
  }, []);

  // Keep the button in sync when fullscreen is left with Escape.
  useEffect(() => {
    const onChange = () => setWallMode(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleWallMode = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
      setWallMode(false);
    } else {
      void document.documentElement.requestFullscreen().catch(() => {});
      // Fullscreen can be refused; the layout still switches so the mode is usable.
      setWallMode(true);
    }
  }, []);

  const todayDow = now.getDay();
  const todaysPeriods = useMemo(() => {
    if (!config || !isWeekday(todayDow)) return [];
    return sortByStart(config.schedule.filter((p) => p.dayOfWeek === todayDow));
  }, [config, todayDow]);

  const currentPeriod = useMemo(
    () => findCurrentPeriod(todaysPeriods, now),
    [todaysPeriods, now],
  );
  const nextPeriod = useMemo(
    () => findNextPeriod(todaysPeriods, now),
    [todaysPeriods, now],
  );
  const past = useMemo(() => pastPeriodIds(todaysPeriods, now), [todaysPeriods, now]);

  const settings = config?.settings ?? null;
  const remaining = currentPeriod ? remainingMs(currentPeriod, now) : 0;

  const { inCleanup, justEnded } = usePeriodAlarms({
    currentPeriod,
    remainingMs: remaining,
    dateISO,
    // Placeholder only for the render before config resolves — the hook is
    // disabled in that state, so these values never drive a real alarm.
    settings: settings ?? DEFAULT_SETTINGS,
    enabled: Boolean(config),
  });

  const scoresByPeriodId = useMemo(() => {
    const map = new Map<string, BehaviorScore>();
    for (const s of sessions[dateISO] ?? []) {
      if (s.behaviorScore != null) map.set(s.schedulePeriodId, s.behaviorScore);
    }
    return map;
  }, [sessions, dateISO]);

  const handleScore = (periodId: string, score: BehaviorScore) =>
    upsert(dateISO, periodId, score);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-navy/50">Loading…</div>
      </div>
    );
  }
  if (!config || !settings) return <Navigate to="/setup" />;

  let intent: "normal" | "cleanup" | "ended" = "normal";
  let statusLabel = "Between periods";

  if (justEnded) {
    intent = "ended";
    statusLabel = "Period ended";
  } else if (currentPeriod) {
    if (currentPeriod.periodType === "recess") {
      statusLabel = "Recess";
    } else if (currentPeriod.periodType === "duty") {
      statusLabel = `Duty · ${currentPeriod.dutyLabel ?? ""}`;
    } else {
      intent = inCleanup ? "cleanup" : "normal";
      statusLabel = inCleanup ? "Clean-up time" : "Class in session";
    }
  } else if (nextPeriod) {
    statusLabel = `Next: ${formatTime(nextPeriod.startTime)}`;
  }

  const displayHMS = justEnded ? { h: 0, m: 0, s: 0 } : msToHMS(remaining);

  const statusPillClass =
    intent === "cleanup"
      ? "bg-[oklch(0.92_0.05_25)] text-[oklch(0.4_0.18_25)]"
      : intent === "ended"
        ? "bg-navy text-white"
        : "bg-gold-soft text-navy";

  return (
    <div className={cn("min-h-screen bg-background font-sans", wallMode ? "p-0" : "p-4 md:p-8")}>
      <div className={cn("mx-auto", wallMode ? "max-w-none" : "max-w-7xl")}>
        <div className={cn("bg-gold", wallMode ? "p-0" : "rounded-3xl p-1.5")}>
          <div className={cn("bg-background", wallMode ? "p-0" : "rounded-3xl p-1")}>
            <div
              className={cn(
                "border-navy bg-white",
                wallMode
                  ? "min-h-screen border-0 p-5"
                  : "rounded-3xl border-2 p-6 md:p-10",
              )}
            >
              <DisplayHeader
                subjectTitle={config.instance.subjectTitle.toUpperCase()}
                teacherName={config.instance.teacherName}
                dateLabel={formatDateLabel(now)}
                wallMode={wallMode}
                onToggleWallMode={toggleWallMode}
              />

              <div className="mt-4 border-t-2 border-gold" />

              {!audioReady ? (
                <button
                  type="button"
                  onClick={() => void unlockAudio()}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gold bg-gold-soft px-4 py-2.5 text-sm font-bold text-navy hover:bg-gold/40"
                >
                  <Volume2 className="h-4 w-4" />
                  Tap once to turn on class alarms — your browser blocks sound until you do.
                </button>
              ) : null}

              {/* Clock left, the day's schedule right: on a mounted TV the whole
                  day has to be visible without anyone scrolling. The split waits
                  for xl because the countdown stand is ~33rem wide on its own —
                  below that it would squeeze the schedule into a sliver. */}
              <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,33rem)_minmax(0,1fr)] xl:items-start">
                <div className="flex flex-col items-center xl:sticky xl:top-6">
                  <div className="w-[min(20rem,70vw)] xl:w-[26rem]">
                    <AnalogClock
                      hours={now.getHours()}
                      minutes={now.getMinutes()}
                      seconds={now.getSeconds()}
                    />
                  </div>

                  <div className="mt-4">
                    <CountdownStand
                      hours={displayHMS.h}
                      minutes={displayHMS.m}
                      seconds={displayHMS.s}
                      intent={intent}
                    />
                  </div>

                  <div className={cn("mt-5 rounded-full px-6 py-2 text-sm font-bold", statusPillClass)}>
                    {statusLabel}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-baseline justify-between">
                    <div className="text-xs font-bold tracking-[0.25em] text-navy/60">
                      TODAY'S CLASSES
                    </div>
                    {todaysPeriods.length > 0 ? (
                      <div className="text-xs font-bold text-navy/40">
                        {todaysPeriods.length} periods
                      </div>
                    ) : null}
                  </div>

                  {todaysPeriods.length === 0 ? (
                    <EmptyDay schedule={config.schedule} todayDow={todayDow} />
                  ) : (
                    <ScheduleList
                      periods={todaysPeriods}
                      currentPeriodId={currentPeriod?.id ?? null}
                      pastPeriodIds={past}
                      settings={settings}
                      scoresByPeriodId={scoresByPeriodId}
                      onScoreChange={handleScore}
                      showBehaviorRow={settings.behaviorScoringEnabled}
                    />
                  )}

                  {!wallMode ? (
                    <div className="mt-6">
                      <ReportFooter
                        schedule={config.schedule}
                        todaySessions={sessions[dateISO] ?? []}
                        instance={config.instance}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TimeScrubber periods={todaysPeriods} />
    </div>
  );
}

/** Weekends, holidays, and days with nothing on them. */
function EmptyDay({ schedule, todayDow }: { schedule: SchedulePeriod[]; todayDow: number }) {
  // Walk forward through the week to the next day that actually has periods.
  let upcoming: { day: DayOfWeek; period: SchedulePeriod } | null = null;
  for (let i = 1; i <= 7 && !upcoming; i += 1) {
    const dow = (todayDow + i) % 7;
    if (!isWeekday(dow)) continue;
    const first = sortByStart(schedule.filter((p) => p.dayOfWeek === dow))[0];
    if (first) upcoming = { day: dow, period: first };
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-navy/15 p-10 text-center">
      <div className="text-lg font-bold text-navy">No classes today</div>
      {upcoming ? (
        <div className="mt-1 text-sm text-navy/60">
          Next up: {DAYS.find((d) => d.id === upcoming!.day)?.label} at{" "}
          <span className="font-bold tabular-nums">
            {formatTime(upcoming.period.startTime)}
          </span>
          {upcoming.period.grade ? ` · ${upcoming.period.grade}` : ""}
        </div>
      ) : (
        <div className="mt-1 text-sm text-navy/60">
          Nothing scheduled yet.{" "}
          <Link to="/setup" className="font-bold text-navy underline">
            Build your week
          </Link>
        </div>
      )}
    </div>
  );
}
