import { useEffect, useState } from "react";
import { devClock } from "@/lib/dev-clock";
import { cleanupMinutesFor, formatTime, toMinutes } from "@/lib/schedule";
import { DEFAULT_SETTINGS } from "@/lib/config-store";
import type { SchedulePeriod } from "@/lib/types";

function fmt(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function offsetLabel(ms: number) {
  if (ms === 0) return "real time";
  const sign = ms > 0 ? "+" : "-";
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  const s = Math.floor((abs % 60_000) / 1000);
  return `${sign}${h}h ${m}m ${s}s`;
}

// Set time to today at HH:MM local.
function jumpTo(h: number, m: number) {
  const target = new Date();
  target.setHours(h, m, 0, 0);
  devClock.setOffset(target.getTime() - Date.now());
}

function jumpToMinutes(totalMinutes: number) {
  jumpTo(Math.floor(totalMinutes / 60), totalMinutes % 60);
}

/**
 * Jump targets built from the schedule that's actually loaded, so every
 * boundary worth testing (clean-up, the bell) is one click away.
 */
function jumpTargets(periods: SchedulePeriod[]) {
  const targets: Array<{ label: string; minutes: number }> = [];
  for (const p of periods.slice(0, 3)) {
    const name = p.periodType === "class" ? (p.grade ?? "Class") : (p.dutyLabel ?? p.periodType);
    const start = toMinutes(p.startTime);
    const end = toMinutes(p.endTime);
    targets.push({ label: `${name} ${formatTime(p.startTime)}`, minutes: start });
    const lead = cleanupMinutesFor(p, DEFAULT_SETTINGS);
    if (lead > 0) {
      targets.push({ label: `${name} clean-up`, minutes: end - lead });
    }
    targets.push({ label: `${name} bell`, minutes: end });
  }
  return targets.slice(0, 8);
}

export function TimeScrubber({ periods = [] }: { periods?: SchedulePeriod[] }) {
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = devClock.subscribe(() => force((n) => n + 1));
    return () => {
      unsub();
    };
  }, []);
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 500);
    return () => window.clearInterval(id);
  }, []);

  if (!import.meta.env.DEV) return null;

  const now = devClock.now();
  const off = devClock.getOffset();
  const targets = jumpTargets(periods);

  return (
    <div className="fixed bottom-3 right-3 z-50 text-xs font-sans">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-md bg-navy text-white px-3 py-1.5 shadow-lg opacity-70 hover:opacity-100"
        >
          dev · {fmt(now)}
        </button>
      ) : (
        <div className="rounded-lg bg-navy text-white p-3 shadow-xl w-64">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold">Time scrubber</div>
            <button onClick={() => setOpen(false)} className="opacity-70 hover:opacity-100">
              ×
            </button>
          </div>
          <div className="mb-2">
            <div className="text-white/70">Simulated</div>
            <div className="text-lg font-bold tabular-nums">{fmt(now)}</div>
            <div className="text-white/60">{offsetLabel(off)}</div>
          </div>
          <div className="grid grid-cols-4 gap-1 mb-2">
            {[
              ["-1h", -3_600_000],
              ["-5m", -300_000],
              ["-30s", -30_000],
              ["-1s", -1000],
              ["+1s", 1000],
              ["+30s", 30_000],
              ["+5m", 300_000],
              ["+1h", 3_600_000],
            ].map(([label, delta]) => (
              <button
                key={label}
                onClick={() => devClock.adjust(delta as number)}
                className="rounded bg-white/10 hover:bg-white/20 py-1"
              >
                {label as string}
              </button>
            ))}
          </div>
          <button
            onClick={() => devClock.reset()}
            className="w-full rounded bg-gold text-navy font-semibold py-1 mb-2"
          >
            Reset to real time
          </button>
          <div className="text-white/70 mb-1">Jump to</div>
          {targets.length === 0 ? (
            <div className="text-white/50">No periods scheduled today.</div>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {targets.map((t) => (
                <button
                  key={t.label}
                  onClick={() => jumpToMinutes(t.minutes)}
                  className="truncate rounded bg-white/10 py-1 hover:bg-white/20"
                  title={t.label}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
