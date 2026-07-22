import { useCallback, useEffect, useState } from "react";
import {
  CONFIG_STORAGE_KEY,
  clearConfig as clearConfigStore,
  loadConfig,
  saveConfig as saveConfigStore,
  type StoredConfig,
} from "@/lib/config-store";

export function useConfig() {
  const [config, setConfig] = useState<StoredConfig | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setConfig(loadConfig());
    setIsLoaded(true);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === CONFIG_STORAGE_KEY) {
        setConfig(loadConfig());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const save = useCallback((cfg: Omit<StoredConfig, "version">) => {
    saveConfigStore(cfg);
    setConfig({ version: 1, ...cfg });
  }, []);

  const clear = useCallback(() => {
    clearConfigStore();
    setConfig(null);
  }, []);

  return { config, isLoaded, save, clear };
}
