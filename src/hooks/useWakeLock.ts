import { useEffect, useRef } from "react";

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
}

/**
 * Keeps a mounted classroom display awake. A TV that sleeps mid-morning misses
 * every alarm for the rest of the day, and nobody is standing next to it to
 * nudge the mouse.
 *
 * The lock is dropped by the browser whenever the tab is hidden, so it is
 * re-requested on visibilitychange. Unsupported browsers no-op.
 */
export function useWakeLock(enabled: boolean) {
  const sentinel = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined") return;
    const wakeLock = (
      navigator as Navigator & {
        wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
      }
    ).wakeLock;
    if (!wakeLock) return;

    let cancelled = false;

    const acquire = async () => {
      if (cancelled || document.visibilityState !== "visible") return;
      if (sentinel.current && !sentinel.current.released) return;
      try {
        sentinel.current = await wakeLock.request("screen");
      } catch {
        /* denied (battery saver, permissions policy) — nothing else to do */
      }
    };

    const onVisibility = () => void acquire();

    void acquire();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void sentinel.current?.release().catch(() => {});
      sentinel.current = null;
    };
  }, [enabled]);
}
