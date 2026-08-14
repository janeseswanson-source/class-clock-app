# Type your schedule and let AI build it

Add a third way to fill the schedule: type or paste the schedule in plain words, and the AI turns it into periods and alarms — same review step as file import.

## What changes for you

- On the import step you get two tabs: **Upload a file** and **Type it out**.
- The typed box accepts free-form text, e.g.
  `Mon 8:05-8:45 Grade 3 Ms. Ferguson room 12, then recess 8:45-9:00...`
- A short hint line and one example placeholder show the kind of thing that works; no strict format required.
- Press "Read my schedule" and you get the same preview card as file import — rows grouped by day, warnings for anything ambiguous — with "Use these rows" / "Discard" before anything is saved.
- Everything after that is unchanged: refine in the weekly editor, save, and the clean-up/end alarms are generated from the periods as usual.

## How it works

1. `src/components/setup/AIImportPanel.tsx`
   - Add a simple two-tab switch (upload / type) above the current drop zone; the drop zone, error, warnings and `ImportPreview` blocks stay shared.
   - The typed tab holds a `textarea` (min ~8 rows), a character guard, and a submit button disabled while empty or analyzing.
   - On submit, encode the text as base64 and call the existing `analyzeFile` with `mimeType: "text/plain"` and `filename: "Typed schedule"` — no new server surface, no pipeline change.
2. `src/lib/schedule-import.functions.ts`
   - Small prompt addition: the input may be informal typed prose rather than a table; infer day names/abbreviations, allow ranges like "Mon-Wed", assume the day repeats when only times are listed, and record any assumption in `warnings` instead of guessing silently.
3. `src/components/setup/MethodPicker.tsx`
   - Update the "Upload a file" option copy to mention typing it out too, so the choice is discoverable from step 2.

## Notes

- No database, auth, or alarm-logic changes; typed input reuses the same validated `SchedulePeriod` output, so alarms come from the existing schedule rules.
- Text is sent through the same authenticated server function, with the existing size limits.
