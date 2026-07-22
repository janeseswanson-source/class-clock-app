import type { BehaviorScore, ClassSession, SchedulePeriod } from "@/lib/types";
import { ScoreChip } from "./ScoreChip";
import { formatDayLabel } from "@/lib/date-ranges";
import { RATING_LABELS } from "@/lib/types";

interface SessionsTableProps {
  sessions: ClassSession[];
  periodsById: Map<string, SchedulePeriod>;
  onEdit: (session: ClassSession, score: BehaviorScore) => void;
}

function formatTime(t?: string) {
  if (!t) return "";
  const [hStr, m] = t.split(":");
  let h = parseInt(hStr, 10);
  const suf = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${suf}`;
}

export function SessionsTable({ sessions, periodsById, onEdit }: SessionsTableProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-navy/15 p-10 text-center">
        <div className="text-sm text-navy/50">
          No behavior scores in this range yet.
        </div>
      </div>
    );
  }

  const byDate = new Map<string, ClassSession[]>();
  for (const s of sessions) {
    if (!byDate.has(s.date)) byDate.set(s.date, []);
    byDate.get(s.date)!.push(s);
  }
  const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {dates.map((d) => {
        const list = byDate.get(d)!.slice().sort((a, b) => {
          const pa = periodsById.get(a.schedulePeriodId)?.startTime ?? "";
          const pb = periodsById.get(b.schedulePeriodId)?.startTime ?? "";
          return pa.localeCompare(pb);
        });
        return (
          <div key={d}>
            <div className="text-xs font-bold tracking-[0.2em] text-navy/60 mb-2">
              {formatDayLabel(d).toUpperCase()}
            </div>
            <div className="overflow-hidden rounded-2xl border-2 border-navy/10 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-navy/5 text-left text-xs font-bold tracking-wider text-navy/60">
                  <tr>
                    <th className="px-4 py-2">Time</th>
                    <th className="px-4 py-2">Grade</th>
                    <th className="px-4 py-2">Teacher</th>
                    <th className="px-4 py-2">Score</th>
                    <th className="px-4 py-2">Rating</th>
                    <th className="px-4 py-2 text-right">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => {
                    const p = periodsById.get(s.schedulePeriodId);
                    return (
                      <tr key={s.date + s.schedulePeriodId} className="border-t border-navy/5">
                        <td className="px-4 py-2 font-bold text-navy whitespace-nowrap">
                          {formatTime(p?.startTime)} – {formatTime(p?.endTime)}
                        </td>
                        <td className="px-4 py-2 text-navy">{p?.grade ?? "—"}</td>
                        <td className="px-4 py-2 text-navy/70">{p?.classroomTeacher ?? "—"}</td>
                        <td className="px-4 py-2">
                          <ScoreChip score={s.behaviorScore} />
                        </td>
                        <td className="px-4 py-2 text-navy/70">
                          {s.ratingLabel}
                          {s.edited ? (
                            <span className="ml-2 text-[10px] font-bold uppercase text-gold">edited</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="inline-flex gap-1">
                            {([1, 2, 3, 4, 5] as BehaviorScore[]).map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => onEdit(s, n)}
                                title={RATING_LABELS[n]}
                                className={`h-7 w-7 rounded-md text-xs font-bold transition-colors ${
                                  s.behaviorScore === n
                                    ? "bg-navy text-white"
                                    : "bg-navy/5 text-navy hover:bg-navy/10"
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
