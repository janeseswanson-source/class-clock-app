import { useEffect, useState } from "react";
import { devClock } from "@/lib/dev-clock";

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

export function TimeScrubber() {
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => devClock.subscribe(() => force((n) => n + 1)), []);
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 500);
    return () => window.clearInterval(id);
  }, []);

  if (!import.meta.env.DEV) return null;

  const now = devClock.now();
  const off = devClock.getOffset();

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
          <div className="grid grid-cols-2 gap-1">
            <button onClick={() => jumpTo(8, 0)} className="rounded bg-white/10 hover:bg-white/20 py-1">
              Kinder 8:00
            </button>
            <button onClick={() => jumpTo(8, 45)} className="rounded bg-white/10 hover:bg-white/20 py-1">
              1st 8:45
            </button>
            <button onClick={() => jumpTo(9, 22)} className="rounded bg-white/10 hover:bg-white/20 py-1">
              1st clean-up
            </button>
            <button onClick={() => jumpTo(9, 25)} className="rounded bg-white/10 hover:bg-white/20 py-1">
              1st end (alarm)
            </button>
            <button onClick={() => jumpTo(9, 40)} className="rounded bg-white/10 hover:bg-white/20 py-1">
              2nd 9:40
            </button>
            <button onClick={() => jumpTo(13, 0)} className="rounded bg-white/10 hover:bg-white/20 py-1">
              5th 1:00 PM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
