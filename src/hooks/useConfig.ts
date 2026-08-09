import { useCallback, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getMyConfig,
  saveMyConfig,
  updateMySettings,
  resetMyData,
  type ServerConfig,
} from "@/lib/config.functions";
import {
  DEFAULT_SETTINGS,
  loadConfig as loadLocalConfig,
  clearConfig as clearLocalConfig,
} from "@/lib/config-store";
import type { SchedulePeriod, TimerInstance, TimerSettings } from "@/lib/types";

export interface UIConfig {
  instance: TimerInstance;
  schedule: SchedulePeriod[];
  settings: TimerSettings;
}

export function useConfig() {
  const qc = useQueryClient();
  const getConfig = useServerFn(getMyConfig);
  const saveConfig = useServerFn(saveMyConfig);
  const updateSettings = useServerFn(updateMySettings);
  const reset = useServerFn(resetMyData);

  const query = useQuery<ServerConfig | null>({
    queryKey: ["config"],
    queryFn: () => getConfig(),
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: (cfg: UIConfig) =>
      saveConfig({
        data: {
          instance: {
            subjectTitle: cfg.instance.subjectTitle,
            teacherName: cfg.instance.teacherName,
            setupMethod: cfg.instance.setupMethod,
          },
          schedule: cfg.schedule,
          settings: cfg.settings,
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["config"] }),
  });

  const settingsMutation = useMutation({
    mutationFn: (s: TimerSettings) => updateSettings({ data: s }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["config"] }),
  });

  const resetMutation = useMutation({
    mutationFn: () => reset(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["config"] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  // One-time migration from localStorage on first successful load.
  useEffect(() => {
    if (!query.isSuccess || query.isFetching) return;
    if (query.data?.configured) return;
    const local = loadLocalConfig();
    if (!local) return;
    saveMutation.mutate(
      {
        instance: local.instance,
        schedule: local.schedule,
        settings: { ...DEFAULT_SETTINGS, ...local.settings },
      },
      {
        onSuccess: () => {
          clearLocalConfig();
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.isSuccess, query.isFetching, query.data?.configured]);

  const server = query.data;
  // Memoised so the display's per-second tick doesn't invalidate every
  // downstream useMemo through a fresh object identity.
  const config = useMemo<UIConfig | null>(
    () =>
      server?.configured
        ? { instance: server.instance, schedule: server.schedule, settings: server.settings }
        : null,
    [server],
  );

  const save = useCallback(
    (cfg: UIConfig) => saveMutation.mutateAsync(cfg),
    [saveMutation],
  );
  const saveSettings = useCallback(
    (s: TimerSettings) => settingsMutation.mutateAsync(s),
    [settingsMutation],
  );
  const clear = useCallback(() => resetMutation.mutateAsync(), [resetMutation]);

  return {
    config,
    isLoaded: query.isSuccess || query.isError,
    save,
    saveSettings,
    clear,
  };
}
