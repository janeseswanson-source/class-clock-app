import { AlarmClock, Coffee, ClipboardList } from "lucide-react";
import type { BehaviorScore, SchedulePeriod, TimerSettings } from "@/lib/types";
import { cleanupTimeLabel, formatRange } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import { BehaviorScoreRow } from "./BehaviorScoreRow";

export type CardVariant = "past" | "current" | "upcoming";

interface ClassCardProps {
  period: SchedulePeriod;
  variant: CardVariant;
  settings: TimerSettings;
  behaviorScore?: BehaviorScore | null;
  onScoreChange?: (score: BehaviorScore) => void;
  showBehaviorRow?: boolean;
}

export function ClassCard({
  period,
  variant,
  settings,
  behaviorScore = null,
  onScoreChange,
  showBehaviorRow = false,
}: ClassCardProps) {
  const isCurrent = variant === "current";
  const isPast = variant === "past";
  const isClass = period.periodType === "class";
  const cleanupAt = isClass ? cleanupTimeLabel(period, settings) : null;

  // Every class can be scored, not just the live one — a teacher who was busy at
  // the bell can still record the period afterwards.
  const scorable = showBehaviorRow && isClass && (isCurrent || isPast);

  const title = isClass
    ? (period.grade ?? "Class")
    : (period.dutyLabel ?? (period.periodType === "recess" ? "Recess" : "Duty"));

  return (
    <div className="relative">
      {isCurrent && (
        <div
          aria-hidden
          className="absolute -left-1 top-1/2 z-10 -translate-y-1/2"
          style={{
            width: 0,
            height: 0,
            borderTop: "18px solid transparent",
            borderBottom: "18px solid transparent",
            borderLeft: "22px solid oklch(0.55 0.2 260)",
          }}
        />
      )}

      <div
        className={cn(
          "rounded-xl px-5 transition-all",
          isPast ? "py-2.5" : "py-4",
          period.periodType === "recess"
            ? isPast
              ? "border border-gold/40 bg-gold-soft/30"
              : "border-2 border-gold bg-gold-soft/60"
            : period.periodType === "duty"
              ? isPast
                ? "border border-border bg-muted/40"
                : "border-2 border-navy/25 bg-navy/[0.04]"
              : cn(
                  "bg-white",
                  isCurrent ? "border-2 border-navy shadow-sm" : "border border-border",
                ),
          // Past periods recede through muted text, not opacity — dimming the
          // whole card would take the score buttons with it.
        )}
      >
        <div className="flex items-baseline justify-between gap-3">
          <div
            className={cn(
              "font-bold tabular-nums",
              isPast ? "text-xs text-past" : "text-sm text-navy",
            )}
          >
            {formatRange(period)}
          </div>
          {isCurrent && cleanupAt ? (
            <div className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold text-navy/60">
              <AlarmClock className="h-3 w-3" />
              Clean up <span className="tabular-nums">{cleanupAt}</span>
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "mt-0.5 flex items-center gap-2 font-bold",
            isPast
              ? "text-sm text-past"
              : period.periodType === "class"
                ? "text-[clamp(1.05rem,1.6vw,1.5rem)] text-navy"
                : "text-[clamp(1.05rem,1.6vw,1.5rem)] text-navy",
          )}
        >
          {!isPast && period.periodType === "recess" ? (
            <Coffee className="h-4 w-4 text-gold" />
          ) : null}
          {!isPast && period.periodType === "duty" ? (
            <ClipboardList className="h-4 w-4 text-navy/50" />
          ) : null}
          {title}
        </div>

        {isClass ? (
          <>
            {period.classroomTeacher ? (
              <div
                className={cn(
                  "mt-0.5 font-bold",
                  isPast
                    ? "text-sm text-past"
                    : isCurrent
                      ? "text-[clamp(1.15rem,1.9vw,1.75rem)] text-[oklch(0.55_0.2_260)]"
                      : "text-[clamp(1rem,1.5vw,1.35rem)] text-navy",
                )}
              >
                {period.classroomTeacher}
              </div>
            ) : null}
            {period.roomNumber ? (
              <div
                className={cn("mt-0.5", isPast ? "text-xs text-past" : "text-sm text-navy/60")}
              >
                {period.roomNumber}
              </div>
            ) : null}
          </>
        ) : null}

        {scorable ? (
          <div className="mt-3">
            <BehaviorScoreRow
              value={behaviorScore}
              onChange={onScoreChange}
              compact={isPast}
              hint={isPast ? "Not scored — tap to add" : "Tap to score this class"}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
