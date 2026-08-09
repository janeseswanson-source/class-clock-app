import { useMemo, useRef, useState } from "react";
import {
  formatTime,
  movePeriod,
  resizePeriod,
  snap,
  SNAP_MINUTES,
  toHHMM,
} from "@/lib/schedule";
import { periodEndMin, periodStartMin } from "@/lib/time";
import type { SchedulePeriod } from "@/lib/types";
import { cn } from "@/lib/utils";

const PX_PER_MIN = 1.6;
const PAD_MIN = 30;
const MIN_VIEW_START = 7 * 60; // 7:00 AM
const MIN_VIEW_END = 16 * 60; // 4:00 PM

interface DayTimelineProps {
  periods: SchedulePeriod[];
  selectedId: string | null;
  conflictIds: Set<string>;
  onSelect: (id: string) => void;
  onChange: (period: SchedulePeriod) => void;
}

type DragMode = "move" | "resize-start" | "resize-end";

interface DragState {
  id: string;
  mode: DragMode;
  originY: number;
  startMin: number;
  endMin: number;
}

/**
 * The day laid out to scale, with each period as a block you can drag to move
 * or drag by an edge to resize. Answers the "couldn't drag time clock around"
 * note — retyping four times to move one class is the thing that made rebuilding
 * a schedule painful.
 *
 * Blocks are also focusable: Arrow keys move, Shift+Arrow resizes.
 */
export function DayTimeline({
  periods,
  selectedId,
  conflictIds,
  onSelect,
  onChange,
}: DayTimelineProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const { viewStart, viewEnd } = useMemo(() => {
    if (periods.length === 0) return { viewStart: MIN_VIEW_START, viewEnd: MIN_VIEW_END };
    const earliest = Math.min(...periods.map(periodStartMin));
    const latest = Math.max(...periods.map(periodEndMin));
    return {
      viewStart: Math.min(MIN_VIEW_START, snap(earliest - PAD_MIN, 30)),
      viewEnd: Math.max(MIN_VIEW_END, snap(latest + PAD_MIN, 30)),
    };
  }, [periods]);

  const height = (viewEnd - viewStart) * PX_PER_MIN;
  const yFor = (min: number) => (min - viewStart) * PX_PER_MIN;

  const hourMarks = useMemo(() => {
    const marks: number[] = [];
    for (let m = Math.ceil(viewStart / 60) * 60; m <= viewEnd; m += 60) marks.push(m);
    return marks;
  }, [viewStart, viewEnd]);

  const beginDrag = (
    e: React.PointerEvent<HTMLElement>,
    period: SchedulePeriod,
    mode: DragMode,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const state: DragState = {
      id: period.id,
      mode,
      originY: e.clientY,
      startMin: periodStartMin(period),
      endMin: periodEndMin(period),
    };
    dragRef.current = state;
    setDrag(state);
    onSelect(period.id);
  };

  const moveDrag = (e: React.PointerEvent<HTMLElement>, period: SchedulePeriod) => {
    const state = dragRef.current;
    if (!state || state.id !== period.id) return;
    const deltaMin = snap((e.clientY - state.originY) / PX_PER_MIN, SNAP_MINUTES);
    if (deltaMin === 0) return;

    if (state.mode === "move") {
      const moved = movePeriod(period, state.startMin + deltaMin);
      if (moved.startTime !== period.startTime) onChange(moved);
    } else if (state.mode === "resize-start") {
      const next = resizePeriod(period, "start", state.startMin + deltaMin);
      if (next.startTime !== period.startTime) onChange(next);
    } else {
      const next = resizePeriod(period, "end", state.endMin + deltaMin);
      if (next.endTime !== period.endTime) onChange(next);
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
    dragRef.current = null;
    setDrag(null);
  };

  const onKeyDown = (e: React.KeyboardEvent, period: SchedulePeriod) => {
    const dir = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (dir === 0) return;
    e.preventDefault();
    const delta = dir * SNAP_MINUTES;
    if (e.shiftKey) {
      onChange(resizePeriod(period, "end", periodEndMin(period) + delta));
    } else {
      onChange(movePeriod(period, periodStartMin(period) + delta));
    }
  };

  if (periods.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-navy/15 p-8 text-center text-sm text-navy/50">
        Add a period and it will appear on the timeline, where you can drag it to
        move or resize it.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-navy/10 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-bold tracking-[0.2em] text-navy/60">DAY TIMELINE</div>
        <div className="text-xs text-navy/50">
          Drag a block to move it · drag its edges to change the length
        </div>
      </div>

      <div className="relative overflow-hidden pl-14" style={{ height }}>
        {hourMarks.map((m) => (
          <div key={m} className="absolute inset-x-0" style={{ top: yFor(m) }}>
            <div className="absolute -left-14 -translate-y-1/2 text-[11px] font-bold tabular-nums text-navy/45">
              {formatTime(toHHMM(m))}
            </div>
            <div className="border-t border-navy/10" />
          </div>
        ))}

        {periods.map((p) => {
          const top = yFor(periodStartMin(p));
          const blockHeight = Math.max(
            22,
            (periodEndMin(p) - periodStartMin(p)) * PX_PER_MIN,
          );
          const conflicted = conflictIds.has(p.id);
          const selected = selectedId === p.id;
          const dragging = drag?.id === p.id;
          const title =
            p.periodType === "class"
              ? p.grade || "Class"
              : p.dutyLabel || (p.periodType === "recess" ? "Recess" : "Duty");

          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              aria-label={`${title}, ${formatTime(p.startTime)} to ${formatTime(p.endTime)}. Arrow keys move, shift plus arrow keys resize.`}
              onPointerDown={(e) => beginDrag(e, p, "move")}
              onPointerMove={(e) => moveDrag(e, p)}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={(e) => onKeyDown(e, p)}
              onFocus={() => onSelect(p.id)}
              className={cn(
                "absolute inset-x-0 touch-none select-none rounded-lg border-2 px-2 py-1 text-left transition-shadow",
                dragging ? "cursor-grabbing shadow-lg" : "cursor-grab",
                conflicted
                  ? "border-destructive bg-destructive/10"
                  : p.periodType === "recess"
                    ? "border-gold bg-gold-soft"
                    : p.periodType === "duty"
                      ? "border-navy/30 bg-navy/5"
                      : "border-navy/25 bg-white",
                selected && !conflicted && "border-navy ring-2 ring-navy/20",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              )}
              style={{ top, height: blockHeight }}
            >
              <div
                onPointerDown={(e) => beginDrag(e, p, "resize-start")}
                onPointerMove={(e) => moveDrag(e, p)}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="absolute inset-x-0 top-0 h-2 cursor-ns-resize rounded-t-md hover:bg-navy/15"
                aria-hidden
              />
              <div className="pointer-events-none flex items-baseline gap-2 overflow-hidden">
                <span className="truncate text-xs font-black text-navy">{title}</span>
                <span className="whitespace-nowrap text-[11px] font-bold tabular-nums text-navy/60">
                  {formatTime(p.startTime)} – {formatTime(p.endTime)}
                </span>
              </div>
              {blockHeight > 40 && p.classroomTeacher ? (
                <div className="pointer-events-none truncate text-[11px] text-navy/60">
                  {p.classroomTeacher}
                </div>
              ) : null}
              <div
                onPointerDown={(e) => beginDrag(e, p, "resize-end")}
                onPointerMove={(e) => moveDrag(e, p)}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize rounded-b-md hover:bg-navy/15"
                aria-hidden
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
