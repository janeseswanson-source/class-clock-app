import type { ClassSession, SchedulePeriod } from "@/lib/types";

interface SummaryStripProps {
  sessions: ClassSession[];
  periodsById: Map<string, SchedulePeriod>;
}

export function SummaryStrip({ sessions, periodsById }: SummaryStripProps) {
  const total = sessions.length;
  const scores = sessions
    .map((s) => s.behaviorScore)
    .filter((n): n is number => typeof n === "number");
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  const byGrade = new Map<string, number[]>();
  for (const s of sessions) {
    const p = periodsById.get(s.schedulePeriodId);
    const g = p?.grade;
    if (!g || s.behaviorScore == null) continue;
    if (!byGrade.has(g)) byGrade.set(g, []);
    byGrade.get(g)!.push(s.behaviorScore);
  }
  const gradeAverages = [...byGrade.entries()].map(([g, arr]) => ({
    grade: g,
    avg: arr.reduce((a, b) => a + b, 0) / arr.length,
  }));
  gradeAverages.sort((a, b) => b.avg - a.avg);
  const best = gradeAverages[0];
  const worst = gradeAverages[gradeAverages.length - 1];

  const cards = [
    { label: "Classes scored", value: String(total) },
    { label: "Average score", value: avg ? avg.toFixed(1) : "—" },
    { label: "Best grade", value: best ? `${best.grade} · ${best.avg.toFixed(1)}` : "—" },
    { label: "Needs support", value: worst && best !== worst ? `${worst.grade} · ${worst.avg.toFixed(1)}` : "—" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border-2 border-navy/10 bg-white p-4">
          <div className="text-[10px] font-bold tracking-[0.2em] text-navy/60">
            {c.label.toUpperCase()}
          </div>
          <div className="mt-1 text-2xl font-black text-navy">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
