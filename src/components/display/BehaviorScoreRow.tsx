import { useState } from "react";
import { RATING_LABELS, type BehaviorScore } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BehaviorScoreRowProps {
  initial?: BehaviorScore | null;
  disabled?: boolean;
  hint?: string;
}

export function BehaviorScoreRow({
  initial = null,
  disabled = false,
  hint = "Tap to score this class",
}: BehaviorScoreRowProps) {
  const [score, setScore] = useState<BehaviorScore | null>(initial);
  const label = score ? RATING_LABELS[score] : null;

  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = score === n;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => setScore(n as BehaviorScore)}
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
            <span className="text-gold">{score}</span> {label}
          </span>
        ) : (
          <span className="text-navy/50">{hint}</span>
        )}
      </div>
    </div>
  );
}
