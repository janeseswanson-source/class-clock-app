import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";
import { AnalogClock } from "@/components/display/AnalogClock";
import { CountdownStand } from "@/components/display/CountdownStand";
import { DisplayHeader } from "@/components/display/DisplayHeader";
import { ScheduleList } from "@/components/display/ScheduleList";
import { ReportFooter } from "@/components/display/ReportFooter";
import { TimeScrubber } from "@/components/dev/TimeScrubber";
import { mockInstance, mockPeriods } from "@/lib/mock-schedule";
import { useNow } from "@/hooks/useNow";
import {
  findCurrentPeriod,
  findNextPeriod,
  msToHMS,
  pastPeriodIds,
  remainingMs,
} from "@/lib/time";
import { playAlarm } from "@/lib/alarm";

// Mock settings (Phase 3 will source these from localStorage).
const TRANSITION_SAME_GRADE_MIN = 5;
const TRANSITION_GRADE_CHANGE_MIN = 10;
const ALARM_AUTO_OFF_SEC = 6;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Next Specials Timer — Art Class" },
      {
        name: "description",
        content:
          "Classroom wall display for specialist teachers: analog clock, live countdown, and daily schedule with behavior scoring.",
      },
      { property: "og:title", content: "Next Specials Timer — Art Class" },
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
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function Index() {
  const now = useNow(250);

  const currentPeriod = useMemo(() => findCurrentPeriod(mockPeriods, now), [now]);
  const nextPeriod = useMemo(() => findNextPeriod(mockPeriods, now), [now]);
  const past = useMemo(() => pastPeriodIds(mockPeriods, now), [now]);

  const remaining = currentPeriod ? remainingMs(currentPeriod, now) : 0;
  const remHMS = msToHMS(remaining);

  // Transition (clean-up) window in ms, based on current vs next grade.
  const transitionMs = useMemo(() => {
    if (!currentPeriod || currentPeriod.periodType !== "class") return 0;
    const nextGrade = nextPeriod?.grade ?? null;
    const sameGrade =
      nextGrade && currentPeriod.grade && nextGrade === currentPeriod.grade;
    const min = sameGrade ? TRANSITION_SAME_GRADE_MIN : TRANSITION_GRADE_CHANGE_MIN;
    return min * 60_000;
  }, [currentPeriod, nextPeriod]);

  // Ended-window state: track period-ended moments to keep "PERIOD ENDED"
  // label + alarm alive for the auto-off duration even after we've already
  // rolled to the next period.
  const endedAtRef = useRef<{ id: string; at: number } | null>(null);
  const prevCurrentIdRef = useRef<string | null>(currentPeriod?.id ?? null);

  useEffect(() => {
    const prevId = prevCurrentIdRef.current;
    const currId = currentPeriod?.id ?? null;
    if (prevId && prevId !== currId) {
      // A period just ended (or rolled over). Fire alarm once.
      endedAtRef.current = { id: prevId, at: now.getTime() };
      playAlarm(ALARM_AUTO_OFF_SEC);
    }
    prevCurrentIdRef.current = currId;
  }, [currentPeriod, now]);

  const inEndedWindow =
    endedAtRef.current &&
    now.getTime() - endedAtRef.current.at < ALARM_AUTO_OFF_SEC * 1000;

  let intent: "normal" | "cleanup" | "ended" = "normal";
  let statusLabel = "Between periods";

  if (inEndedWindow) {
    intent = "ended";
    statusLabel = "Period ended";
  } else if (currentPeriod) {
    if (currentPeriod.periodType === "recess") {
      statusLabel = "Recess";
    } else if (currentPeriod.periodType === "duty") {
      statusLabel = `Duty · ${currentPeriod.dutyLabel ?? ""}`;
    } else {
      const isCleanup = transitionMs > 0 && remaining <= transitionMs && remaining > 0;
      intent = isCleanup ? "cleanup" : "normal";
      statusLabel = isCleanup ? "Clean-up time" : "Class in session";
    }
  }

  const displayHMS = inEndedWindow ? { h: 0, m: 0, s: 0 } : remHMS;

  const statusPillClass =
    intent === "cleanup"
      ? "bg-[oklch(0.92_0.05_25)] text-[oklch(0.4_0.18_25)]"
      : intent === "ended"
        ? "bg-navy text-white"
        : "bg-gold-soft text-navy";

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl p-1.5 bg-gold">
          <div className="rounded-3xl p-1 bg-background">
            <div className="rounded-3xl border-2 border-navy bg-white p-6 md:p-10">
              <DisplayHeader
                subjectTitle={mockInstance.subjectTitle.toUpperCase()}
                dateLabel={formatDateLabel(now)}
              />

              <div className="mt-4 border-t-2 border-gold" />

              <div className="mt-8 flex flex-col items-center">
                <div className="w-64 md:w-80">
                  <AnalogClock
                    hours={now.getHours()}
                    minutes={now.getMinutes()}
                    seconds={now.getSeconds()}
                  />
                </div>

                <div className="mt-2">
                  <CountdownStand
                    hours={displayHMS.h}
                    minutes={displayHMS.m}
                    seconds={displayHMS.s}
                    intent={intent}
                  />
                </div>

                <div
                  className={`mt-5 rounded-full px-6 py-2 font-bold text-sm ${statusPillClass}`}
                >
                  {statusLabel}
                </div>
                <div className="mt-3 text-xs font-bold tracking-[0.25em] text-navy/60">
                  TODAY'S CLASSES
                </div>
              </div>

              <div className="mt-4">
                <ScheduleList
                  periods={mockPeriods}
                  currentPeriodId={currentPeriod?.id ?? null}
                  pastPeriodIds={past}
                />
              </div>

              <div className="mt-6">
                <ReportFooter />
              </div>
            </div>
          </div>
        </div>
      </div>
      <TimeScrubber />
    </div>
  );
}
