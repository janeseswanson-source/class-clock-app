## Phase 2 — Live clock, countdown, flip animation, clean-up state, alarm

Make the display run against real time. Keep the mock schedule from Phase 1 as the data source (Phase 3 replaces it with localStorage).

### Time engine
- New `src/hooks/useNow.ts`: returns the current `Date`, updating every ~250ms via `setInterval`. Includes an optional dev time-offset so scrubbing works without touching real system time.
- New `src/lib/time.ts`: pure helpers — `parseHHMM`, `minutesFromMidnight(date)`, `findCurrentPeriod(periods, now)`, `nextPeriod(periods, now)`, `remainingMs(periodEnd, now)`. All operate on the mock Friday schedule for now; when the real day-of-week has no periods, fall back to Friday so the demo remains meaningful in Phase 2.
- New `src/lib/dev-clock.ts` (module singleton): holds an offset in ms. `useNow` reads it. Exposed globally as `window.__nsc` for the dev scrubber and unit poking.

### Scheduling / current-period logic
- Component-level derivation in `src/routes/index.tsx`:
  - `now = useNow()`
  - Compute `currentPeriod`, `nextPeriod`, past IDs, remaining time.
  - `transitionMs`: derived from mock settings (`sameGradeMin=5`, `gradeChangeMin=10`) by comparing `currentPeriod.grade` to `nextPeriod?.grade`. If next is recess/duty or grade differs, use grade-change window; else same-grade.
  - Status label: `Class in session` when a class is active and not in clean-up window; `CLEAN UP TIME` inside the transition window; `PERIOD ENDED` at zero for `alarmAutoOffSeconds`; `Between periods` when no period is active.

### Live analog clock
- `AnalogClock` already accepts h/m/s props — feed real values from `useNow`. No structural changes.

### Countdown stand with mechanical flip
- `CountdownStand` becomes live and animates.
  - Hours and minutes digits flip via a real CSS 3D flip on value change.
  - Seconds render flat/instant — explicitly no flip (per brief, ghosting bug).
  - Implementation: a small `FlipDigit` component (each digit) that keeps `prev` and `current`, triggers a `.flipping` class on change for ~450ms, then swaps. Uses `perspective`, two stacked halves (top/bottom) with `rotateX`. Seconds use a plain `<div>` — no wrapper.
  - New keyframes added to `src/styles.css` (`@keyframes flip-top` / `flip-bottom`) since Tailwind's built-in animations don't cover this.
- Clean-up flash: when `remaining <= transitionMs` and `remaining > 0` and current is a class period, the digit cells switch to a soft coral background and label reads `CLEAN UP TIME` (gold → coral). Pass an `intent: "normal" | "cleanup" | "ended"` prop to `CountdownStand`.
- Period ended: at zero, label reads `PERIOD ENDED`, digits show `00:00:00`, cells go navy-tinted.

### Alarm
- New `src/lib/alarm.ts`: uses Web Audio API to synthesize a short chime (no asset needed) — plays a 3-note motif then silences. Auto-stops after `alarmAutoOffSeconds` (default 6). No user interaction to stop.
- Wired from `index.tsx` via a `useEffect` watching current-period id: when the previous current transitions to null/next (i.e., a class just ended), fire the alarm once. Track `lastEndedPeriodId` in a ref to avoid re-firing across renders.

### Dev scrubber
- New `src/components/dev/TimeScrubber.tsx`: fixed bottom-right panel, only rendered when `import.meta.env.DEV`. Controls:
  - Buttons: `−1h`, `−5m`, `−30s`, `Now`, `+30s`, `+5m`, `+1h`.
  - Text: current simulated time + offset readout.
  - Jump-to-period buttons: `Kinder start`, `1st clean-up`, `1st end` (fires alarm), `2nd start`.
- Sets/reads the offset via `dev-clock`. Not shown in production build.

### Files
- new: `src/hooks/useNow.ts`, `src/lib/time.ts`, `src/lib/dev-clock.ts`, `src/lib/alarm.ts`, `src/components/dev/TimeScrubber.tsx`, `src/components/display/FlipDigit.tsx`
- edit: `src/components/display/CountdownStand.tsx` (accept `intent`, use `FlipDigit` for h/m, flat for s), `src/routes/index.tsx` (wire live state + scrubber + alarm effect), `src/styles.css` (flip keyframes + `.cleanup` cell color utility)

### Out of scope (later phases)
- Persisting settings / schedule to localStorage (Phase 3).
- Real alarm sound style selection (uses synthesized chime here; Phase 3 setup adds preview + choice; Phase 4 settings edits it).
- Behavior score persistence across period boundaries (still component-local until Phase 3).
- Rolling over to the next day / holidays (not in v1).

### Technical notes
- The flip animation is the classic split-flap: two absolutely-positioned halves per digit, top half rotates from 0→-90° with old value, bottom half rotates from 90°→0° with new value. `will-change: transform`, `backface-visibility: hidden`. Duration 400ms, ease-in for top, ease-out for bottom, so it looks mechanical.
- Seconds render as a plain digit inside the same cell so the visual grid stays uniform.
- `useNow` uses `setInterval(250)` so seconds update visibly and flip triggers on minute change are captured within a frame of the boundary.
- Alarm uses `AudioContext` created on first user gesture-fallback: attempt on demand; if `state === "suspended"`, still schedule the stop timeout so `PERIOD ENDED` label lifecycle is correct even when audio is blocked.
