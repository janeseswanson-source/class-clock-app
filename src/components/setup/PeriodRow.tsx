import { AlarmClock, ArrowDownToLine, Trash2 } from "lucide-react";
import { TimeField } from "./TimeField";
import {
  cleanupTimeLabel,
  durationMinutes,
  formatTime,
  GRADES,
  hasCleanup,
} from "@/lib/schedule";
import type { PeriodType, SchedulePeriod, TimerSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PeriodRowProps {
  period: SchedulePeriod;
  settings: TimerSettings;
  conflicted: boolean;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<SchedulePeriod>) => void;
  /** Move this period and everything after it on the same day. */
  onRipple: (deltaMin: number) => void;
  onRemove: () => void;
}

const TYPE_LABELS: Array<{ value: PeriodType; label: string }> = [
  { value: "class", label: "Class" },
  { value: "recess", label: "Recess" },
  { value: "duty", label: "Duty" },
];

const inputClass =
  "rounded-lg border-2 border-navy/15 bg-white px-2.5 py-2 text-sm text-navy focus:border-gold focus:outline-none";

export function PeriodRow({
  period,
  settings,
  conflicted,
  selected,
  onSelect,
  onChange,
  onRipple,
  onRemove,
}: PeriodRowProps) {
  const length = durationMinutes(period);
  const invalidLength = length <= 0;
  const usesDefaultCleanup = period.cleanupMinutes == null;
  const cleanupAt = cleanupTimeLabel(period, settings);

  return (
    <div
      onFocusCapture={onSelect}
      className={cn(
        "rounded-2xl border-2 bg-white p-4 transition-colors",
        conflicted
          ? "border-destructive/60 bg-destructive/[0.03]"
          : selected
            ? "border-navy"
            : "border-navy/10",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <TimeField
          label="Class start"
          value={period.startTime}
          invalid={conflicted}
          onChange={(startTime) => onChange({ startTime })}
        />
        <span className="text-navy/40">–</span>
        <TimeField
          label="Class ends"
          value={period.endTime}
          invalid={conflicted || invalidLength}
          onChange={(endTime) => onChange({ endTime })}
        />

        <span
          className={cn(
            "text-xs font-bold tabular-nums",
            invalidLength ? "text-destructive" : "text-navy/50",
          )}
        >
          {invalidLength ? "ends before it starts" : `${length} min`}
        </span>

        <select
          aria-label="Period type"
          value={period.periodType}
          onChange={(e) => onChange({ periodType: e.target.value as PeriodType })}
          className={cn(inputClass, "font-bold")}
        >
          {TYPE_LABELS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => onRipple(5)}
            title="Push this period and everything after it 5 minutes later"
            aria-label="Push this period and the rest of the day 5 minutes later"
            className="inline-flex items-center gap-1 rounded-full border-2 border-navy/15 px-2.5 py-1.5 text-xs font-bold text-navy hover:border-navy/40"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" /> +5 rest of day
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full p-2 text-navy/50 hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Remove ${formatTime(period.startTime)} period`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {period.periodType === "class" ? (
        <div className="mt-3 space-y-2">
          <div className="grid gap-2 md:grid-cols-4">
            <select
              aria-label="Grade"
              value={period.grade ?? GRADES[0]}
              onChange={(e) => onChange({ grade: e.target.value })}
              className={inputClass}
            >
              {GRADES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <input
              type="text"
              aria-label="Class name"
              value={period.className ?? ""}
              onChange={(e) => onChange({ className: e.target.value })}
              placeholder="Class name (optional)"
              className={inputClass}
            />
            <input
              type="text"
              aria-label="Classroom teacher"
              value={period.classroomTeacher ?? ""}
              onChange={(e) => onChange({ classroomTeacher: e.target.value })}
              placeholder="Classroom teacher"
              className={inputClass}
            />
            <input
              type="text"
              aria-label="Room number"
              value={period.roomNumber ?? ""}
              onChange={(e) => onChange({ roomNumber: e.target.value })}
              placeholder="Room (optional)"
              className={inputClass}
            />
          </div>
          <input
            type="text"
            aria-label="Note"
            value={period.note ?? ""}
            onChange={(e) => onChange({ note: e.target.value })}
            placeholder="Note — e.g. pickup location, take to lunch (optional)"
            className={cn(inputClass, "w-full")}
          />
        </div>
      ) : (
        <div className="mt-3">
          <input
            type="text"
            aria-label={period.periodType === "recess" ? "Recess label" : "Duty label"}
            value={period.dutyLabel ?? ""}
            onChange={(e) => onChange({ dutyLabel: e.target.value })}
            placeholder={period.periodType === "recess" ? "Recess" : "Bus duty"}
            className={cn(inputClass, "w-full")}
          />
        </div>
      )}

      {hasCleanup(period) ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-gold-soft/60 px-3 py-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-navy">
            <AlarmClock className="h-3.5 w-3.5" /> CLEAN UP
          </span>
          <label className="inline-flex items-center gap-1.5 text-xs font-bold text-navy/70">
            <input
              type="checkbox"
              checked={usesDefaultCleanup}
              onChange={(e) =>
                onChange({
                  cleanupMinutes: e.target.checked ? null : settings.cleanupLeadMinutes,
                })
              }
              className="h-3.5 w-3.5 accent-[oklch(0.28_0.07_260)]"
            />
            Use app default ({settings.cleanupLeadMinutes} min)
          </label>
          {!usesDefaultCleanup ? (
            <span className="inline-flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={60}
                aria-label="Clean-up minutes before this class ends"
                value={period.cleanupMinutes ?? 0}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  onChange({ cleanupMinutes: Number.isFinite(n) ? Math.max(0, Math.min(60, n)) : 0 });
                }}
                className="w-16 rounded-lg border-2 border-navy/20 bg-white px-2 py-1 text-sm font-bold tabular-nums text-navy focus:border-gold focus:outline-none"
              />
              <span className="text-xs font-bold text-navy/70">minutes</span>
            </span>
          ) : null}
          <span className="ml-auto text-xs font-bold text-navy">
            {cleanupAt ? (
              <>
                Alarm rings <span className="tabular-nums">{cleanupAt}</span>
              </>
            ) : (
              <span className="text-navy/50">No clean-up alarm</span>
            )}
          </span>
        </div>
      ) : null}
    </div>
  );
}
