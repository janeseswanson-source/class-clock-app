import { FlatDigit, FlipDigit } from "./FlipDigit";
import { cn } from "@/lib/utils";

interface CountdownStandProps {
  hours: number;
  minutes: number;
  seconds: number;
  intent?: "normal" | "cleanup" | "ended";
  label?: string;
}

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

export function CountdownStand({
  hours,
  minutes,
  seconds,
  intent = "normal",
  label,
}: CountdownStandProps) {
  const hs = pad(hours).split("");
  const ms = pad(minutes).split("");
  const ss = pad(seconds).split("");

  const autoLabel =
    intent === "cleanup" ? "CLEAN UP TIME" : intent === "ended" ? "PERIOD ENDED" : "REMAINING";
  const finalLabel = label ?? autoLabel;
  const labelColor =
    intent === "cleanup"
      ? "text-[oklch(0.55_0.18_25)]"
      : intent === "ended"
        ? "text-navy"
        : "text-gold";

  return (
    <div className="relative inline-block">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-3 bg-navy rounded-t-sm" />
      <div className="rounded-2xl bg-white border-2 border-navy p-3 shadow-md">
        <div className="rounded-xl border-2 border-gold px-5 py-4">
          <div className="flex items-end gap-3">
            <div className="flex flex-col items-center">
              <div className="flex gap-1.5">
                <FlipDigit value={hs[0]} intent={intent} />
                <FlipDigit value={hs[1]} intent={intent} />
              </div>
              <span className="mt-1 text-[10px] md:text-xs font-semibold tracking-widest text-navy/60">
                HR
              </span>
            </div>
            <span className="text-3xl md:text-5xl font-extrabold text-navy pb-6">:</span>
            <div className="flex flex-col items-center">
              <div className="flex gap-1.5">
                <FlipDigit value={ms[0]} intent={intent} />
                <FlipDigit value={ms[1]} intent={intent} />
              </div>
              <span className="mt-1 text-[10px] md:text-xs font-semibold tracking-widest text-navy/60">
                MIN
              </span>
            </div>
            <span className="text-3xl md:text-5xl font-extrabold text-navy pb-6">:</span>
            <div className="flex flex-col items-center">
              <div className="flex gap-1.5">
                <FlatDigit value={ss[0]} intent={intent} />
                <FlatDigit value={ss[1]} intent={intent} />
              </div>
              <span className="mt-1 text-[10px] md:text-xs font-semibold tracking-widest text-navy/60">
                SEC
              </span>
            </div>
          </div>
          <div
            className={cn(
              "mt-2 text-center text-xs font-bold tracking-[0.3em]",
              labelColor,
            )}
          >
            {finalLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
