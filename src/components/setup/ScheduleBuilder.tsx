import { useMemo, useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import type { PeriodType, SchedulePeriod } from "@/lib/types";

type Day = 1 | 2 | 3 | 4 | 5;

const DAYS: Array<{ id: Day; label: string; short: string }> = [
  { id: 1, label: "Monday", short: "Mon" },
  { id: 2, label: "Tuesday", short: "Tue" },
  { id: 3, label: "Wednesday", short: "Wed" },
  { id: 4, label: "Thursday", short: "Thu" },
  { id: 5, label: "Friday", short: "Fri" },
];

const GRADES = ["Kinder", "1st grade", "2nd grade", "3rd grade", "4th grade", "5th grade"];

function newPeriod(day: Day): SchedulePeriod {
  return {
    id: `p-${Math.random().toString(36).slice(2, 9)}`,
    dayOfWeek: day,
    startTime: "09:00",
    endTime: "09:40",
    periodType: "class",
    grade: "Kinder",
    classroomTeacher: "",
    roomNumber: "",
  };
}

interface ScheduleBuilderProps {
  periods: SchedulePeriod[];
  onChange: (next: SchedulePeriod[]) => void;
}

export function ScheduleBuilder({ periods, onChange }: ScheduleBuilderProps) {
  const [activeDay, setActiveDay] = useState<Day>(1);

  const dayPeriods = useMemo(
    () =>
      periods
        .filter((p) => p.dayOfWeek === activeDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [periods, activeDay],
  );

  const update = (id: string, patch: Partial<SchedulePeriod>) => {
    onChange(periods.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };
  const remove = (id: string) => onChange(periods.filter((p) => p.id !== id));
  const add = () => onChange([...periods, newPeriod(activeDay)]);
  const copyFromMonday = () => {
    if (activeDay === 1) return;
    const mon = periods.filter((p) => p.dayOfWeek === 1);
    const others = periods.filter((p) => p.dayOfWeek !== activeDay);
    const cloned: SchedulePeriod[] = mon.map((p) => ({
      ...p,
      id: `p-${Math.random().toString(36).slice(2, 9)}`,
      dayOfWeek: activeDay,
    }));
    onChange([...others, ...cloned]);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {DAYS.map((d) => {
          const isActive = d.id === activeDay;
          const count = periods.filter((p) => p.dayOfWeek === d.id).length;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveDay(d.id)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                isActive
                  ? "bg-navy text-white"
                  : "bg-navy/5 text-navy hover:bg-navy/10"
              }`}
            >
              {d.short}
              <span className={`ml-2 text-xs ${isActive ? "text-white/70" : "text-navy/50"}`}>
                {count}
              </span>
            </button>
          );
        })}
        {activeDay !== 1 ? (
          <button
            type="button"
            onClick={copyFromMonday}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border-2 border-navy/15 px-3 py-1.5 text-xs font-bold text-navy hover:border-navy/40"
          >
            <Copy className="h-3.5 w-3.5" /> Copy from Monday
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {dayPeriods.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-navy/15 p-6 text-center text-sm text-navy/50">
            No periods yet for {DAYS.find((d) => d.id === activeDay)?.label}.
          </div>
        ) : null}

        {dayPeriods.map((p) => (
          <PeriodRow
            key={p.id}
            period={p}
            onChange={(patch) => update(p.id, patch)}
            onRemove={() => remove(p.id)}
          />
        ))}

        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-2 rounded-full bg-gold-soft px-4 py-2 text-sm font-bold text-navy hover:bg-gold/40"
        >
          <Plus className="h-4 w-4" /> Add period
        </button>
      </div>
    </div>
  );
}

function PeriodRow({
  period,
  onChange,
  onRemove,
}: {
  period: SchedulePeriod;
  onChange: (patch: Partial<SchedulePeriod>) => void;
  onRemove: () => void;
}) {
  const invalidTime =
    period.endTime <= period.startTime && period.startTime && period.endTime;

  return (
    <div className="rounded-2xl border-2 border-navy/10 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={period.startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
            className="rounded-lg border-2 border-navy/15 bg-white px-2 py-1.5 text-sm font-bold text-navy focus:border-gold focus:outline-none"
          />
          <span className="text-navy/40">–</span>
          <input
            type="time"
            value={period.endTime}
            onChange={(e) => onChange({ endTime: e.target.value })}
            className={`rounded-lg border-2 bg-white px-2 py-1.5 text-sm font-bold text-navy focus:outline-none ${
              invalidTime ? "border-destructive" : "border-navy/15 focus:border-gold"
            }`}
          />
        </div>

        <select
          value={period.periodType}
          onChange={(e) =>
            onChange({ periodType: e.target.value as PeriodType })
          }
          className="rounded-lg border-2 border-navy/15 bg-white px-2 py-1.5 text-sm font-bold text-navy focus:border-gold focus:outline-none"
        >
          <option value="class">Class</option>
          <option value="recess">Recess</option>
          <option value="duty">Duty</option>
        </select>

        <button
          type="button"
          onClick={onRemove}
          className="ml-auto rounded-full p-2 text-navy/50 hover:bg-destructive/10 hover:text-destructive"
          aria-label="Remove period"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {period.periodType === "class" ? (
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <select
            value={period.grade ?? "Kinder"}
            onChange={(e) => onChange({ grade: e.target.value })}
            className="rounded-lg border-2 border-navy/15 bg-white px-2 py-1.5 text-sm text-navy focus:border-gold focus:outline-none"
          >
            {GRADES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <input
            type="text"
            value={period.classroomTeacher ?? ""}
            onChange={(e) => onChange({ classroomTeacher: e.target.value })}
            placeholder="Classroom teacher"
            className="rounded-lg border-2 border-navy/15 bg-white px-2 py-1.5 text-sm text-navy focus:border-gold focus:outline-none"
          />
          <input
            type="text"
            value={period.roomNumber ?? ""}
            onChange={(e) => onChange({ roomNumber: e.target.value })}
            placeholder="Room (optional)"
            className="rounded-lg border-2 border-navy/15 bg-white px-2 py-1.5 text-sm text-navy focus:border-gold focus:outline-none"
          />
        </div>
      ) : (
        <div className="mt-3">
          <input
            type="text"
            value={period.dutyLabel ?? ""}
            onChange={(e) => onChange({ dutyLabel: e.target.value })}
            placeholder={period.periodType === "recess" ? "Recess" : "Bus duty"}
            className="w-full rounded-lg border-2 border-navy/15 bg-white px-2 py-1.5 text-sm text-navy focus:border-gold focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
