import type { SchedulePeriod } from "@/lib/types";
import { ClassCard } from "./ClassCard";

interface ScheduleListProps {
  periods: SchedulePeriod[];
  currentPeriodId: string | null;
  pastPeriodIds: Set<string>;
}

export function ScheduleList({ periods, currentPeriodId, pastPeriodIds }: ScheduleListProps) {
  return (
    <div className="flex flex-col gap-3">
      {periods.map((p) => {
        if (p.periodType === "recess") {
          return <ClassCard key={p.id} period={p} variant="recess" />;
        }
        const variant =
          p.id === currentPeriodId
            ? "current"
            : pastPeriodIds.has(p.id)
              ? "past"
              : "upcoming";
        return <ClassCard key={p.id} period={p} variant={variant} />;
      })}
    </div>
  );
}
