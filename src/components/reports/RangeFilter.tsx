import type { RangeKey } from "@/lib/date-ranges";

interface RangeFilterProps {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
  custom: { from: string; to: string };
  onCustomChange: (r: { from: string; to: string }) => void;
}

const CHIPS: Array<{ id: RangeKey; label: string }> = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "all", label: "All time" },
  { id: "custom", label: "Custom" },
];

export function RangeFilter({ value, onChange, custom, onCustomChange }: RangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {CHIPS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
            value === c.id
              ? "bg-navy text-white"
              : "bg-navy/5 text-navy hover:bg-navy/10"
          }`}
        >
          {c.label}
        </button>
      ))}
      {value === "custom" ? (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            value={custom.from}
            onChange={(e) => onCustomChange({ ...custom, from: e.target.value })}
            className="rounded-lg border-2 border-navy/15 px-2 py-1 text-sm text-navy focus:border-gold focus:outline-none"
          />
          <span className="text-navy/40">–</span>
          <input
            type="date"
            value={custom.to}
            onChange={(e) => onCustomChange({ ...custom, to: e.target.value })}
            className="rounded-lg border-2 border-navy/15 px-2 py-1 text-sm text-navy focus:border-gold focus:outline-none"
          />
        </div>
      ) : null}
    </div>
  );
}
