import type { BehaviorScore, SchedulePeriod } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BehaviorScoreRow } from "./BehaviorScoreRow";

type Variant = "past" | "current" | "upcoming" | "recess" | "duty";

interface ClassCardProps {
  period: SchedulePeriod;
  variant: Variant;
  behaviorScore?: BehaviorScore | null;
  onScoreChange?: (score: BehaviorScore) => void;
  showBehaviorRow?: boolean;
}

function formatTime(t: string) {
  const [hStr, m] = t.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${suffix}`;
}

function timeRange(p: SchedulePeriod) {
  return `${formatTime(p.startTime)} – ${formatTime(p.endTime)}`;
}

export function ClassCard({ period, variant }: ClassCardProps) {
  if (variant === "recess") {
    return (
      <div className="rounded-xl border-2 border-gold bg-gold-soft/60 px-5 py-3">
        <div className="text-sm font-semibold text-gold">{timeRange(period)}</div>
        <div className="text-xl font-bold text-navy">{period.dutyLabel ?? "Recess"}</div>
      </div>
    );
  }

  if (variant === "past") {
    return (
      <div className="px-5 py-2 opacity-60">
        <div className="text-xs text-past">{timeRange(period)}</div>
        <div className="text-sm font-semibold text-past">{period.grade}</div>
        <div className="text-sm text-past">{period.classroomTeacher}</div>
        <div className="text-xs text-past">{period.roomNumber}</div>
      </div>
    );
  }

  const isCurrent = variant === "current";

  return (
    <div className="relative">
      {isCurrent && (
        <div
          aria-hidden
          className="absolute -left-1 top-1/2 -translate-y-1/2 z-10"
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
          "rounded-xl bg-white px-5 py-4 transition-all",
          isCurrent ? "border-2 border-navy shadow-sm" : "border border-border",
        )}
      >
        <div className="text-sm font-bold text-navy">{timeRange(period)}</div>
        <div className="text-xl font-bold text-navy mt-0.5">{period.grade}</div>
        <div
          className={cn(
            "font-bold mt-0.5",
            isCurrent ? "text-2xl text-[oklch(0.55_0.2_260)]" : "text-xl text-navy",
          )}
        >
          {period.classroomTeacher}
        </div>
        <div className="text-sm text-navy/60 mt-0.5">{period.roomNumber}</div>

        {showBehaviorRow && isCurrent && period.periodType === "class" ? (
          <div className="mt-3">
            <BehaviorScoreRow
              value={behaviorScore ?? null}
              onChange={onScoreChange}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
