"use client";

import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type HeroCarouselProps = {
  slides: string[];
  className?: string;
};

export function HeroCarousel({ slides, className }: HeroCarouselProps) {
  const { tr, num } = useI18n();
  const count = slides.length;
  const [index, setIndex] = useState(count > 1 ? 1 : 0);
  const [noTransition, setNoTransition] = useState(false);

  const displaySlides = useMemo(() => {
    if (count <= 1) return slides;
    return [slides[count - 1], ...slides, slides[0]];
  }, [count, slides]);

  const realIndex = count > 0 ? ((index - 1 + count) % count + count) % count : 0;

  useEffect(() => {
    if (count <= 1) return;

    const timeout = window.setTimeout(() => {
      setNoTransition(false);
      setIndex((current) => Math.min(current + 1, count + 1));
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [count, index]);

  useEffect(() => {
    if (!noTransition) return;

    const frame = requestAnimationFrame(() => setNoTransition(false));
    return () => cancelAnimationFrame(frame);
  }, [noTransition]);

  useEffect(() => {
    if (count <= 1 || (index !== 0 && index !== count + 1)) return;

    const timeout = window.setTimeout(() => {
      setNoTransition(true);
      setIndex(index === 0 ? count : 1);
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [count, index]);

  function handleTransitionEnd() {
    if (count <= 1) return;

    if (index === count + 1) {
      setNoTransition(true);
      setIndex(1);
    } else if (index === 0) {
      setNoTransition(true);
      setIndex(count);
    }
  }

  function goTo(slideIndex: number) {
    setNoTransition(false);
    setIndex(slideIndex + 1);
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={tr("Homepage highlights", "হোমপেজের হাইলাইট")}
      aria-live="off"
      className={cn(
        "relative isolate w-full overflow-hidden bg-slate-950",
        className,
      )}
    >
      <div className="relative h-[clamp(230px,40vw,580px)] w-full overflow-hidden">
        <div
          className={cn(
            "flex h-full w-full ease-[cubic-bezier(0.22,1,0.36,1)]",
            noTransition ? "transition-none" : "transition-transform duration-700 motion-reduce:transition-none",
          )}
          style={{ transform: `translateX(-${index * 100}%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {displaySlides.map((slide, displayIndex) => (
            <div key={`${slide}-${displayIndex}`} className="relative h-full w-full shrink-0">
              {/* Arbitrary admin-provided URLs are rendered as plain images. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
                loading="eager"
                decoding="async"
              />
            </div>
          ))}
        </div>

        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/55 via-slate-950/5 to-transparent"
          aria-hidden="true"
        />

        {count > 1 && (
          <div className="absolute inset-x-0 bottom-5 z-20 flex items-center justify-center gap-2">
            {slides.map((slide, slideIndex) => (
              <button
                key={`${slide}-${slideIndex}`}
                type="button"
                onClick={() => goTo(slideIndex)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950/50",
                  slideIndex === realIndex
                    ? "w-7 bg-white"
                    : "w-1.5 bg-white/40 hover:bg-white/70",
                )}
                aria-label={tr(
                  `Go to slide ${slideIndex + 1}`,
                  `${num(slideIndex + 1)} নম্বর স্লাইডে যান`,
                )}
                aria-current={slideIndex === realIndex ? "true" : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
