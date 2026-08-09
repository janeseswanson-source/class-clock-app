import type { BehaviorScore, SchedulePeriod, TimerSettings } from "@/lib/types";
import { ClassCard } from "./ClassCard";

interface ScheduleListProps {
  /** Already in chronological order. */
  periods: SchedulePeriod[];
  currentPeriodId: string | null;
  pastPeriodIds: Set<string>;
  settings: TimerSettings;
  scoresByPeriodId: Map<string, BehaviorScore>;
  onScoreChange?: (periodId: string, score: BehaviorScore) => void;
  showBehaviorRow?: boolean;
}

export function ScheduleList({
  periods,
  currentPeriodId,
  pastPeriodIds,
  settings,
  scoresByPeriodId,
  onScoreChange,
  showBehaviorRow,
}: ScheduleListProps) {
  return (
    <div className="flex flex-col gap-3">
      {periods.map((p) => {
        // Recess and duty get the same current/past treatment as classes —
        // previously they were pinned to one style and never showed the arrow.
        const variant =
          p.id === currentPeriodId
            ? "current"
            : pastPeriodIds.has(p.id)
              ? "past"
              : "upcoming";
        return (
          <ClassCard
            key={p.id}
            period={p}
            variant={variant}
            settings={settings}
            behaviorScore={scoresByPeriodId.get(p.id) ?? null}
            onScoreChange={onScoreChange ? (score) => onScoreChange(p.id, score) : undefined}
            showBehaviorRow={showBehaviorRow}
          />
        );
      })}
    </div>
  );
}
