import { RATING_LABELS, type BehaviorScore } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BehaviorScoreRowProps {
  value?: BehaviorScore | null;
  onChange?: (score: BehaviorScore) => void;
  disabled?: boolean;
  hint?: string;
  /** Smaller buttons, for finished periods scored after the fact. */
  compact?: boolean;
}

export function BehaviorScoreRow({
  value = null,
  onChange,
  disabled = false,
  hint = "Tap to score this class",
  compact = false,
}: BehaviorScoreRowProps) {
  const label = value ? RATING_LABELS[value] : null;

  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={`${n} — ${RATING_LABELS[n as BehaviorScore]}`}
              onClick={() => onChange?.(n as BehaviorScore)}
              className={cn(
                "rounded-md font-semibold transition-colors",
                compact ? "min-h-9 text-sm md:min-h-0 md:py-1 md:text-xs" : "min-h-11 text-base md:min-h-0 md:py-2 md:text-sm",
                selected
                  ? "bg-gold text-white shadow-sm"
                  : "bg-muted text-navy hover:bg-gold-soft",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div
        className={cn(
          "mt-2 text-center font-semibold text-navy",
          compact ? "text-xs md:text-[11px]" : "text-sm md:text-xs",
        )}
      >
        {label ? (
          <span>
            <span className="text-gold">{value}</span> {label}
          </span>
        ) : (
          <span className="text-navy/50">{hint}</span>
        )}
      </div>
    </div>
  );
}
