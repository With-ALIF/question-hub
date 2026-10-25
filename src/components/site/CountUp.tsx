"use client";

import { useEffect, useState } from "react";

import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function CountUp({
  value,
  duration,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const { num } = useI18n();
  const [count, setCount] = useState(0);
  const animationDuration = duration ?? (value > 999 ? 1500 : 800);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion || !Number.isFinite(value) || value <= 0) {
      const frame = requestAnimationFrame(() => setCount(value));
      return () => cancelAnimationFrame(frame);
    }

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / animationDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCount(Math.round(eased * value));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [value, animationDuration]);

  return (
    <span className={cn("tabular-nums", className)}>
      <span aria-hidden={count !== value || undefined}>{num(count)}</span>
      {count !== value && <span className="sr-only">{num(value)}</span>}
    </span>
  );
}
