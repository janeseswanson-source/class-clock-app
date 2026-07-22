export type RangeKey = "today" | "week" | "month" | "custom" | "all";

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0=Sun
  const offset = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + offset);
  return x;
}

export function rangeFor(key: RangeKey, custom?: { from: string; to: string }): { from: string; to: string } {
  const now = new Date();
  if (key === "today") {
    const t = isoDate(now);
    return { from: t, to: t };
  }
  if (key === "week") {
    const start = startOfWeekMonday(now);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: isoDate(start), to: isoDate(end) };
  }
  if (key === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: isoDate(start), to: isoDate(end) };
  }
  if (key === "custom" && custom) return custom;
  return { from: "0000-01-01", to: "9999-12-31" };
}

export function withinRange(date: string, r: { from: string; to: string }): boolean {
  return date >= r.from && date <= r.to;
}

export function formatDayLabel(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}
