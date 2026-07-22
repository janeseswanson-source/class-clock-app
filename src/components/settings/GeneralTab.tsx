import { Play } from "lucide-react";
import type { AlarmStyle, TimerSettings } from "@/lib/types";
import { playAlarm } from "@/lib/alarm";

const ALARM_OPTIONS: Array<{ id: AlarmStyle; label: string; desc: string }> = [
  { id: "chime", label: "Chime", desc: "Three-note bright sine tones" },
  { id: "bell", label: "Bell", desc: "Higher, ringing triangle tones" },
  { id: "buzzer", label: "Buzzer", desc: "Low, square-wave alert" },
  { id: "soft_tone", label: "Soft tone", desc: "Gentle two-note pulse" },
];

interface GeneralTabProps {
  settings: TimerSettings;
  onChange: (patch: Partial<TimerSettings>) => void;
}

export function GeneralTab({ settings, onChange }: GeneralTabProps) {
  return (
    <div className="space-y-8">
      <section>
        <SectionTitle>Alarm sound</SectionTitle>
        <div className="grid gap-2 md:grid-cols-2">
          {ALARM_OPTIONS.map((opt) => {
            const selected = settings.alarmStyle === opt.id;
            return (
              <div
                key={opt.id}
                className={`rounded-xl border-2 p-3 flex items-center gap-3 ${
                  selected ? "border-gold bg-gold-soft" : "border-navy/15 bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onChange({ alarmStyle: opt.id })}
                  className="flex-1 text-left"
                >
                  <div className="text-sm font-bold text-navy">{opt.label}</div>
                  <div className="text-xs text-navy/60">{opt.desc}</div>
                </button>
                <button
                  type="button"
                  onClick={() => playAlarm(2, opt.id)}
                  className="rounded-full p-2 text-navy hover:bg-navy/10"
                  aria-label={`Preview ${opt.label}`}
                >
                  <Play className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <SliderRow
        label="Alarm auto-off"
        suffix="seconds"
        min={2}
        max={15}
        value={settings.alarmAutoOffSeconds}
        onChange={(v) => onChange({ alarmAutoOffSeconds: v })}
      />

      <SliderRow
        label="Transition — same grade"
        suffix="min"
        min={1}
        max={10}
        value={settings.transitionSameGradeMin}
        onChange={(v) => onChange({ transitionSameGradeMin: v })}
        help="Clean-up window when the next class is the same grade."
      />

      <SliderRow
        label="Transition — different grade"
        suffix="min"
        min={1}
        max={15}
        value={settings.transitionGradeChangeMin}
        onChange={(v) => onChange({ transitionGradeChangeMin: v })}
        help="Clean-up window when the next class is a different grade."
      />

      <section className="flex items-center justify-between rounded-xl border-2 border-navy/10 bg-white p-4">
        <div>
          <div className="text-sm font-bold text-navy">Behavior scoring</div>
          <div className="text-xs text-navy/60">
            Show the 1–5 score row during class periods.
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.behaviorScoringEnabled}
          onClick={() => onChange({ behaviorScoringEnabled: !settings.behaviorScoringEnabled })}
          className={`relative h-7 w-12 rounded-full transition-colors ${
            settings.behaviorScoringEnabled ? "bg-navy" : "bg-navy/20"
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
              settings.behaviorScoringEnabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-bold tracking-[0.2em] text-navy/60 mb-3">
      {String(children).toUpperCase()}
    </div>
  );
}

function SliderRow({
  label,
  suffix,
  min,
  max,
  value,
  onChange,
  help,
}: {
  label: string;
  suffix: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  help?: string;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-bold text-navy">{label}</div>
        <div className="text-sm font-black text-navy">
          {value} <span className="text-xs font-bold text-navy/60">{suffix}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="mt-2 w-full accent-[oklch(0.35_0.08_260)]"
      />
      {help ? <div className="mt-1 text-xs text-navy/50">{help}</div> : null}
    </section>
  );
}
