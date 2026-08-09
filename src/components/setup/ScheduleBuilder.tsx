import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowDownUp, Coffee, Copy, Plus, Sparkles, Users } from "lucide-react";
import { DayTimeline } from "./DayTimeline";
import { PeriodRow } from "./PeriodRow";
import { TimeField } from "./TimeField";
import {
  conflictsByDay,
  conflictingPeriodIds,
  copyDayTo,
  createPeriod,
  DAYS,
  generateRotation,
  isChronological,
  periodsForDay,
  shiftPeriodsFrom,
  sortByStart,
} from "@/lib/schedule";
import type { DayOfWeek, SchedulePeriod, TimerSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ScheduleBuilderProps {
  periods: SchedulePeriod[];
  onChange: (next: SchedulePeriod[]) => void;
  settings: TimerSettings;
  /** Lets the builder persist schedule defaults (day start, period length). */
  onSettingsChange?: (patch: Partial<TimerSettings>) => void;
}

export function ScheduleBuilder({
  periods,
  onChange,
  settings,
  onSettingsChange,
}: ScheduleBuilderProps) {
  const [activeDay, setActiveDay] = useState<DayOfWeek>(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showRotation, setShowRotation] = useState(false);
  const [showCopy, setShowCopy] = useState(false);

  /**
   * Display order per day, held separately from the times.
   *
   * The old builder re-sorted on every keystroke, so typing a new start time
   * yanked the row out from under the cursor and looked like it had rewritten
   * every entry. Rows only reorder on an explicit action now.
   */
  const [orderByDay, setOrderByDay] = useState<Partial<Record<DayOfWeek, string[]>>>({});

  const chronological = useMemo(
    () => periodsForDay(periods, activeDay),
    [periods, activeDay],
  );

  useEffect(() => {
    setOrderByDay((prev) =>
      prev[activeDay]
        ? prev
        : { ...prev, [activeDay]: chronological.map((p) => p.id) },
    );
  }, [activeDay, chronological]);

  const dayPeriods = useMemo(() => {
    const order = orderByDay[activeDay];
    if (!order) return chronological;
    const remaining = new Map(chronological.map((p) => [p.id, p]));
    const out: SchedulePeriod[] = [];
    for (const id of order) {
      const p = remaining.get(id);
      if (p) {
        out.push(p);
        remaining.delete(id);
      }
    }
    // Anything created since the order was captured lands in time order.
    for (const p of chronological) if (remaining.has(p.id)) out.push(p);
    return out;
  }, [orderByDay, activeDay, chronological]);

  const allConflicts = useMemo(() => conflictsByDay(periods), [periods]);
  const conflictIds = useMemo(() => conflictingPeriodIds(periods), [periods]);
  const outOfOrder = !isChronological(dayPeriods);

  const captureOrder = (next: SchedulePeriod[], day: DayOfWeek = activeDay) => {
    setOrderByDay((prev) => ({
      ...prev,
      [day]: sortByStart(next.filter((p) => p.dayOfWeek === day)).map((p) => p.id),
    }));
  };

  const update = (id: string, patch: Partial<SchedulePeriod>) =>
    onChange(periods.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const replace = (period: SchedulePeriod) =>
    onChange(periods.map((p) => (p.id === period.id ? period : p)));

  const remove = (id: string) => {
    const victim = periods.find((p) => p.id === id);
    if (!victim) return;
    const next = periods.filter((p) => p.id !== id);
    onChange(next);
    setOrderByDay((prev) => ({
      ...prev,
      [victim.dayOfWeek]: (prev[victim.dayOfWeek] ?? []).filter((x) => x !== id),
    }));
    toast("Period removed", {
      description: `${DAYS.find((d) => d.id === victim.dayOfWeek)?.label}, ${victim.startTime}`,
      action: {
        label: "Undo",
        onClick: () => {
          onChange([...next, victim]);
          captureOrder([...next, victim], victim.dayOfWeek);
        },
      },
    });
  };

  const add = (periodType: SchedulePeriod["periodType"]) => {
    const created = createPeriod(activeDay, chronological, settings, periodType);
    const next = [...periods, created];
    onChange(next);
    setOrderByDay((prev) => ({
      ...prev,
      [activeDay]: [...(prev[activeDay] ?? chronological.map((p) => p.id)), created.id],
    }));
    setSelectedId(created.id);
  };

  const ripple = (fromId: string, deltaMin: number) => {
    const next = shiftPeriodsFrom(periods, fromId, deltaMin);
    onChange(next);
    captureOrder(next);
  };

  const sortNow = () => captureOrder(periods);

  const applyRotation = (spec: {
    dayStartTime: string;
    periodMinutes: number;
    passingMinutes: number;
    count: number;
    days: DayOfWeek[];
  }) => {
    const generated = generateRotation(spec);
    const kept = periods.filter((p) => !spec.days.includes(p.dayOfWeek));
    const next = [...kept, ...generated];
    onChange(next);
    setOrderByDay((prev) => {
      const updated = { ...prev };
      for (const d of spec.days) {
        updated[d] = sortByStart(generated.filter((p) => p.dayOfWeek === d)).map((p) => p.id);
      }
      return updated;
    });
    onSettingsChange?.({
      dayStartTime: spec.dayStartTime,
      defaultPeriodMinutes: spec.periodMinutes,
      defaultPassingMinutes: spec.passingMinutes,
    });
    setShowRotation(false);
    setActiveDay(spec.days[0] ?? 1);
    toast.success(
      `Created ${spec.count} periods on ${spec.days.length} day${spec.days.length === 1 ? "" : "s"}`,
    );
  };

  const applyCopy = (targets: DayOfWeek[]) => {
    const next = copyDayTo(periods, activeDay, targets);
    onChange(next);
    setOrderByDay((prev) => {
      const updated = { ...prev };
      for (const d of targets) {
        updated[d] = sortByStart(next.filter((p) => p.dayOfWeek === d)).map((p) => p.id);
      }
      return updated;
    });
    setShowCopy(false);
    toast.success(
      `Copied ${DAYS.find((d) => d.id === activeDay)?.label} to ${targets.length} day${targets.length === 1 ? "" : "s"}`,
    );
  };

  return (
    <div className="space-y-4">
      {/* Day tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {DAYS.map((d) => {
          const isActive = d.id === activeDay;
          const count = periods.filter((p) => p.dayOfWeek === d.id).length;
          const hasIssue = allConflicts.has(d.id);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveDay(d.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm font-bold transition-colors",
                isActive ? "bg-navy text-white" : "bg-navy/5 text-navy hover:bg-navy/10",
              )}
            >
              {d.short}
              <span className={cn("ml-2 text-xs", isActive ? "text-white/70" : "text-navy/50")}>
                {count}
              </span>
              {hasIssue ? (
                <span
                  aria-label="has a scheduling conflict"
                  className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-white"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Day-level tools */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-navy/5 p-3">
        <label className="flex items-center gap-2 text-xs font-bold text-navy">
          MY DAY STARTS
          <TimeField
            label="Day start time"
            value={settings.dayStartTime}
            onChange={(dayStartTime) => onSettingsChange?.({ dayStartTime })}
          />
        </label>
        <span className="text-xs text-navy/50">New periods begin here on an empty day.</span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRotation((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-navy/15 bg-white px-3 py-1.5 text-xs font-bold text-navy hover:border-navy/40"
          >
            <Sparkles className="h-3.5 w-3.5" /> Generate rotation
          </button>
          <button
            type="button"
            onClick={() => setShowCopy((v) => !v)}
            disabled={chronological.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-navy/15 bg-white px-3 py-1.5 text-xs font-bold text-navy hover:border-navy/40 disabled:opacity-40"
          >
            <Copy className="h-3.5 w-3.5" /> Copy this day to…
          </button>
        </div>
      </div>

      {showRotation ? (
        <RotationPanel
          settings={settings}
          defaultDay={activeDay}
          onCancel={() => setShowRotation(false)}
          onApply={applyRotation}
        />
      ) : null}

      {showCopy ? (
        <CopyPanel
          fromDay={activeDay}
          onCancel={() => setShowCopy(false)}
          onApply={applyCopy}
        />
      ) : null}

      {allConflicts.size > 0 ? (
        <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Fix {allConflicts.size === 1 ? "this" : "these"} before saving
          </div>
          <ul className="mt-2 space-y-1 text-xs text-navy/80">
            {[...allConflicts.entries()].flatMap(([day, list]) =>
              list.map((c, i) => (
                <li key={`${day}-${i}`}>
                  <button
                    type="button"
                    onClick={() => setActiveDay(day)}
                    className="text-left hover:underline"
                  >
                    <b>{DAYS.find((d) => d.id === day)?.short}</b> · {c.message}
                  </button>
                </li>
              )),
            )}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-3">
          {outOfOrder ? (
            <div className="flex items-center justify-between rounded-xl bg-gold-soft px-3 py-2 text-xs font-bold text-navy">
              <span>These rows are no longer in time order.</span>
              <button
                type="button"
                onClick={sortNow}
                className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1 text-white hover:bg-navy/90"
              >
                <ArrowDownUp className="h-3 w-3" /> Sort by time
              </button>
            </div>
          ) : null}

          {dayPeriods.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-navy/15 p-8 text-center text-sm text-navy/50">
              Nothing on {DAYS.find((d) => d.id === activeDay)?.label} yet. Add a class
              below, or generate a full rotation.
            </div>
          ) : (
            dayPeriods.map((p) => (
              <PeriodRow
                key={p.id}
                period={p}
                settings={settings}
                conflicted={conflictIds.has(p.id)}
                selected={selectedId === p.id}
                onSelect={() => setSelectedId(p.id)}
                onChange={(patch) => update(p.id, patch)}
                onRipple={(delta) => ripple(p.id, delta)}
                onRemove={() => remove(p.id)}
              />
            ))
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => add("class")}
              className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-bold text-white hover:bg-navy/90"
            >
              <Plus className="h-4 w-4" /> Add class
            </button>
            <button
              type="button"
              onClick={() => add("recess")}
              className="inline-flex items-center gap-2 rounded-full bg-gold-soft px-4 py-2 text-sm font-bold text-navy hover:bg-gold/40"
            >
              <Coffee className="h-4 w-4" /> Add recess
            </button>
            <button
              type="button"
              onClick={() => add("duty")}
              className="inline-flex items-center gap-2 rounded-full border-2 border-navy/15 px-4 py-2 text-sm font-bold text-navy hover:border-navy/40"
            >
              <Users className="h-4 w-4" /> Add duty
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <DayTimeline
            periods={chronological}
            selectedId={selectedId}
            conflictIds={conflictIds}
            onSelect={setSelectedId}
            onChange={replace}
          />
        </div>
      </div>
    </div>
  );
}

/* ── rotation generator ──────────────────────────────────────────────────── */

function RotationPanel({
  settings,
  defaultDay,
  onApply,
  onCancel,
}: {
  settings: TimerSettings;
  defaultDay: DayOfWeek;
  onApply: (spec: {
    dayStartTime: string;
    periodMinutes: number;
    passingMinutes: number;
    count: number;
    days: DayOfWeek[];
  }) => void;
  onCancel: () => void;
}) {
  const [dayStartTime, setDayStartTime] = useState(settings.dayStartTime);
  const [periodMinutes, setPeriodMinutes] = useState(settings.defaultPeriodMinutes);
  const [passingMinutes, setPassingMinutes] = useState(settings.defaultPassingMinutes);
  const [count, setCount] = useState(6);
  const [days, setDays] = useState<DayOfWeek[]>([1, 2, 3, 4, 5]);

  const preview = useMemo(
    () =>
      generateRotation({ dayStartTime, periodMinutes, passingMinutes, count, days: [defaultDay] }),
    [dayStartTime, periodMinutes, passingMinutes, count, defaultDay],
  );
  const lastEnd = preview.at(-1)?.endTime;

  return (
    <div className="rounded-2xl border-2 border-navy/15 bg-white p-4">
      <div className="text-sm font-black text-navy">Generate a rotation</div>
      <p className="mt-1 text-xs text-navy/60">
        Lays out back-to-back periods on the days you pick. Replaces whatever those
        days currently hold — grades and teachers are yours to fill in after.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="text-xs font-bold text-navy">
          <span className="block mb-1">First class starts</span>
          <TimeField label="Rotation start time" value={dayStartTime} onChange={setDayStartTime} />
        </label>
        <NumberField label="Class length" suffix="min" value={periodMinutes} min={5} max={240} onChange={setPeriodMinutes} />
        <NumberField label="Passing time" suffix="min" value={passingMinutes} min={0} max={60} onChange={setPassingMinutes} />
        <NumberField label="Classes per day" suffix="" value={count} min={1} max={12} onChange={setCount} />
      </div>

      <div className="mt-4">
        <div className="text-xs font-bold text-navy mb-1.5">Apply to</div>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => {
            const on = days.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setDays((prev) =>
                    prev.includes(d.id) ? prev.filter((x) => x !== d.id) : [...prev, d.id],
                  )
                }
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                  on ? "bg-navy text-white" : "bg-navy/5 text-navy hover:bg-navy/10",
                )}
              >
                {d.short}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-navy/5 px-3 py-2 text-xs text-navy/70">
        {count} classes, {dayStartTime.replace(/^0/, "")} to {lastEnd?.replace(/^0/, "") ?? "—"}
        , on {days.length} day{days.length === 1 ? "" : "s"}.
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          disabled={days.length === 0}
          onClick={() => onApply({ dayStartTime, periodMinutes, passingMinutes, count, days })}
          className="rounded-full bg-gold px-4 py-2 text-sm font-bold text-navy hover:bg-gold/90 disabled:opacity-40"
        >
          Generate
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-4 py-2 text-sm font-bold text-navy/60 hover:text-navy"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function CopyPanel({
  fromDay,
  onApply,
  onCancel,
}: {
  fromDay: DayOfWeek;
  onApply: (targets: DayOfWeek[]) => void;
  onCancel: () => void;
}) {
  const [targets, setTargets] = useState<DayOfWeek[]>([]);
  const options = DAYS.filter((d) => d.id !== fromDay);

  return (
    <div className="rounded-2xl border-2 border-navy/15 bg-white p-4">
      <div className="text-sm font-black text-navy">
        Copy {DAYS.find((d) => d.id === fromDay)?.label} to…
      </div>
      <p className="mt-1 text-xs text-navy/60">
        Each selected day is replaced with a copy of this one.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((d) => {
          const on = targets.includes(d.id);
          return (
            <button
              key={d.id}
              type="button"
              aria-pressed={on}
              onClick={() =>
                setTargets((prev) =>
                  prev.includes(d.id) ? prev.filter((x) => x !== d.id) : [...prev, d.id],
                )
              }
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                on ? "bg-navy text-white" : "bg-navy/5 text-navy hover:bg-navy/10",
              )}
            >
              {d.short}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setTargets(options.map((d) => d.id))}
          className="rounded-full border-2 border-navy/15 px-3 py-1.5 text-xs font-bold text-navy hover:border-navy/40"
        >
          All weekdays
        </button>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          disabled={targets.length === 0}
          onClick={() => onApply(targets)}
          className="rounded-full bg-gold px-4 py-2 text-sm font-bold text-navy hover:bg-gold/90 disabled:opacity-40"
        >
          Copy
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-4 py-2 text-sm font-bold text-navy/60 hover:text-navy"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function NumberField({
  label,
  suffix,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  suffix: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="text-xs font-bold text-navy">
      <span className="block mb-1">{label}</span>
      <span className="inline-flex items-center gap-1.5">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
          }}
          className="w-20 rounded-lg border-2 border-navy/15 bg-white px-2.5 py-2 text-sm font-bold tabular-nums text-navy focus:border-gold focus:outline-none"
        />
        {suffix ? <span className="text-navy/60">{suffix}</span> : null}
      </span>
    </label>
  );
}
