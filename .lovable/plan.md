# Mobile polish for the wall display

The display is tuned for a mounted TV, so on a phone several things read too small: the countdown digit stand shrinks to its tightest size, class times/labels sit at 12–14px, the header brand block competes with the icon buttons, and the behavior score buttons are below a comfortable tap size.

## What changes

**Countdown stand**
- Scale digits, colons and HR/MIN/SEC captions up on phones instead of down; the stand becomes a full-width block rather than a shrunken inline card.
- Keep the mechanical flip on hours/minutes and flat seconds exactly as they are.

**Clock**
- Slightly smaller analog clock on phones so the countdown (the thing people actually read) gets the space.

**Class cards**
- Bump the base sizes on mobile: time range and room from 12px to 14–15px, grade/teacher lines to a larger step, past-period text no longer drops to 12px.
- Move the "Clean up 10:25" chip below the time on narrow screens so the top row never squeezes.
- Slightly more vertical padding for readability.

**Behavior score row**
- Score buttons become a 5-across grid with a minimum 44px touch target on mobile, larger numerals, and the hint text sized up.

**Header**
- Two-line stacked layout on mobile: brand + date on top, subject/teacher below, action icons in a right-aligned row with proper touch targets (grid + min-w-0 + shrink-0 so nothing clips).
- Wall-mode (fullscreen) button hidden on phones where it isn't useful; settings, reports and sign-out stay.

**Page chrome**
- Reduce outer padding on phones so content isn't boxed into a narrow column, and tighten the nested rounded frames.
- Status pill and the "tap to enable alarms" banner sized up to match.

**Report footer / other routes**
- Footer buttons become full-width stacked on mobile with larger labels. Setup, settings and reports get a quick pass for the same minimum text size and tap-target rules — no layout or logic redesign there.

## Notes

- Purely presentational: no changes to schedule logic, alarms, scoring persistence, or backend.
- Sizes use responsive Tailwind steps (mobile-first base, `md:`/`xl:` for the TV layout) so the desktop/wall appearance stays as it is today.
