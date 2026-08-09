// Behavior scores live in Supabase (see sessions.functions.ts / useSessions).
//
// This module used to hold a parallel localStorage store. Its writers were the
// source of a silent data-loss bug — the Reports page called upsertSession()
// here while the table it rendered read from the server, so score edits looked
// applied and vanished on reload. Only the date helper remains; anything that
// persists a score must go through useSessions().

export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
