## Phase 5 — Backend & multi-device sync

Move the app off localStorage onto Lovable Cloud so a teacher can sign in, have their schedule and behavior scores persist across devices, and (optionally) share a read-only wall display.

### 1. Enable Lovable Cloud + auth

- Enable Lovable Cloud (Postgres + Auth).
- Add email/password sign-in at `/auth` (magic-link optional later). No Google unless you ask.
- Add a pathless `_authenticated/` layout so the wall display, setup wizard, settings, and reports all require login. `/auth` and a public read-only `/wall/:shareId` (see §5) stay public.

### 2. Schema

Tables (all with RLS, `owner_id uuid references auth.users`):

- `profiles` — `id`, `display_name`, `subject_title`, `settings jsonb` (alarm style, transition minutes, behavior scoring toggle, alarm length).
- `schedule_periods` — one row per weekly period: `day_of_week`, `start_time`, `end_time`, `period_type` (`class` / `recess` / `duty`), `grade`, `teacher_name`, `room`, `duty_label`, `sort_order`.
- `sessions` — actual class occurrences with scores: `date`, `schedule_period_id`, `behavior_score` (1–5), `notes`, unique on (`owner_id`, `date`, `schedule_period_id`).
- `share_links` — `id` (public slug), `owner_id`, `enabled`, `created_at` — for the read-only display URL.

RLS: each owner sees/writes only their own rows. `share_links` gets a narrow `TO anon` SELECT for enabled rows; the wall data fetched via that slug goes through a server function using a publishable-key client that joins on the slug.

### 3. Data layer refactor

- Replace `config-store.ts` / `session-store.ts` localStorage code with TanStack Query hooks backed by `createServerFn` calls (`getMyConfig`, `saveMyConfig`, `getSessions(range)`, `upsertSession`, `updateSettings`).
- One-time migration on first sign-in: if `localStorage` has a config, push it to the server, then clear it. This preserves work done in Phases 3–4.
- Reports page switches to server queries with the same Today/Week/Month/Custom filters and CSV export.

### 4. Wall display

- `/` (protected) reads the signed-in teacher's config + today's sessions from the server, keeps the same live clock/countdown/flip logic from Phase 2.
- Behavior score writes go through `upsertSession` and invalidate the day's session query.

### 5. Shareable read-only display (optional but valuable)

- Settings → "Sharing" tab: generate/disable a public link `/wall/<slug>`.
- `/wall/$slug` is a public route; loader calls a public server fn that returns the owner's schedule + today's sessions for that slug only (no PII beyond subject title + teacher names already shown on the wall).
- Read-only: no score buttons, no gear, no export.

### 6. Housekeeping

- Delete localStorage stores and dev-only seeding paths once the server is the source of truth (keep the dev time-scrubber — it's client-only).
- Add a "Sign out" item to the header menu.
- Update settings Data tab: "Export all my data (CSV)" now runs server-side over the full history; "Reset" deletes the owner's rows (with confirm).

### Technical notes

- Stack: TanStack Start server functions with `requireSupabaseAuth`; `supabaseAdmin` only for the one-time migration if needed. Public share endpoint uses a publishable-key server client + narrow anon policy.
- All schema created in one migration with `GRANT` blocks and RLS policies per project rules.
- No edge functions.

### Questions before I build

1. **Auth method** — email/password only, or do you also want magic-link / Google?
2. **Shareable read-only display** — build it now, or skip for Phase 5?
3. **Existing localStorage data** — auto-migrate on first sign-in, or start fresh?
