import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { analyzeScheduleFile, type SupportedMimeType } from "@/lib/schedule-import.functions";
import type { SchedulePeriod } from "@/lib/types";

export interface ScheduleImportResult {
  periods: SchedulePeriod[];
  warnings: string[];
  /** Spreadsheet tabs that were read (empty for non-Excel files). */
  sheets: string[];
}

export interface ScheduleImportInput {
  filename: string;
  mimeType: SupportedMimeType;
  dataBase64: string;
}

export function useScheduleImport() {
  const analyze = useServerFn(analyzeScheduleFile);

  const mutation = useMutation({
    mutationFn: (data: ScheduleImportInput) => analyze({ data }),
  });

  const analyzeFile = useCallback(
    (data: ScheduleImportInput) => mutation.mutateAsync(data),
    [mutation],
  );

  return {
    analyzeFile,
    isAnalyzing: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    reset: mutation.reset,
  };
}
