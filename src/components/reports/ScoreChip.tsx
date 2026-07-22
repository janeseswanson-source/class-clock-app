import type { BehaviorScore } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLES: Record<BehaviorScore, string> = {
  5: "bg-[oklch(0.85_0.12_150)] text-[oklch(0.3_0.15_150)]",
  4: "bg-gold-soft text-navy",
  3: "bg-[oklch(0.92_0.08_80)] text-[oklch(0.4_0.15_60)]",
  2: "bg-[oklch(0.9_0.08_40)] text-[oklch(0.4_0.18_40)]",
  1: "bg-[oklch(0.88_0.12_25)] text-[oklch(0.4_0.2_25)]",
};

export function ScoreChip({ score }: { score: BehaviorScore | null | undefined }) {
  if (!score) {
    return (
      <span className="inline-flex items-center rounded-full bg-navy/5 px-2.5 py-0.5 text-xs font-bold text-navy/40">
        —
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
        STYLES[score],
      )}
    >
      {score}
    </span>
  );
}
