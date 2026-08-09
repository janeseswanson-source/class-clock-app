import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { addMinutes, formatTime, parseTimeInput, SNAP_MINUTES } from "@/lib/schedule";
import { cn } from "@/lib/utils";

interface TimeFieldProps {
  value: string; // "HH:mm"
  onChange: (next: string) => void;
  label: string; // accessible name, e.g. "Start time"
  invalid?: boolean;
  className?: string;
}

/**
 * Time entry that reads back as "9:45 AM" and accepts almost anything on the way
 * in — "945", "9:45", "9:45pm", "9". Replaces <input type="time">, which
 * discarded a partially-typed value and made teachers enter minutes first.
 *
 * The value only commits on blur or Enter, so nothing downstream reacts (or
 * reorders) while the field is mid-keystroke.
 */
export function TimeField({ value, onChange, label, invalid, className }: TimeFieldProps) {
  const [text, setText] = useState<string | null>(null);
  const [rejected, setRejected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rejectTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (rejectTimer.current) window.clearTimeout(rejectTimer.current);
    },
    [],
  );

  // While focused the raw text wins; otherwise show the canonical "9:45 AM".
  const display = text !== null ? text : formatTime(value);

  const commit = (raw: string) => {
    const parsed = parseTimeInput(raw);
    setText(null);
    if (parsed) {
      setRejected(false);
      if (parsed !== value) onChange(parsed);
      return;
    }
    // Unreadable — snap back to the last good time and flag the field briefly
    // rather than leaving a value behind that never got saved.
    setRejected(true);
    if (rejectTimer.current) window.clearTimeout(rejectTimer.current);
    rejectTimer.current = window.setTimeout(() => setRejected(false), 1500);
  };

  const step = (delta: number) => {
    setText(null);
    setRejected(false);
    onChange(addMinutes(value, delta));
  };

  return (
    <div className={cn("inline-flex items-stretch", className)}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        aria-label={label}
        aria-invalid={invalid || rejected || undefined}
        value={display}
        onFocus={(e) => {
          setText(formatTime(value));
          requestAnimationFrame(() => e.target.select());
        }}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit((e.target as HTMLInputElement).value);
            inputRef.current?.blur();
          } else if (e.key === "Escape") {
            setText(null);
            setRejected(false);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            step(SNAP_MINUTES);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            step(-SNAP_MINUTES);
          }
        }}
        className={cn(
          "w-[6.5rem] rounded-l-lg border-2 border-r-0 bg-white px-2.5 py-2 text-sm font-bold tabular-nums text-navy focus:outline-none",
          invalid || rejected
            ? "border-destructive"
            : "border-navy/15 focus:border-gold",
        )}
      />
      <div className="flex flex-col">
        <button
          type="button"
          tabIndex={-1}
          aria-label={`${label} plus ${SNAP_MINUTES} minutes`}
          onClick={() => step(SNAP_MINUTES)}
          className={cn(
            "flex h-1/2 w-6 items-center justify-center rounded-tr-lg border-2 border-b-0 bg-navy/5 text-navy hover:bg-navy/15",
            invalid || rejected ? "border-destructive" : "border-navy/15",
          )}
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label={`${label} minus ${SNAP_MINUTES} minutes`}
          onClick={() => step(-SNAP_MINUTES)}
          className={cn(
            "flex h-1/2 w-6 items-center justify-center rounded-br-lg border-2 bg-navy/5 text-navy hover:bg-navy/15",
            invalid || rejected ? "border-destructive" : "border-navy/15",
          )}
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
