import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getMySessions,
  upsertMySession,
  clearAllMySessions,
  type SessionsMap,
} from "@/lib/sessions.functions";
import type { BehaviorScore } from "@/lib/types";

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
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
