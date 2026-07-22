import { useCallback, useEffect, useState } from "react";
import {
  SESSIONS_STORAGE_KEY,
  loadSessions,
  upsertSession as upsertSessionStore,
  clearSession as clearSessionStore,
  clearAllSessions as clearAllStore,
  type SessionsMap,
} from "@/lib/session-store";
import type { BehaviorScore } from "@/lib/types";

export function useSessions() {
  const [sessions, setSessions] = useState<SessionsMap>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setSessions(loadSessions());
    setIsLoaded(true);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === SESSIONS_STORAGE_KEY) {
        setSessions(loadSessions());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const upsert = useCallback(
    (date: string, schedulePeriodId: string, score: BehaviorScore) => {
      upsertSessionStore(date, schedulePeriodId, score);
      setSessions(loadSessions());
    },
    [],
  );

  const clearOne = useCallback((date: string, schedulePeriodId: string) => {
    clearSessionStore(date, schedulePeriodId);
    setSessions(loadSessions());
  }, []);

  const clearAll = useCallback(() => {
    clearAllStore();
    setSessions({});
  }, []);

  return { sessions, isLoaded, upsert, clearOne, clearAll };
}
