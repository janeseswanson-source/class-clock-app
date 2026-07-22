import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { BehaviorScore, ClassSession } from "@/lib/types";
import { RATING_LABELS } from "@/lib/types";

export type SessionsMap = Record<string, ClassSession[]>;

function rowToSession(row: {
  date: string;
  schedule_period_id: string;
  behavior_score: number;
  rating_label: string | null;
  score_logged_at: string;
  edited: boolean;
}): ClassSession {
  return {
    date: row.date,
    schedulePeriodId: row.schedule_period_id,
    behaviorScore: row.behavior_score as BehaviorScore,
    ratingLabel: row.rating_label,
    scoreLoggedAt: row.score_logged_at,
    edited: row.edited,
  };
}

export const getMySessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SessionsMap> => {
    const { data, error } = await context.supabase
      .from("sessions")
      .select("date, schedule_period_id, behavior_score, rating_label, score_logged_at, edited")
      .eq("owner_id", context.userId)
      .order("date", { ascending: false });
    if (error) throw new Error(error.message);
    const map: SessionsMap = {};
    for (const row of data ?? []) {
      const s = rowToSession(row);
      (map[s.date] ??= []).push(s);
    }
    return map;
  });

const upsertSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  schedulePeriodId: z.string().min(1),
  score: z.number().int().min(1).max(5),
});

export const upsertMySession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => upsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const score = data.score as BehaviorScore;
    const label = RATING_LABELS[score];
    // Check if it already exists to set `edited`.
    const { data: existing } = await context.supabase
      .from("sessions")
      .select("id")
      .eq("owner_id", context.userId)
      .eq("date", data.date)
      .eq("schedule_period_id", data.schedulePeriodId)
      .maybeSingle();
    const edited = !!existing;
    const { error } = await context.supabase
      .from("sessions")
      .upsert(
        {
          owner_id: context.userId,
          date: data.date,
          schedule_period_id: data.schedulePeriodId,
          behavior_score: score,
          rating_label: label,
          score_logged_at: new Date().toISOString(),
          edited,
        },
        { onConflict: "owner_id,date,schedule_period_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearAllMySessions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("sessions")
      .delete()
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
