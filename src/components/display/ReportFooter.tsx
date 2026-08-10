import { BarChart3, FileDown, FileText, Printer } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { downloadBlob, toCSV } from "@/lib/csv";
import { buildReportRows, downloadReportDoc, printReportPDF } from "@/lib/report-export";
import { todayISO } from "@/lib/session-store";
import type { ClassSession, SchedulePeriod, TimerInstance } from "@/lib/types";

interface ReportFooterProps {
  schedule: SchedulePeriod[];
  todaySessions: ClassSession[];
  instance: Pick<TimerInstance, "subjectTitle" | "teacherName">;
}

const buttonClass =
  "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold text-navy transition-colors hover:bg-muted disabled:opacity-40 sm:min-h-0 sm:flex-none";

export function ReportFooter({ schedule, todaySessions, instance }: ReportFooterProps) {
  const date = todayISO();
  const rows = buildReportRows(todaySessions, schedule);
  const empty = rows.length === 0;
  const rangeLabel = `Today · ${date}`;

  const exportCSV = () => {
    downloadBlob(
      `behavior-${date}.csv`,
      toCSV(
        todaySessions.map((s) => {
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
        }),
      ),
    );
  };

  const exportPDF = () => {
    if (!printReportPDF(rows, instance, rangeLabel)) {
      toast.error("Your browser blocked the print window", {
        description: "Allow pop-ups for this site, then try again.",
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <div>
        <div className="text-sm font-bold text-navy">Today's behavior report</div>
        <div className="text-sm text-navy/60 md:text-xs">
          {empty
            ? "No classes scored yet today."
            : `${rows.length} scored ${rows.length === 1 ? "class" : "classes"}, with teacher and time.`}
        </div>
      </div>
      <div className="flex w-full flex-wrap gap-2 sm:w-auto">
        <Link to="/reports" search={{ range: "today" as const }} className={buttonClass}>
          <BarChart3 className="h-4 w-4" />
          View reports
        </Link>
        <button type="button" onClick={exportPDF} disabled={empty} className={buttonClass}>
          <Printer className="h-4 w-4" />
          PDF
        </button>
        <button
          type="button"
          disabled={empty}
          onClick={() => downloadReportDoc(rows, instance, rangeLabel, `behavior-${date}.doc`)}
          className={buttonClass}
        >
          <FileText className="h-4 w-4" />
          Doc
        </button>
        <button type="button" onClick={exportCSV} disabled={empty} className={buttonClass}>
          <FileDown className="h-4 w-4" />
          CSV
        </button>
      </div>
    </div>
  );
}
