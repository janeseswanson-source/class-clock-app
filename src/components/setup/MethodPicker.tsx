import type { SetupMethod } from "@/lib/types";
import { CalendarDays, Sparkles } from "lucide-react";

interface MethodPickerProps {
  value: SetupMethod;
  onChange: (m: SetupMethod) => void;
}

const OPTIONS: Array<{
  id: SetupMethod;
  title: string;
  desc: string;
  icon: typeof CalendarDays;
}> = [
  {
    id: "manual",
    title: "Build it manually",
    desc: "Enter your weekly schedule period by period. Best if your schedule is stable.",
    icon: CalendarDays,
  },
  {
    id: "scheduler_ops",
    title: "Upload a file — AI reads it for you",
    desc: "A CSV, PDF, plain text, or even a photo of a printed schedule — we'll extract the periods automatically.",
    icon: Sparkles,
  },
];

export function MethodPicker({ value, onChange }: MethodPickerProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`text-left rounded-2xl border-2 p-5 transition-colors ${
              selected
                ? "border-gold bg-gold-soft"
                : "border-navy/15 bg-white hover:border-navy/40"
            }`}
          >
            <div
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${
                selected ? "bg-navy text-white" : "bg-navy/5 text-navy"
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="mt-3 text-lg font-black text-navy">{opt.title}</div>
            <div className="mt-1 text-sm text-navy/70">{opt.desc}</div>
          </button>
        );
      })}
    </div>
  );
}
