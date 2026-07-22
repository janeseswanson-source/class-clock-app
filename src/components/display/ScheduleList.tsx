import type { BehaviorScore, SchedulePeriod } from "@/lib/types";
import { ClassCard } from "./ClassCard";

interface ScheduleListProps {
  periods: SchedulePeriod[];
  currentPeriodId: string | null;
  pastPeriodIds: Set<string>;
  behaviorScore?: BehaviorScore | null;
  onScoreChange?: (score: BehaviorScore) => void;
  showBehaviorRow?: boolean;
}

export function ScheduleList({
  periods,
  currentPeriodId,
  pastPeriodIds,
  behaviorScore,
  onScoreChange,
  showBehaviorRow,
}: ScheduleListProps) {
  return (
    <div className="flex flex-col gap-3">
      {periods.map((p) => {
        if (p.periodType === "recess") {
          return <ClassCard key={p.id} period={p} variant="recess" />;
        }
        const isCurrent = p.id === currentPeriodId;
        const variant = isCurrent
          ? "current"
          : pastPeriodIds.has(p.id)
            ? "past"
            : "upcoming";
        return (
          <ClassCard
            key={p.id}
            period={p}
            variant={variant}
            behaviorScore={isCurrent ? behaviorScore : null}
            onScoreChange={isCurrent ? onScoreChange : undefined}
            showBehaviorRow={isCurrent ? showBehaviorRow : false}
          />
        );
      })}
    </div>
  );
}
