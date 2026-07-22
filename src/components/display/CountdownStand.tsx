interface CountdownStandProps {
  hours: number;
  minutes: number;
  seconds: number;
  label?: string;
}

function DigitPair({ value }: { value: number }) {
  const str = String(value).padStart(2, "0");
  return (
    <div className="flex gap-1.5">
      {str.split("").map((d, i) => (
        <div
          key={i}
          className="w-11 h-14 md:w-14 md:h-20 rounded-md bg-white border border-navy/30 shadow-inner flex items-center justify-center text-navy font-extrabold text-3xl md:text-5xl tabular-nums"
        >
          {d}
        </div>
      ))}
    </div>
  );
}

export function CountdownStand({
  hours,
  minutes,
  seconds,
  label = "REMAINING",
}: CountdownStandProps) {
  return (
    <div className="relative inline-block">
      {/* neck connecting to clock */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-3 bg-navy rounded-t-sm" />
      <div className="rounded-2xl bg-white border-2 border-navy p-3 shadow-md">
        <div className="rounded-xl border-2 border-gold px-5 py-4">
          <div className="flex items-end gap-3">
            <div className="flex flex-col items-center">
              <DigitPair value={hours} />
              <span className="mt-1 text-[10px] md:text-xs font-semibold tracking-widest text-navy/60">
                HR
              </span>
            </div>
            <span className="text-3xl md:text-5xl font-extrabold text-navy pb-6">:</span>
            <div className="flex flex-col items-center">
              <DigitPair value={minutes} />
              <span className="mt-1 text-[10px] md:text-xs font-semibold tracking-widest text-navy/60">
                MIN
              </span>
            </div>
            <span className="text-3xl md:text-5xl font-extrabold text-navy pb-6">:</span>
            <div className="flex flex-col items-center">
              <DigitPair value={seconds} />
              <span className="mt-1 text-[10px] md:text-xs font-semibold tracking-widest text-navy/60">
                SEC
              </span>
            </div>
          </div>
          <div className="mt-2 text-center text-xs font-bold tracking-[0.3em] text-gold">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}
