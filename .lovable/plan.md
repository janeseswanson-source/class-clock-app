
# Phase 3 — Setup Wizard

Goal: replace hard-coded mock data with a real, user-entered configuration captured through a multi-step wizard on first launch, stored locally (backend comes in Phase 5).

## Flow

```text
/setup
 ├─ Step 1  Welcome / your details        (subjectTitle, teacherName)
 ├─ Step 2  Choose setup method           (manual | scheduler_ops)
 ├─ Step 3a Manual schedule builder       (per weekday period list)
 ├─ Step 3b Scheduler Ops import stub     (paste/upload → parsed preview)
 ├─ Step 4  Review & confirm              (weekly grid preview)
 └─ Done → redirect to "/"
```

The wall display (`/`) checks for a saved config on mount. If none exists, it redirects to `/setup`. Otherwise it renders using the stored schedule + settings instead of `mock-schedule.ts`.

## Routes

- `src/routes/setup.tsx` — wizard layout route with `<Outlet />`, step indicator, Back/Next chrome.
- `src/routes/setup.index.tsx` → Step 1 (details).
- `src/routes/setup.method.tsx` → Step 2.
- `src/routes/setup.manual.tsx` → Step 3a schedule builder.
- `src/routes/setup.import.tsx` → Step 3b Scheduler Ops (stub; accepts pasted JSON/CSV and shows preview — real parser is future work).
- `src/routes/setup.review.tsx` → Step 4 confirm + save.
- `src/routes/index.tsx` — updated to consume saved config and redirect when missing.

Each route gets its own `head()` metadata.

## State & persistence

- `src/lib/config-store.ts` — typed localStorage adapter with:
  - `loadConfig()` / `saveConfig()` / `clearConfig()`
  - Shape: `{ instance: TimerInstance, schedule: SchedulePeriod[], settings: TimerSettings, version: 1 }`
  - Default `TimerSettings` values (from `types.ts`).
- `src/hooks/useConfig.ts` — React hook exposing `{ config, isLoaded, save, clear }` backed by the store; subscribes to `storage` events so all tabs stay in sync.
- `src/lib/wizard-store.ts` — small in-memory (sessionStorage-backed) draft store for the wizard so partial progress survives step navigation and refresh but doesn't pollute production config until Step 4 confirms.

## Manual schedule builder (Step 3a)

- Weekday tabs (Mon–Fri).
- For each day, an ordered list of period rows with fields:
  - Start / End time (time inputs)
  - Type: `class | duty | recess`
  - If `class`: grade (dropdown K–5), classroomTeacher (text), roomNumber (optional text)
  - If `duty` / `recess`: dutyLabel (text, e.g. "Bus Duty")
- Add / duplicate / delete row. Sort by startTime on blur.
- Client-side validation: non-overlapping times, end > start, at least one period per active day.
- "Copy from Monday" quick action for other weekdays.

## Scheduler Ops import (Step 3b)

Phase-3 stub only:
- Textarea accepting pasted JSON matching `SchedulePeriod[]` (documented sample shown inline).
- Optional `.csv` file input parsed client-side.
- Parsed rows land in the same weekly grid preview as manual, editable before Step 4.
- Full third-party integration deferred to Phase 5.

## Review & save (Step 4)

- Read-only weekly grid: 5 columns, each column lists periods with time + label + teacher.
- Editable name/teacher summary at top with "Back to edit" links.
- "Save & start timer" → writes to `config-store`, clears wizard draft, `router.navigate({ to: "/" })`.

## Display integration

- `src/routes/index.tsx`:
  - Uses `useConfig()`; if not loaded → spinner; if empty → `<Navigate to="/setup" />`.
  - Passes `config.schedule` into the existing Phase-2 period logic (currently reads `mock-schedule.ts`; extract that read to a single source so we swap it in one place).
- `src/lib/mock-schedule.ts` stays as fallback used only in Storybook-style dev preview (not referenced by `/` anymore).
- `DisplayHeader` shows `config.instance.subjectTitle` and `config.instance.teacherName` from real data.

## Components (new, under `src/components/setup/`)

- `WizardShell.tsx` — step indicator, Back/Next buttons, progress dots styled with navy/gold tokens.
- `DetailsForm.tsx`, `MethodPicker.tsx` (two large cards Manual vs Scheduler Ops), `ScheduleDayEditor.tsx`, `PeriodRow.tsx`, `ImportPanel.tsx`, `WeekPreview.tsx`.
- All styled via existing design tokens; no hardcoded colors.

## Out of scope for Phase 3

- Editing config after initial save (Phase 4 Settings).
- Behavior report persistence (Phase 4).
- Real Scheduler Ops API (Phase 5).
- Auth / cloud sync (Phase 5).

## Acceptance

1. Fresh load with empty storage → redirected to `/setup` Step 1.
2. Completing the manual path saves a full weekly schedule and returns to `/` showing today's real periods driven by Phase-2 logic.
3. Reloading `/` after save skips the wizard.
4. `localStorage.clear()` + reload returns to the wizard.
5. Scheduler Ops path accepts a pasted JSON sample and produces the same reviewable grid.

