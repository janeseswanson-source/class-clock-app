import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, FileDown } from "lucide-react";
import { RangeFilter } from "@/components/reports/RangeFilter";
import { SessionsTable } from "@/components/reports/SessionsTable";
import { SummaryStrip } from "@/components/reports/SummaryStrip";
import { useConfig } from "@/hooks/useConfig";
import { useSessions } from "@/hooks/useSessions";
import { isoDate, rangeFor, withinRange, type RangeKey } from "@/lib/date-ranges";
import { downloadBlob, toCSV } from "@/lib/csv";
import { upsertSession } from "@/lib/session-store";
import type { BehaviorScore, ClassSession } from "@/lib/types";

const searchSchema = z.object({
  range: z.enum(["today", "week", "month", "all", "custom"]).optional(),
});

export const Route = createFileRoute("/reports")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Behavior Reports — Next Specials Timer" },
      { name: "description", content: "Review and export classroom behavior scores over time." },
      { property: "og:title", content: "Behavior Reports — Next Specials Timer" },
      { property: "og:description", content: "Review and export classroom behavior scores over time." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { range: initialRange } = Route.useSearch();
  const { config, isLoaded } = useConfig();
  const { sessions } = useSessions();

  const [range, setRange] = useState<RangeKey>(initialRange ?? "week");
  const today = isoDate(new Date());
  const [custom, setCustom] = useState({ from: today, to: today });

  const periodsById = useMemo(() => {
    const m = new Map<string, ClassSession extends never ? never : import("@/lib/types").SchedulePeriod>();
    (config?.schedule ?? []).forEach((p) => m.set(p.id, p));
    return m;
  }, [config]);

  const activeRange = rangeFor(range, range === "custom" ? custom : undefined);

  const filtered = useMemo<ClassSession[]>(() => {
    const rows: ClassSession[] = [];
    for (const [date, list] of Object.entries(sessions)) {
      if (!withinRange(date, activeRange)) continue;
      rows.push(...list);
    }
    return rows;
  }, [sessions, activeRange]);

  const exportCSV = () => {
    const rows = filtered.map((s) => {
      const p = periodsById.get(s.schedulePeriodId);
      return {
        date: s.date,
        startTime: p?.startTime ?? "",
        endTime: p?.endTime ?? "",
        grade: p?.grade ?? "",
        classroomTeacher: p?.classroomTeacher ?? "",
        room: p?.roomNumber ?? "",
        score: s.behaviorScore,
        ratingLabel: s.ratingLabel,
        scoreLoggedAt: s.scoreLoggedAt,
        edited: s.edited,
      };
    });
    downloadBlob(`behavior-${activeRange.from}_to_${activeRange.to}.csv`, toCSV(rows));
  };

  if (!isLoaded) return <div className="min-h-screen bg-background" />;
  if (!config) return <Navigate to="/setup" />;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl p-1.5 bg-gold">
          <div className="rounded-3xl p-1 bg-background">
            <div className="rounded-3xl border-2 border-navy bg-white p-6 md:p-10">
              <div className="flex items-center justify-between">
                <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-navy/70 hover:text-navy">
                  <ArrowLeft className="h-4 w-4" /> Back to timer
                </Link>
                <button
                  type="button"
                  onClick={exportCSV}
                  disabled={filtered.length === 0}
                  className="inline-flex items-center gap-2 rounded-full bg-navy text-white px-4 py-2 text-sm font-bold hover:bg-navy/90 disabled:opacity-40"
                >
                  <FileDown className="h-4 w-4" /> Export CSV
                </button>
              </div>

              <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-navy">
                Behavior reports
              </h1>
              <p className="mt-1 text-sm text-navy/60">
                {config.instance.subjectTitle} · {config.instance.teacherName}
              </p>

              <div className="mt-6 border-t-2 border-gold" />

              <div className="mt-6">
                <RangeFilter value={range} onChange={setRange} custom={custom} onCustomChange={setCustom} />
              </div>

              <div className="mt-6">
                <SummaryStrip sessions={filtered} periodsById={periodsById} />
              </div>

              <div className="mt-6">
                <SessionsTable
                  sessions={filtered}
                  periodsById={periodsById}
                  onEdit={(s, score: BehaviorScore) =>
                    upsertSession(s.date, s.schedulePeriodId, score)
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
