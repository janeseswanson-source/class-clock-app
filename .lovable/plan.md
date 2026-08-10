# Fix: published site shows "This page didn't load"

## What's actually happening

The published site is not broken on the server — it returns a normal page (HTTP 200, correct title and styles). It breaks in the browser a split second later, and the screen you see is the app's own error fallback.

Cause, confirmed by inspecting the live JavaScript bundle: the backend URL and key are **not** baked into the published build. The app tries to create its backend client, finds no configuration, throws "Missing backend environment variable(s)", and the error boundary paints "This page didn't load".

Why it changed: the recent Claude Code update added `.env` to `.gitignore` (with a note that it "was previously committed with real keys; now local-only"). The Lovable preview still works because that file physically exists in the preview workspace. The published build is produced from the repository, where `.env` no longer exists — so the browser-facing `VITE_*` values get replaced with nothing.

Evidence:
- Live HTML at the published URL: 200 OK, fully rendered head.
- Live client bundle: zero occurrences of the project's backend URL; the only `sb_publishable_` strings are prefix-check literals in library code, not a real key.
- Bundle still contains the "Missing … environment variable(s)" error path.

## The fix

1. Stop ignoring `.env` so the build can see the browser-facing config again.
   - Remove the `.env` entry (and its comment) from `.gitignore`, restoring `.env` to the repo.
   - Important distinction: the `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` values in `.env` are **publishable** — they are designed to ship inside the browser bundle and are protected by row-level security. They are not secrets. The genuinely private values (service role key, Anthropic key) live in the managed secret store, not in `.env`, so nothing sensitive is exposed by tracking this file.

2. Make the failure non-fatal so this class of misconfiguration never blanks the whole app again.
   - In the root error boundary path, keep the current fallback, but have the backend client surface a clear, specific message ("Backend configuration missing") instead of a generic crash, so the next occurrence is diagnosable from the screen itself.

3. Republish, then verify against the live URL (not the preview):
   - The published bundle must contain the real backend URL.
   - Loading the site in a clean incognito window must land on the sign-in screen rather than the error page.

## Technical notes

- Files touched: `.gitignore` (remove `.env` ignore). Optionally a small message tweak in the generated client's error path is *not* possible — `src/integrations/supabase/client.ts` is auto-generated and must not be edited — so step 2 will instead be handled in `src/routes/__root.tsx`'s error component, which can detect a configuration error and show a targeted message.
- No changes to routes, SSR wrapper (`src/server.ts`), or auth flow — those are all working; `/` and `/auth` both return 200 from the server today.
- Verification method: fetch the published asset bundle and grep for the backend host, plus a browser check of the live URL.
