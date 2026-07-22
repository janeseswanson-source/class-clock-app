import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface FlipDigitProps {
  value: string; // single character
  intent?: "normal" | "cleanup" | "ended";
}

// Split-flap style: on change, animate top half of previous down and
// bottom half of new up.
export function FlipDigit({ value, intent = "normal" }: FlipDigitProps) {
  const [prev, setPrev] = useState(value);
  const [current, setCurrent] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === current) return;
    setPrev(current);
    setCurrent(value);
    setFlipping(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setFlipping(false), 450);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [value, current]);

  const cellClass = cn(
    "flip-cell",
    intent === "cleanup" && "flip-cell-cleanup",
    intent === "ended" && "flip-cell-ended",
  );

  return (
    <div className={cellClass}>
      {/* Static full digit (current) as base */}
      <div className="flip-static">{current}</div>

      {flipping && (
        <>
          {/* top half of previous flips down */}
          <div className="flip-half flip-top flip-anim-top">
            <div className="flip-half-inner">{prev}</div>
          </div>
          {/* bottom half of new flips up */}
          <div className="flip-half flip-bottom flip-anim-bottom">
            <div className="flip-half-inner flip-half-inner-bottom">{current}</div>
          </div>
        </>
      )}

      {/* horizontal seam */}
      <div className="flip-seam" />
    </div>
  );
}

interface FlatDigitProps {
  value: string;
  intent?: "normal" | "cleanup" | "ended";
}

// Seconds — no flip, just a plain digit in the same cell shape.
export function FlatDigit({ value, intent = "normal" }: FlatDigitProps) {
  const cellClass = cn(
    "flip-cell",
    intent === "cleanup" && "flip-cell-cleanup",
    intent === "ended" && "flip-cell-ended",
  );
  return (
    <div className={cellClass}>
      <div className="flip-static">{value}</div>
      <div className="flip-seam" />
    </div>
  );
}
