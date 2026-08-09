// Behavior report exports. The brief promised PDF and Google Doc downloads;
// both are produced client-side with no extra dependency — PDF through the
// browser's own print-to-PDF, and "Google Doc" as a Word-compatible HTML file
// that Docs, Word, and Pages all open directly.

import { downloadBlob } from "./csv";
import { formatTime } from "./schedule";
import type { ClassSession, SchedulePeriod, TimerInstance } from "./types";

export interface ReportRow {
  date: string;
  time: string;
  grade: string;
  classroomTeacher: string;
  room: string;
  score: number | null;
  ratingLabel: string | null;
  edited: boolean;
}

export function buildReportRows(
  sessions: ClassSession[],
  schedule: SchedulePeriod[],
): ReportRow[] {
  const byId = new Map(schedule.map((p) => [p.id, p]));
  const sortKey = (s: ClassSession) =>
    `${s.date} ${byId.get(s.schedulePeriodId)?.startTime ?? ""}`;

  return [...sessions]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
    .map((s) => {
      const p = byId.get(s.schedulePeriodId);
      return {
        date: s.date,
        time: p ? `${formatTime(p.startTime)} – ${formatTime(p.endTime)}` : "—",
        grade: p?.grade ?? "—",
        classroomTeacher: p?.classroomTeacher ?? "—",
        room: p?.roomNumber ?? "",
        score: s.behaviorScore,
        ratingLabel: s.ratingLabel,
        edited: s.edited,
      };
    });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function reportHtml(
  rows: ReportRow[],
  instance: Pick<TimerInstance, "subjectTitle" | "teacherName">,
  rangeLabel: string,
): string {
  const scored = rows.filter((r) => r.score != null);
  const average = scored.length
    ? (scored.reduce((sum, r) => sum + (r.score ?? 0), 0) / scored.length).toFixed(1)
    : "—";

  const body = rows
    .map(
      (r) => `<tr>
      <td>${escapeHtml(r.date)}</td>
      <td>${escapeHtml(r.time)}</td>
      <td>${escapeHtml(r.grade)}</td>
      <td>${escapeHtml(r.classroomTeacher)}</td>
      <td>${escapeHtml(r.room)}</td>
      <td class="num">${r.score ?? "—"}</td>
      <td>${escapeHtml(r.ratingLabel ?? "—")}${r.edited ? " <i>(edited)</i>" : ""}</td>
    </tr>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Behavior report — ${escapeHtml(instance.subjectTitle)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #1E3A5F; margin: 32px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color: #5b6b80; font-size: 13px; margin-bottom: 18px; }
  .summary { font-size: 13px; margin-bottom: 14px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { border: 1px solid #c9d2de; padding: 6px 8px; text-align: left; }
  th { background: #f2f5f9; }
  td.num { text-align: center; font-weight: bold; }
</style></head>
<body>
  <h1>${escapeHtml(instance.subjectTitle)} — behavior report</h1>
  <div class="meta">${escapeHtml(instance.teacherName)} · ${escapeHtml(rangeLabel)}</div>
  <div class="summary"><b>${scored.length}</b> classes scored · average <b>${average}</b> out of 5</div>
  <table>
    <thead><tr>
      <th>Date</th><th>Time</th><th>Grade</th><th>Classroom teacher</th>
      <th>Room</th><th>Score</th><th>Rating</th>
    </tr></thead>
    <tbody>${body || '<tr><td colspan="7">No scores in this range.</td></tr>'}</tbody>
  </table>
</body></html>`;
}

/**
 * Opens the report in a print window. The browser's "Save as PDF" destination
 * does the actual PDF generation, which keeps the bundle free of a PDF library.
 */
export function printReportPDF(
  rows: ReportRow[],
  instance: Pick<TimerInstance, "subjectTitle" | "teacherName">,
  rangeLabel: string,
): boolean {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return false; // pop-up blocked — caller tells the teacher
  win.document.write(reportHtml(rows, instance, rangeLabel));
  win.document.close();
  win.focus();
  // Give the new document a beat to lay out before the print dialog appears.
  win.setTimeout(() => win.print(), 250);
  return true;
}

/** Word/Google Docs-compatible download. */
export function downloadReportDoc(
  rows: ReportRow[],
  instance: Pick<TimerInstance, "subjectTitle" | "teacherName">,
  rangeLabel: string,
  filename: string,
) {
  downloadBlob(
    filename,
    reportHtml(rows, instance, rangeLabel),
    "application/msword;charset=utf-8",
  );
}
