# Class Timer Pro

How to use this: Lovable builds best incrementally. Paste Phase 1 as your first message and attach reference images 01–09 so it can match the visual design. Once each phase looks right, paste the next one. If you'd rather send it all at once, paste the whole file — but expect to iterate on the clock and countdown either way, since those are the trickiest pieces.

The CONTEXT, DESIGN SYSTEM, and ASSUMPTIONS sections apply to every phase — keep them at the top of your first message.

CONTEXT (include in first message)

You are building Next Specials Timer, a wall-display web app for K–6 specialist teachers (art, music, PE, library, computer lab) who run back-to-back classes on a fixed daily schedule. The app is a single large screen mounted on a classroom TV or projector. It shows a real analog clock, a digital countdown to the end of the current period, the full day's schedule with the current period marked, and an optional 1–5 behavior score built into each class card. A one-time setup at the start of the year builds the weekly schedule.

Primary user: a specialist teacher. The display must read clearly from across a classroom, so type is large, contrast is high, and the current period is obvious at a glance.

Stack: use your default (React + Vite + Tailwind + shadcn/ui). For now, persist all data in localStorage, with no authentication — this is a UX validation build and the backend is intentionally not designed yet. Keep data access behind a small typed storage module so it can be swapped for Supabase later without touching components.

Nine reference images are attached (01–09). Treat them as the source of truth for layout, color, and component style. Where this text and an image disagree, ask me — don't silently pick one.

DESIGN SYSTEM (include in first message)

Palette

Primary navy: deep navy #1E3A5F (numerals, hands, headings, current-period arrow)

Gold accent: #C9A227 (recess treatment, ring accents, small highlights)

Surface: white #FFFFFF cards on a soft off-white/very-light-navy page background

Alert: soft coral/pink #F6A5A5 for the clean-up flash state

Muted gray for past/finished periods

Feel: clean, friendly, elementary-school-appropriate but not childish — rounded cards (~rounded-2xl), soft shadows, generous spacing, large readable type. A small navy heart mark appears as a brand accent (near 6 o'clock on the clock face).

Typography: a clear geometric sans. Numbers everywhere should be large and legible from a distance. The subject title (e.g. ART CLASS) is the largest text on screen.

Fully responsive, but optimize for a large landscape display (classroom TV) first; a tablet/desktop fallback is fine.

GLOBAL ASSUMPTIONS I'm making (override any of these)

These resolve open questions from the brief so you can build without guessing. Each is a deliberate v1 choice, not a locked decision:

Scheduler Ops path is stubbed. "Scheduler Ops Builder" doesn't exist yet. Build the fork screen with both options, but the "Connect Scheduler Ops" button shows a "Coming soon — set up manually for now" state. Build the manual path fully.

Transition windows are global, not per-transition — one same-grade value and one grade-change value for the whole week.

Manual entry helpers ship in v1: include a "Copy this day to…" control and paste-from-spreadsheet (tab-separated rows) into the schedule table, since a full week can be ~30 rows.

Report export: the PDF and Google Doc buttons produce a simple table (each scored class, its grade, classroom teacher, time, and score + rating label). PDF via a client library; "Google Doc" can export a .docx/formatted download for now.

Settings access: a gear icon on the main display opens the settings page.

One timer instance per teacher, persisted so it reloads on the same device.

Offline-first: countdown and behavior scoring run entirely client-side and keep working without a network.

Score edits are tracked: store an edited flag + timestamp whenever a score is changed after first being set.

DATA MODEL (localStorage now, Supabase-shaped for later)

ts

TimerInstance      // one per teacher/display
  subjectTitle     // e.g. "Art Class" — permanent screen headline
  teacherName
  setupMethod      // "manual" | "scheduler_ops"

SchedulePeriod     // a recurring weekly slot
  dayOfWeek        // 1–5
  startTime        // "HH:mm"
  endTime
  periodType       // "class" | "duty"
  grade            // class only
  classroomTeacher // class only
  roomNumber       // class only
  dutyLabel        // duty only

ClassSession       // a SchedulePeriod on a specific date
  date
  schedulePeriodId
  behaviorScore    // 1–5 | null
  ratingLabel      // derived: 5 Outstanding, 4 Super, 3 Needs improvement,
                   //          2 Below expectations, 1 Unsatisfactory
  scoreLoggedAt
  edited           // boolean

TimerSettings      // per instance
  alarmStyle              // "chime" | "buzzer" | "bell" | "soft_tone"
  alarmAutoOffSeconds     // default 6, range 2–15
  transitionSameGradeMin  // default 5
  transitionGradeChangeMin// default 10
  behaviorScoringEnabled  // default true

Recess is a SchedulePeriod too — treat it as a class-type period whose grade/label marks it as recess (or add "recess" to periodType if cleaner), so it can get its own gold styling.

PHASE 1 — Main display (static, mock data)

Build the main wall display exactly like 01_main_display.png, using hardcoded mock data (one teacher, one full day of ~6 classes + recess + a duty). No live logic yet — just the layout and components.

Header: large subject title (e.g. ART CLASS) with the teacher's name beneath it. A small gear icon in a top corner (opens Settings, wired later).

Left/main area — clock + countdown:

A large analog clock: white face, arabic numerals in navy, navy hour/minute/ second hands, a small navy heart accent near the 6. Render it as SVG or CSS with hands rotated by transform: rotate() from the current time. It must be crisp and large.

Directly beneath, visually attached like a base, a digital countdown "stand": a white panel with a navy/gold ring border (not a black LED box). It shows hours : minutes : seconds, each digit group in its own cell with a small label (HOURS / MIN / SEC). For now show a static value like 00 : 23 : 47.

Right area — the day's schedule (one card per period, top to bottom):

Each class card shows: time range (start–end), grade (prominent), classroom teacher's name (large — nearly as prominent as the grade, bigger than the room number), and room number.

The current period is marked with a thick blue arrow on its left (not a filled highlight block).

Recess is a gold-bordered, gold-tinted card, visually distinct from classes and duties.

Past/finished periods are smaller, muted gray, and de-emphasized (no border) so the eye lands on current + upcoming.

Each class card contains a 1–5 behavior score control built into the card (five buttons). Selecting a number shows its named level underneath (5 Outstanding, 4 Super, 3 Needs improvement, 2 Below expectations, 1 Unsatisfactory). For this phase the buttons just set local component state.

Bottom — "Today's behavior report": a small section with two buttons, Download as Google Doc and Download as PDF (non-functional in this phase).

Match spacing, card style, and color to 01. Make it look finished and demo-ready before moving on.

PHASE 2 — Live clock, countdown, and end-of-period behavior

Make the display run.

The analog clock shows the real current time, updating every second.

The countdown shows time remaining in the current period (derived from the mock schedule vs. now), updating every second, and the "current period" arrow follows the clock through the day.

Flip animation: the minutes and hours cells flip mechanically (a real CSS 3D flip, like a mechanical flip clock) when their value changes. Seconds do NOT flip — they update flat/instantly. (Flipping every second caused a ghosting/double-image bug; keeping seconds flat is intentional — do not animate them.)

Clean-up state: when remaining time drops into the transition window (see settings), the countdown cells flash soft coral/pink and the label changes to CLEAN UP TIME. The window used depends on whether the next period is the same grade (transitionSameGradeMin, default 5) or a different grade (transitionGradeChangeMin, default 10).

At zero: label shows PERIOD ENDED and an alarm sound plays, then auto-silences after alarmAutoOffSeconds (default 6). The teacher should never have to walk over to stop it. Then advance to the next period.

Provide a small dev-only way to fast-forward/scrub time so this is testable without waiting for real class boundaries.

PHASE 3 — Setup flow (writes to localStorage)

A one-time wizard that builds the schedule. Match images 04–09.

Fork screen (04): two large option cards — Connect Scheduler Ops (stubbed: "Coming soon") and Set up manually (active).

Manual intro (05): pick a specialist subject (Art, Music, PE, Library, Computer lab, Other) and enter the teacher's name. This becomes the permanent screen title.

Weekly schedule table (06, 07): for each weekday, add class rows (grade, start, end, classroom teacher, room) and duty rows (start, end, label — no grade/teacher). A day can have zero, one, or multiple duty slots (see 07 — two duties stacked on one day). Each row independently removable via an X. "Add class" / "Add duty" per day, no limit. Include the "Copy this day to…" helper and paste-from-spreadsheet support noted in the assumptions.

Alarm & transition timing (08): alarm style (chime / buzzer / school bell / soft tone, with preview), alarm auto-off seconds (default 6, 2–15), same-grade transition minutes (default 5), grade-change transition minutes (default 10) — the two transition values independent of each other.

Confirm & launch (09): review summary, then Launch my timer → saves the instance + settings + schedule to localStorage and routes to the main display, which now runs on real entered data.

No calendar/holiday step — intentionally omitted.

PHASE 4 — Settings page + report export

Settings page reachable from the gear icon (02, 03): edit alarm style, auto-off seconds, both transition windows, and a Behavior scoring on/off toggle. When scoring is off, the rubric explanation/example content dims but stays visible (so a teacher can preview scoring before enabling it) — match 02 (on) and 03 (off). Also allow editing individual schedule rows here without redoing full setup.

Report export: wire the two buttons under the schedule. Generate a report of every scored class for the day — grade, classroom teacher, time, score, and rating label. PDF via a client-side library; Google Doc as a formatted .docx/download for now. (Exact document layout is open — a clean table is fine for v1.)

PHASE 5 — Later, not now (do NOT build yet)

Note for planning only: a future phase adds Supabase persistence + teacher auth, real Scheduler Ops Builder import, multi-device/traveling-specialist support, and a finalized export document layout. Keep Phase 1–4 code structured so this slots in cleanly (storage module abstraction, typed data model), but build none of it now.

THINGS TO GET RIGHT (common failure points)

Seconds must not flip. Only minutes and hours animate.

Current period = arrow, not a filled highlight.

Classroom teacher name is large — nearly as prominent as the grade.

Recess is gold; past periods shrink and fade.

Alarm auto-silences — never require walking to the screen.

Manual setup is a first-class, complete path, not a fallback — it must comfortably handle ~6 classes/day across 5 days plus duties.

Read clearly from across a room — favor size and contrast over density.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://class-clock-app.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/824e4b30-4453-4064-8864-96499d58c772).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
