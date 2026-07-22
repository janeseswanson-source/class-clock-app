
# Phase 4 — Settings & Behavior Reports

Goal: make the wall display fully operable day-to-day — behavior scores persist per class session, the report footer exports real data, and a Settings page lets the teacher tune the timer without re-running the wizard.

## Flow

```text
/                  wall display (unchanged shell, now writes/reads sessions + settings)
/settings          tabbed settings page
   ├─ General      alarm style, auto-off, transition windows, behavior scoring toggle
   ├─ Schedule     jump into the same weekly editor from Phase 3
   ├─ Profile      subject title + teacher name
   └─ Data         export all / clear behavior data / reset app
/reports           behavior report browser (date range + per-class detail)
```

Gear icon in `DisplayHeader` now goes to `/settings` (was `/setup`). The wizard at `/setup` is used only for first-run and full re-setup from Data tab.

## Persistence

Extend `config-store.ts` with a second localStorage slice for behavior sessions so the config blob stays small.

- `nst.sessions.v1` → `Record<string /* YYYY-MM-DD */, ClassSession[]>`
- `session-store.ts` exposes `loadSessions()`, `upsertSession()`, `getSession(date, periodId)`, `clearSessions()`, `exportSessionsCSV()`.
- New `useSessions()` hook mirrors `useConfig()` (storage-event sync).

`ClassSession` (already in `types.ts`) gains a small runtime helper: score change updates `scoreLoggedAt`, sets `edited=true` when overwriting a prior score, stamps `ratingLabel` from `RATING_LABELS`.

## Wall display changes (`src/routes/index.tsx`)

- Add `BehaviorScoreRow` for the current class period (already built, currently static). Wire onChange to `upsertSession` for `{ date: todayISO, schedulePeriodId: currentPeriod.id }`.
- Read prior score for the current period on mount so refreshes preserve it.
- Hide the row when `settings.behaviorScoringEnabled === false` or when current period is not `class`.
- `ReportFooter` "Today" button → `/reports?range=today`; "This week" → `/reports?range=week`; "Export CSV" triggers today's CSV download directly.

## Settings page (`src/routes/settings.tsx`)

Single route with in-page tabs (shadcn `Tabs`); each tab is a section, no sub-routes needed. Head metadata set on this route.

### General tab
- Alarm style: radio group (`chime | buzzer | bell | soft_tone`) with a "Preview" button that plays the sound via `alarm.ts` (extended to accept style).
- Alarm auto-off: slider 2–15s.
- Transition — same grade: slider 1–10 min.
- Transition — grade change: slider 1–15 min.
- Behavior scoring: switch on/off.
- Sticky "Save changes" bar at bottom; unsaved-change indicator.

### Schedule tab
Reuses `ScheduleBuilder` + `WeekPreview` from Phase 3. Saves back into `config.schedule`. "Re-run setup wizard" link at bottom.

### Profile tab
Reuses `DetailsForm`. Saves `instance.subjectTitle` / `instance.teacherName`.

### Data tab
- "Export all behavior data (CSV)" → downloads a CSV of every stored session.
- "Clear behavior data" → confirm dialog, then wipes `nst.sessions.v1`.
- "Reset entire app" → confirm dialog, wipes config + sessions, navigates to `/setup`.

## Reports page (`src/routes/reports.tsx`)

- Range chips: Today · This week · This month · Custom (two date inputs).
- Summary strip: total classes, average score, best/worst grade.
- Table of sessions grouped by day: time, grade, teacher, score chip (color-coded 1–5), rating label, edited badge, "Edit" opens a small popover to change score.
- "Export CSV" button uses the same range filter.
- Empty state with link back to `/`.

CSV format:
`date,day,startTime,endTime,grade,classroomTeacher,room,score,ratingLabel,scoreLoggedAt,edited`

## New components (`src/components/settings/`, `src/components/reports/`)

- `settings/GeneralTab.tsx`, `SettingsShell.tsx` (page chrome + tabs).
- `reports/RangeFilter.tsx`, `SessionsTable.tsx`, `ScoreChip.tsx`, `SummaryStrip.tsx`.
- `lib/csv.ts` — small CSV writer + `downloadBlob()` helper.
- `lib/date-ranges.ts` — today/week/month range helpers.

## Small helpers touched

- `lib/alarm.ts`: accept `AlarmStyle` and vary the tone (different frequencies/wave shapes per style). Keep API backwards compatible; default to current chime.
- `components/display/BehaviorScoreRow.tsx`: add `value` + `onChange` props if not already wired.
- `components/display/ReportFooter.tsx`: use `Link` + trigger CSV download for today.
- `components/display/DisplayHeader.tsx`: gear link now points to `/settings`.

## Out of scope for Phase 4

- Cloud sync / auth / cross-device history — Phase 5.
- PDF export (CSV only for now).
- Historical schedule edits (changing schedule doesn't rewrite past sessions; they keep their original grade/teacher snapshot copied at write time — planned once backend lands).

## Acceptance

1. Tapping a behavior score during a class survives a page refresh and appears on `/reports`.
2. `/settings → General` changes take effect on the wall display without reload (alarm length, transition windows, behavior row visibility).
3. Alarm preview plays each of the four styles distinctly.
4. `/reports` filters by Today / Week / Month / Custom and matches the CSV export.
5. Data tab's "Reset entire app" returns to `/setup` with empty storage.
6. Gear icon on `/` now opens Settings, not the wizard.

