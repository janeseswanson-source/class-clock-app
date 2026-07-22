import { useEffect, useState } from "react";
import { devClock } from "@/lib/dev-clock";

export function useNow(intervalMs = 250) {
  const [now, setNow] = useState<Date>(() => devClock.now());

  useEffect(() => {
    const tick = () => setNow(devClock.now());
    tick();
    const id = window.setInterval(tick, intervalMs);
    const unsub = devClock.subscribe(tick);
    return () => {
      window.clearInterval(id);
      unsub();
    };
  }, [intervalMs]);

  return now;
}
