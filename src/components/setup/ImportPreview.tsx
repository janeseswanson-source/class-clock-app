import { useMemo } from "react";
import { Check, FileSpreadsheet, X } from "lucide-react";
import { DAYS } from "@/lib/schedule";
import type { DayOfWeek, SchedulePeriod } from "@/lib/types";

interface ImportPreviewProps {
  filename: string;
  sheets: string[];
  periods: SchedulePeriod[];
  onConfirm: () => void;
  onDiscard: () => void;
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (h === undefined || m === undefined || Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function describe(p: SchedulePeriod): string {
  if (p.periodType === "class") {
    return (
      [p.grade, p.className].filter(Boolean).join(" · ") ||
      p.classroomTeacher ||
      "Class"
    );
  }
  return p.dutyLabel ?? (p.periodType === "recess" ? "Recess" : "Duty");
}

export function ImportPreview({
  filename,
  sheets,
  periods,
  onConfirm,
  onDiscard,
}: ImportPreviewProps) {
  const byDay = useMemo(
    () =>
      DAYS.map((day) => ({
        day,
        rows: periods
          .filter((p) => p.dayOfWeek === (day.id as DayOfWeek))
          .slice()
          .sort((a, b) => a.startTime.localeCompare(b.startTime)),
      })).filter((group) => group.rows.length > 0),
    [periods],
  );

  return (
    <div className="rounded-2xl border-2 border-navy/15 bg-white">
      <div className="border-b-2 border-navy/10 px-4 py-3">
        <div className="text-sm font-black text-navy">
          Review {periods.length} row{periods.length === 1 ? "" : "s"} before saving
        </div>
        <div className="mt-0.5 text-xs text-navy/60">
          Read from <span className="font-semibold">{filename}</span>
        </div>
        {sheets.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-navy/70">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Sheets used:
            </span>
            {sheets.map((s) => (
              <span
                key={s}
                className="rounded-full bg-gold-soft px-2 py-0.5 text-xs font-semibold text-navy"
              >
                {s}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="max-h-80 overflow-y-auto px-4 py-3">
        {byDay.length === 0 ? (
          <div className="py-6 text-center text-sm text-navy/60">
            No schedule rows were found in this file.
          </div>
        ) : (
          <div className="space-y-4">
            {byDay.map(({ day, rows }) => (
              <div key={day.id}>
                <div className="mb-1 text-xs font-black uppercase tracking-wider text-navy/50">
                  {day.label} · {rows.length}
                </div>
                <ul className="divide-y divide-navy/10">
                  {rows.map((p) => (
                    <li key={p.id} className="flex items-baseline gap-3 py-1.5 text-sm">
                      <span className="w-36 shrink-0 font-mono text-xs text-navy/70">
                        {formatTime(p.startTime)}–{formatTime(p.endTime)}
                      </span>
                      <span className="font-semibold text-navy">{describe(p)}</span>
                      {p.roomNumber ? (
                        <span className="text-xs text-navy/60">Rm {p.roomNumber}</span>
                      ) : null}
                      {p.periodType !== "class" ? (
                        <span className="rounded-full bg-navy/5 px-2 py-0.5 text-[11px] font-bold uppercase text-navy/60">
                          {p.periodType}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t-2 border-navy/10 px-4 py-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={periods.length === 0}
          className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-bold text-white hover:bg-navy/90 disabled:opacity-50"
        >
          <Check className="h-4 w-4" /> Use these rows
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-navy/20 px-4 py-2 text-sm font-bold text-navy hover:border-navy/40"
        >
          <X className="h-4 w-4" /> Discard
        </button>
      </div>
    </div>
  );
}
