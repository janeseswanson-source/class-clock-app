## Phase 1 — Static main display

Build the classroom wall display shown in reference image 01 with hardcoded mock data (Art Class · Ms. Ferguson, full Friday schedule: Kinder, 1st, Recess, 2nd, 3rd, 4th, 5th). No live logic — just pixel-faithful layout and components. Design system (navy #1E3A5F, gold #C9A227, coral #F6A5A5, off-white surface, rounded-2xl cards, geometric sans, navy heart accent) is set up globally so later phases inherit it.

### Design system setup
- `src/styles.css`: add semantic tokens (`--navy`, `--gold`, `--coral`, `--surface`, `--muted-past`) in oklch, map through `@theme inline` so `bg-navy`, `text-gold`, etc. work. Keep shadcn tokens intact.
- Load Inter (or similar geometric sans) via `<link>` in `__root.tsx` head; register `--font-sans` in theme.
- Update `__root.tsx` head metadata: title "Next Specials Timer", proper description, og tags.

### Route
- Replace `src/routes/index.tsx` placeholder with the main display page. Own head() with title "Next Specials Timer — Art Class" and description.

### Mock data (Phase-1-local, no storage yet)
- `src/lib/mock-schedule.ts`: exports one `TimerInstance` (subject "Art Class", teacher "Ms. Ferguson"), an array of today's periods matching image 01 (Kinder 8:00–8:40 past, 1st 8:45–9:25 current, Recess 9:25–9:40, 2nd 9:40–10:20, 3rd 10:25–11:05, 4th 11:10–11:50, 5th 1:00–1:40). Types match the DATA MODEL in the brief so Phase 3 can reuse them.

### Components (`src/components/display/`)
- `DisplayHeader.tsx` — small "Next Specials Class" logo/wordmark left, large "ART CLASS" title + date right, gear icon top corner (non-functional).
- `AnalogClock.tsx` — SVG clock: white face, navy arabic numerals 1–12, navy hour/minute hands, gold second hand (matches 01), tick marks, small navy heart near 6. Hands rotated from a static prop time (real time comes in Phase 2). Sized large.
- `CountdownStand.tsx` — white panel visually attached under the clock, navy border + inner gold ring, three digit-pair cells for HR / MIN / SEC with small caps labels, "REMAINING" gold label underneath. Static value 00:39:59. Each digit rendered in its own rounded cell (flip-clock look, but static in Phase 1).
- `StatusPill.tsx` — "Class in session" gold pill under the countdown; "TODAY'S CLASSES" section label below it.
- `ScheduleList.tsx` — vertical stack of period cards.
- `ClassCard.tsx` — variants:
  - `past`: small, muted gray, no border, condensed (time / grade / teacher / room).
  - `current`: white card with navy border, thick blue left arrow marker, large time range (gold), grade, **large** classroom teacher name (nearly as big as grade, bigger than room), room number, and the 1–5 score row.
  - `upcoming`: white card, subtle border, same content, score row with "Tap to score this class".
  - `recess`: gold-tinted background, gold border, gold time + label, no score row, no teacher.
  - `duty`: similar to class but with duty label instead of grade/teacher (used later — supported by type now).
- `BehaviorScoreRow.tsx` — five buttons 1–5, rounded, selecting one highlights it in gold and shows the rating label (5 Outstanding, 4 Super, 3 Needs improvement, 2 Below expectations, 1 Unsatisfactory) underneath. Local `useState` only.
- `ReportFooter.tsx` — "Today's behavior report" text left, two outline buttons right: "Google Doc" and "PDF" (non-functional).

### Layout
Matches image 01: outer page has soft off-white background and a large white card with a navy border and outer gold ring (double-border effect). Inside: header row, gold divider, then a centered column containing clock → countdown → status pill → schedule list → report footer. Optimized for large landscape display; responsive down to tablet/desktop.

### Files created / edited
- edit: `src/styles.css`, `src/routes/__root.tsx`, `src/routes/index.tsx`
- new: `src/lib/mock-schedule.ts`, `src/lib/types.ts` (data-model types), `src/components/display/*` (components above)

### Out of scope for Phase 1
Live clock, real countdown, flip animation, clean-up flash, alarm, settings page, setup wizard, localStorage persistence, report generation, Scheduler Ops fork. All arrive in later phases; component APIs are shaped to accept live props then.

### Technical notes
- Types in `src/lib/types.ts` mirror the Supabase-shaped model from the brief so Phase 3 can wire storage without refactoring components.
- Score state stays local in `ClassCard` for now; Phase 2/3 lifts it to a storage hook.
- Clock is pure SVG so scaling to a TV stays crisp.
