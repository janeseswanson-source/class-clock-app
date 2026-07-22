import { FileDown, BarChart3 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { downloadBlob, toCSV } from "@/lib/csv";
import { todayISO } from "@/lib/session-store";
import type { SchedulePeriod, ClassSession } from "@/lib/types";

interface ReportFooterProps {
  schedule: SchedulePeriod[];
  todaySessions: ClassSession[];
}

export function ReportFooter({ schedule, todaySessions }: ReportFooterProps) {
  function exportTodayCSV() {
    const date = todayISO();
    const rows = todaySessions.map((s) => {
      const p = schedule.find((sp) => sp.id === s.schedulePeriodId);
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
    downloadBlob(`behavior-${date}.csv`, toCSV(rows));
  }

  return (
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <div>
        <div className="text-sm font-bold text-navy">Today's behavior report</div>
        <div className="text-xs text-navy/60">
          Scores from all of today's classes, with teacher and time.
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          to="/reports"
          search={{ range: "today" }}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold text-navy hover:bg-muted transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          View reports
        </Link>
        <button
          type="button"
          onClick={exportTodayCSV}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold text-navy hover:bg-muted transition-colors"
        >
          <FileDown className="w-4 h-4" />
          Export CSV
        </button>
      </div>
    </div>
  );
}
