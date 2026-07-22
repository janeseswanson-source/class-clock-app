import { useState } from "react";
import type { SchedulePeriod } from "@/lib/types";

interface ImportPanelProps {
  onImport: (rows: SchedulePeriod[]) => void;
  count: number;
}

const SAMPLE = `[
  {
    "id": "p1",
    "dayOfWeek": 1,
    "startTime": "08:00",
    "endTime": "08:40",
    "periodType": "class",
    "grade": "Kinder",
    "classroomTeacher": "Ms. Tempo",
    "roomNumber": "Rm G-1"
  }
]`;

export function ImportPanel({ onImport, count }: ImportPanelProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    setError(null);
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Expected an array of periods.");
      // minimal shape validation
      const ok = parsed.every(
        (p) =>
          typeof p.startTime === "string" &&
          typeof p.endTime === "string" &&
          typeof p.dayOfWeek === "number" &&
          typeof p.periodType === "string",
      );
      if (!ok) throw new Error("Some rows are missing required fields.");
      const rows: SchedulePeriod[] = parsed.map((p, i) => ({
        id: p.id ?? `imp-${Date.now()}-${i}`,
        dayOfWeek: p.dayOfWeek,
        startTime: p.startTime,
        endTime: p.endTime,
        periodType: p.periodType,
        grade: p.grade,
        classroomTeacher: p.classroomTeacher,
        roomNumber: p.roomNumber,
        dutyLabel: p.dutyLabel,
      }));
      onImport(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not parse JSON.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-navy/5 p-4 text-xs text-navy/70">
        Paste a JSON export from Scheduler Ops below. Each row needs{" "}
        <code className="font-mono">dayOfWeek</code> (1–5),{" "}
        <code className="font-mono">startTime</code>,{" "}
        <code className="font-mono">endTime</code>, and{" "}
        <code className="font-mono">periodType</code>. You'll be able to edit
        everything before saving.
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={SAMPLE}
        rows={10}
        className="w-full rounded-xl border-2 border-navy/15 bg-white p-3 font-mono text-xs text-navy focus:border-gold focus:outline-none"
      />

      {error ? (
        <div className="text-sm text-destructive font-bold">{error}</div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleParse}
          disabled={!text.trim()}
          className="rounded-full bg-gold px-5 py-2 text-sm font-bold text-navy hover:bg-gold/90 disabled:opacity-40"
        >
          Parse & import
        </button>
        {count > 0 ? (
          <span className="text-sm text-navy/70">
            Imported <b>{count}</b> period{count === 1 ? "" : "s"}. Review on
            the next step.
          </span>
        ) : null}
      </div>
    </div>
  );
}
