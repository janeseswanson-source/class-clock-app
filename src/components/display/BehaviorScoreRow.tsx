import { RATING_LABELS, type BehaviorScore } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BehaviorScoreRowProps {
  value?: BehaviorScore | null;
  onChange?: (score: BehaviorScore) => void;
  disabled?: boolean;
  hint?: string;
}

export function BehaviorScoreRow({
  value = null,
  onChange,
  disabled = false,
  hint = "Tap to score this class",
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
              onClick={() => onChange?.(n as BehaviorScore)}
              className={cn(
                "py-2 rounded-md text-sm font-semibold transition-colors",
                selected
                  ? "bg-gold text-white shadow-sm"
                  : "bg-muted text-navy hover:bg-gold-soft",
                disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-center text-xs font-semibold text-navy">
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
