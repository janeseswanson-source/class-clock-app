import { useRef, useState } from "react";
import { AlertTriangle, FileUp, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ImportPanel } from "./ImportPanel";
import { useScheduleImport } from "@/hooks/useScheduleImport";
import { SUPPORTED_MIME_TYPES, type SupportedMimeType } from "@/lib/schedule-import.functions";
import type { SchedulePeriod } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AIImportPanelProps {
  onImport: (rows: SchedulePeriod[]) => void;
  count: number;
}

const ACCEPT = ".csv,.txt,.tsv,.pdf,.xlsx,.xls,image/*";

function isSupportedMimeType(value: string): value is SupportedMimeType {
  return (SUPPORTED_MIME_TYPES as readonly string[]).includes(value);
}

// Some browsers don't set a MIME type for .csv/.tsv, and Excel MIME types vary
// by OS/browser — fall back to the file extension.
function resolveMimeType(file: File): SupportedMimeType | null {
  const ext = file.name.toLowerCase().split(".").pop();
  if (ext === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (ext === "xls") return "application/vnd.ms-excel";
  if (isSupportedMimeType(file.type)) return file.type;
  if (ext === "csv") return "text/csv";
  if (ext === "tsv") return "text/tab-separated-values";
  if (ext === "txt") return "text/plain";
  return null;
}


function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.slice(result.indexOf(",") + 1);
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}

export function AIImportPanel({ onImport, count }: AIImportPanelProps) {
  const { analyzeFile, isAnalyzing, error } = useScheduleImport();
  const [dragging, setDragging] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [lastFilename, setLastFilename] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setWarnings([]);
    const mimeType = resolveMimeType(file);
    if (!mimeType) {
      toast.error("That file type isn't supported yet", {
        description: "Try Excel (.xlsx), Excel, CSV, plain text, PDF, or a photo of a printed schedule.",
      });
      return;
    }

    try {
      const dataBase64 = await readFileAsBase64(file);
      const result = await analyzeFile({ filename: file.name, mimeType, dataBase64 });
      setLastFilename(file.name);
      setWarnings(result.warnings);
      onImport(result.periods);
      toast.success(`Found ${result.periods.length} period${result.periods.length === 1 ? "" : "s"}`, {
        description: "Review everything below before saving.",
      });
    } catch {
      // Surfaced via the hook's `error` state below.
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) void handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={cn(
          "cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          dragging ? "border-gold bg-gold-soft" : "border-navy/20 hover:border-navy/40",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void handleFile(file);
          }}
        />
        {isAnalyzing ? (
          <div className="flex flex-col items-center gap-2 text-navy">
            <Loader2 className="h-6 w-6 animate-spin" />
            <div className="text-sm font-bold">Analyzing your file…</div>
            <div className="text-xs text-navy/60">This can take a few seconds.</div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-navy">
            <div className="rounded-full bg-navy/5 p-3">
              <FileUp className="h-5 w-5" />
            </div>
            <div className="text-sm font-bold">
              Drop a file here, or click to choose one
            </div>
            <div className="text-xs text-navy/60">
              Excel, CSV, plain text, PDF, or a photo of a printed schedule
            </div>
          </div>
        )}
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border-2 border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="rounded-xl border-2 border-gold/50 bg-gold-soft/50 px-4 py-3 text-sm text-navy">
          <div className="mb-1 inline-flex items-center gap-1.5 font-bold">
            <Sparkles className="h-3.5 w-3.5" /> Worth a look
          </div>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-navy/80">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {count > 0 && lastFilename ? (
        <div className="text-sm text-navy/70">
          Imported <b>{count}</b> period{count === 1 ? "" : "s"} from{" "}
          <span className="font-semibold">{lastFilename}</span>. Review on the next step.
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setShowFallback((v) => !v)}
        className="text-xs font-bold text-navy/60 underline underline-offset-4 hover:text-navy"
      >
        {showFallback ? "Hide" : "Paste JSON instead"}
      </button>
      {showFallback ? <ImportPanel onImport={onImport} count={count} /> : null}
    </div>
  );
}
