import { AlarmClock, Bell, Play } from "lucide-react";
import { TimeField } from "@/components/setup/TimeField";
import { addMinutes, formatTime } from "@/lib/schedule";
import type { AlarmStyle, TimerSettings } from "@/lib/types";
import { playAlarm } from "@/lib/alarm";
import { cn } from "@/lib/utils";

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
  // Worked example so the lead time is unambiguous before anyone tests it live.
  const exampleEnd = "09:40";
  const exampleCleanup = formatTime(addMinutes(exampleEnd, -settings.cleanupLeadMinutes));

  return (
    <div className="space-y-10">
      <section>
        <SectionTitle>Clean-up alarm</SectionTitle>
        <div className="rounded-2xl border-2 border-gold bg-gold-soft/50 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <AlarmClock className="h-5 w-5 text-navy" />
            <span className="text-sm font-bold text-navy">Ring</span>
            <input
              type="number"
              min={0}
              max={60}
              value={settings.cleanupLeadMinutes}
              aria-label="Minutes before class ends"
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (Number.isFinite(n)) {
                  onChange({ cleanupLeadMinutes: Math.max(0, Math.min(60, n)) });
                }
              }}
              className="w-20 rounded-lg border-2 border-navy/20 bg-white px-3 py-2 text-lg font-black tabular-nums text-navy focus:border-navy focus:outline-none"
            />
            <span className="text-sm font-bold text-navy">minutes before every class ends</span>
          </div>
          <p className="mt-3 text-xs text-navy/70">
            A class ending at {formatTime(exampleEnd)} rings at{" "}
            <b className="tabular-nums">{exampleCleanup}</b>, flashes CLEAN UP TIME on the
            display, then the end-of-class alarm rings at {formatTime(exampleEnd)}. Any single
            class can override this on the Schedule tab.
          </p>
          <div className="mt-3 border-t-2 border-navy/10 pt-3">
            <ToggleRow
              label="Play a sound at clean-up time"
              desc="Turn off to keep the coral flash but stay silent."
              checked={settings.cleanupAlarmEnabled}
              onChange={(cleanupAlarmEnabled) => onChange({ cleanupAlarmEnabled })}
            />
          </div>
        </div>
      </section>

      <AlarmPicker
        title="Clean-up sound"
        icon={<AlarmClock className="h-4 w-4" />}
        value={settings.cleanupAlarmStyle}
        disabled={!settings.cleanupAlarmEnabled}
        onChange={(cleanupAlarmStyle) => onChange({ cleanupAlarmStyle })}
      />

      <section>
        <SectionTitle>End of class</SectionTitle>
        <ToggleRow
          label="Ring when the class ends"
          desc="The bell at 0:00, on top of the clean-up alarm."
          checked={settings.endAlarmEnabled}
          onChange={(endAlarmEnabled) => onChange({ endAlarmEnabled })}
        />
      </section>

      <AlarmPicker
        title="End-of-class sound"
        icon={<Bell className="h-4 w-4" />}
        value={settings.alarmStyle}
        disabled={!settings.endAlarmEnabled}
        onChange={(alarmStyle) => onChange({ alarmStyle })}
      />

      <SliderRow
        label="Alarm auto-off"
        suffix="seconds"
        min={2}
        max={15}
        value={settings.alarmAutoOffSeconds}
        onChange={(v) => onChange({ alarmAutoOffSeconds: v })}
        help="Both alarms silence themselves — you never have to walk over to the screen."
      />

      <section>
        <SectionTitle>Schedule defaults</SectionTitle>
        <div className="space-y-3 rounded-2xl border-2 border-navy/10 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-navy">My day starts at</div>
              <div className="text-xs text-navy/60">
                Where the first class of an empty day begins.
              </div>
            </div>
            <TimeField
              label="Day start time"
              value={settings.dayStartTime}
              onChange={(dayStartTime) => onChange({ dayStartTime })}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-navy/5 pt-3">
            <div>
              <div className="text-sm font-bold text-navy">Default class length</div>
              <div className="text-xs text-navy/60">Used for each new class you add.</div>
            </div>
            <NumberBox
              label="Default class length in minutes"
              value={settings.defaultPeriodMinutes}
              min={5}
              max={240}
              suffix="min"
              onChange={(defaultPeriodMinutes) => onChange({ defaultPeriodMinutes })}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-navy/5 pt-3">
            <div>
              <div className="text-sm font-bold text-navy">Passing time</div>
              <div className="text-xs text-navy/60">
                Gap left between one class and the next.
              </div>
            </div>
            <NumberBox
              label="Passing time in minutes"
              value={settings.defaultPassingMinutes}
              min={0}
              max={60}
              suffix="min"
              onChange={(defaultPassingMinutes) => onChange({ defaultPassingMinutes })}
            />
          </div>
        </div>
      </section>

      <section>
        <SectionTitle>Behavior scoring</SectionTitle>
        <ToggleRow
          label="Show the 1–5 score buttons"
          desc="Score each class from the display, during or after the period."
          checked={settings.behaviorScoringEnabled}
          onChange={(behaviorScoringEnabled) => onChange({ behaviorScoringEnabled })}
        />
      </section>
    </div>
  );
}

function AlarmPicker({
  title,
  icon,
  value,
  disabled,
  onChange,
}: {
  title: string;
  icon: React.ReactNode;
  value: AlarmStyle;
  disabled?: boolean;
  onChange: (s: AlarmStyle) => void;
}) {
  return (
    <section className={cn(disabled && "opacity-50")}>
      <SectionTitle>{title}</SectionTitle>
      <div className="grid gap-2 md:grid-cols-2">
        {ALARM_OPTIONS.map((opt) => {
          const selected = value === opt.id;
          return (
            <div
              key={opt.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 p-3",
                selected ? "border-gold bg-gold-soft" : "border-navy/15 bg-white",
              )}
            >
              <button
                type="button"
                onClick={() => onChange(opt.id)}
                disabled={disabled}
                aria-pressed={selected}
                className="flex-1 text-left disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1.5 text-sm font-bold text-navy">
                  {selected ? icon : null}
                  {opt.label}
                </div>
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
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border-2 border-navy/10 bg-white p-4">
      <div>
        <div className="text-sm font-bold text-navy">{label}</div>
        <div className="text-xs text-navy/60">{desc}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-navy" : "bg-navy/20",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

function NumberBox({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (n: number) => void;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <input
        type="number"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
        className="w-20 rounded-lg border-2 border-navy/15 bg-white px-2.5 py-2 text-sm font-bold tabular-nums text-navy focus:border-gold focus:outline-none"
      />
      <span className="text-xs font-bold text-navy/60">{suffix}</span>
    </span>
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
        aria-label={label}
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
