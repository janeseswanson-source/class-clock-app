import { FileText, FileDown } from "lucide-react";

export function ReportFooter() {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-border">
      <div>
        <div className="text-sm font-bold text-navy">Today's behavior report</div>
        <div className="text-xs text-navy/60">
          Scores from all of today's classes, with teacher and time.
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold text-navy hover:bg-muted transition-colors"
        >
          <FileText className="w-4 h-4" />
          Google Doc
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold text-navy hover:bg-muted transition-colors"
        >
          <FileDown className="w-4 h-4" />
          PDF
        </button>
      </div>
    </div>
  );
}
