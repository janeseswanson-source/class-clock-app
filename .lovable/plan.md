# Excel (.xlsx) support for AI schedule import

Today the import only accepts CSV, TSV, plain text, PDF and photos. Dropping an Excel workbook shows "That file type isn't supported yet". This adds real Excel support, and makes the AI read every tab in the workbook rather than just the first one.

## What changes for you

- Drag in a `.xlsx` (or older `.xls`) file and it just works, same as a CSV.
- If the workbook has several tabs — e.g. one per day, or "Mon-Wed" and "Thu-Fri", or a schedule tab plus a legend/notes tab — all of them are read. The AI merges the schedule tabs and ignores irrelevant ones, noting in the warnings list which tabs it used and which it skipped.
- Empty or hidden-looking tabs are skipped silently.
- The upload hint text updates to mention Excel.

## How it works

1. Add SheetJS (`xlsx`, pure JavaScript, works in the server runtime) as a dependency.
2. `src/lib/schedule-import.functions.ts`
   - Add the Excel MIME types to `SUPPORTED_MIME_TYPES`:
     `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and `application/vnd.ms-excel`.
   - New server-only helper (`src/lib/xlsx.server.ts`, imported dynamically inside the handler so it never enters the client bundle) that reads the base64 buffer with SheetJS and returns a single text document: for each non-empty sheet, a `=== Sheet: "<name>" ===` header followed by that sheet's CSV rows, blank sheets dropped, cells kept as displayed text so times stay readable.
   - `contentBlockForFile` becomes async and routes the Excel types through that helper, emitting a normal `text` block — no other part of the pipeline changes.
   - Cap the assembled text (~400k chars) and, if it overflows, truncate and add a warning so a huge workbook fails gracefully rather than blowing the token budget.
3. Prompt: add a short section telling the model the input may contain multiple sheets marked by `=== Sheet: ... ===`, to extract periods from every sheet that looks like a schedule, de-duplicate rows that repeat across sheets, ignore legend/roster/notes sheets, and record in `warnings` which sheets it used and which it skipped.
4. `src/components/setup/AIImportPanel.tsx`
   - Extend `ACCEPT` with `.xlsx,.xls`.
   - Extend `resolveMimeType`'s extension fallback for `xlsx`/`xls` (browsers are inconsistent about Excel MIME types).
   - Update the unsupported-file toast and the helper copy to list Excel.

## Notes

- Excel time cells often come through as fractions or dates; the helper formats cells with SheetJS's display formatting so the model sees `9:15 AM` rather than `0.385`.
- No database or auth changes; the existing `requireSupabaseAuth` middleware and size limits stay as they are.
