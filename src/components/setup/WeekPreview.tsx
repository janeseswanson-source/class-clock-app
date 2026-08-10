import type { SchedulePeriod } from "@/lib/types";

const DAYS: Array<{ id: 1 | 2 | 3 | 4 | 5; label: string }> = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
];

export function WeekPreview({ periods }: { periods: SchedulePeriod[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-5">
      {DAYS.map((d) => {
        const rows = periods
          .filter((p) => p.dayOfWeek === d.id)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        return (
          <div
            key={d.id}
            className="rounded-2xl border-2 border-navy/10 bg-white p-3"
          >
            <div className="text-xs font-bold tracking-[0.2em] text-navy/60">
              {d.label.toUpperCase()}
            </div>
            <div className="mt-2 space-y-2">
              {rows.length === 0 ? (
                <div className="text-xs text-navy/40 italic">No periods</div>
              ) : (
                rows.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg bg-navy/5 px-2 py-1.5 text-xs"
                  >
                    <div className="font-bold text-navy">
                      {p.startTime}–{p.endTime}
                    </div>
                    <div className="text-navy/70">
                      {p.periodType === "class"
                        ? `${p.grade ?? ""}${p.className ? ` (${p.className})` : ""}${p.classroomTeacher ? ` · ${p.classroomTeacher}` : ""}`
                        : (p.dutyLabel ?? p.periodType)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
