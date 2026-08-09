import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getMySessions,
  upsertMySession,
  clearAllMySessions,
  type SessionsMap,
} from "@/lib/sessions.functions";
import { RATING_LABELS, type BehaviorScore, type ClassSession } from "@/lib/types";

export function useSessions() {
  const qc = useQueryClient();
  const getSessions = useServerFn(getMySessions);
  const upsert = useServerFn(upsertMySession);
  const clear = useServerFn(clearAllMySessions);

  const query = useQuery<SessionsMap>({
    queryKey: ["sessions"],
    queryFn: () => getSessions(),
    staleTime: 30_000,
  });

  const upsertMutation = useMutation({
    mutationFn: ({
      date,
      schedulePeriodId,
      score,
    }: {
      date: string;
      schedulePeriodId: string;
      score: BehaviorScore;
    }) => upsert({ data: { date, schedulePeriodId, score } }),
    // Paint the score immediately. On a wall display a round-trip before the
    // button lights up reads as a dead button, and teachers tap again.
    onMutate: async ({ date, schedulePeriodId, score }) => {
      await qc.cancelQueries({ queryKey: ["sessions"] });
      const previous = qc.getQueryData<SessionsMap>(["sessions"]);
      qc.setQueryData<SessionsMap>(["sessions"], (old) => {
        const map: SessionsMap = { ...(old ?? {}) };
        const list = [...(map[date] ?? [])];
        const idx = list.findIndex((s) => s.schedulePeriodId === schedulePeriodId);
        const next: ClassSession = {
          date,
          schedulePeriodId,
          behaviorScore: score,
          ratingLabel: RATING_LABELS[score],
          scoreLoggedAt: new Date().toISOString(),
          edited: idx >= 0,
        };
        if (idx >= 0) list[idx] = next;
        else list.push(next);
        map[date] = list;
        return map;
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["sessions"], context.previous);
      toast.error("Couldn't save that score", { description: "Check your connection." });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const clearAllMutation = useMutation({
    mutationFn: () => clear(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const doUpsert = useCallback(
    (date: string, schedulePeriodId: string, score: BehaviorScore) =>
      upsertMutation.mutate({ date, schedulePeriodId, score }),
    [upsertMutation],
  );
  const clearAll = useCallback(() => clearAllMutation.mutateAsync(), [clearAllMutation]);

  return {
    sessions: query.data ?? {},
    isLoaded: query.isSuccess || query.isError,
    upsert: doUpsert,
    clearAll,
  };
}
