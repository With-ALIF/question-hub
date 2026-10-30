"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  ImageIcon,
  Loader2,
  RotateCcw,
  Save,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { saveHomeSlidesAction } from "@/lib/admin/home-slider-actions";
import {
  DEFAULT_HOME_SLIDE_URLS,
  HOME_SLIDE_LIMIT,
  isSafeSlideUrl,
} from "@/lib/home-slides/types";
import { cn } from "@/lib/utils";

type AdminHomeSliderProps = {
  initialSlides: string[];
  role?: string;
};

type Message = {
  type: "success" | "error";
  text: string;
};

function normalizeSlides(slides: string[]) {
  return Array.from(
    { length: HOME_SLIDE_LIMIT },
    (_, index) => slides[index] ?? "",
  );
}

export function AdminHomeSlider({
  initialSlides,
  role = "admin",
}: AdminHomeSliderProps) {
  const [urls, setUrls] = useState(() => normalizeSlides(initialSlides));
  const [savedUrls, setSavedUrls] = useState(() => normalizeSlides(initialSlides));
  const [message, setMessage] = useState<Message | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasInvalidUrl = urls.some(
    (url) => url.trim().length > 0 && !isSafeSlideUrl(url),
  );
  const isDirty = urls.some((url, index) => url.trim() !== savedUrls[index]?.trim());
  const configuredCount = urls.filter((url) => url.trim()).length;

  function updateSlide(index: number, value: string) {
    setUrls((current) =>
      current.map((url, urlIndex) => (urlIndex === index ? value : url)),
    );
    setMessage(null);
  }

  function clearSlide(index: number) {
    updateSlide(index, "");
  }

  function resetToDefaults() {
    setUrls([...DEFAULT_HOME_SLIDE_URLS]);
    setMessage(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (hasInvalidUrl) {
      setMessage({
        type: "error",
        text: "Fix the highlighted image links before saving.",
      });
      return;
    }

    startTransition(async () => {
      const result = await saveHomeSlidesAction(urls);

      if (result.success) {
        const nextUrls = urls.map((url) => url.trim());
        setUrls(nextUrls);
        setSavedUrls(nextUrls);
        setMessage({ type: "success", text: "Homepage slides saved." });
      } else {
        setMessage({
          type: "error",
          text: result.error ?? "Could not save the homepage slides.",
        });
      }
    });
  }

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-background lg:flex-row">
      <AdminSidebar currentPath="/admin/home-slider" role={role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-card/60 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-5xl flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span>Website</span>
                <span aria-hidden="true">/</span>
                <span className="text-foreground">Home slider</span>
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Home Slider
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Manage the images shown at the top of the homepage. Slides
                advance automatically every 3 seconds.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  Unsaved changes
                </span>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href="/" target="_blank" rel="noopener noreferrer">
                  Preview
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                type="submit"
                form="home-slides-form"
                size="sm"
                disabled={isPending || hasInvalidUrl || !isDirty}
                className="hidden sm:inline-flex"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-4" aria-hidden="true" />
                )}
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <form id="home-slides-form" onSubmit={handleSubmit}>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-4">
                {urls.map((url, index) => {
                  const invalid =
                    url.trim().length > 0 && !isSafeSlideUrl(url);
                  const inputId = `home-slide-${index + 1}`;
                  const helpId = `${inputId}-help`;

                  return (
                    <section
                      key={index}
                      className={cn(
                        "overflow-hidden rounded-2xl border bg-card shadow-sm transition-colors",
                        invalid ? "border-destructive/60" : "border-border",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <h2 className="text-sm font-semibold text-foreground">
                              Slide {index + 1}
                            </h2>
                            <p className="truncate text-xs text-muted-foreground">
                              {url.trim()
                                ? "Image added"
                                : "Empty slot — hidden on the homepage"}
                            </p>
                          </div>
                        </div>

                        {url.trim() && (
                          <button
                            type="button"
                            onClick={() => clearSlide(index)}
                            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                            Clear
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_190px]">
                        <div className="space-y-2">
                          <label
                            htmlFor={inputId}
                            className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                          >
                            Image link
                          </label>
                          <input
                            id={inputId}
                            type="text"
                            inputMode="url"
                            value={url}
                            onChange={(event) =>
                              updateSlide(index, event.target.value)
                            }
                            placeholder="https://example.com/banner.jpg"
                            spellCheck={false}
                            autoComplete="url"
                            autoCapitalize="none"
                            aria-invalid={invalid || undefined}
                            aria-describedby={helpId}
                            className={cn(
                              "h-10 w-full rounded-xl border bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring",
                              invalid
                                ? "border-destructive/60 focus-visible:ring-destructive/40"
                                : "border-input",
                            )}
                          />
                          {invalid ? (
                            <p
                              id={helpId}
                              className="text-xs font-medium text-destructive"
                            >
                              Enter a valid https:// link or a path starting
                              with /.
                            </p>
                          ) : (
                            <p
                              id={helpId}
                              className="text-xs text-muted-foreground"
                            >
                              Use a public https:// link or a path inside{" "}
                              <code className="rounded bg-secondary px-1 py-0.5 text-[11px]">
                                /public
                              </code>
                              .
                            </p>
                          )}
                        </div>

                        <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-secondary/60">
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground/60">
                            <ImageIcon className="size-5" aria-hidden="true" />
                            <span className="text-[10px] font-medium">
                              {url.trim() ? "Preview" : "No image"}
                            </span>
                          </div>
                          {url.trim() && !invalid && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={url}
                              src={url}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="relative h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>

              <aside className="space-y-4">
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground">
                    Slide tips
                  </h2>
                  <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                      Use wide images, ideally 1600 × 680 (about 21:9).
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                      Keep important content near the center — edges may crop on
                      smaller screens.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                      Empty slots are skipped. If every slot is empty, built-in
                      placeholder images are shown.
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Active slides
                    </span>
                    <span className="font-display text-lg font-bold text-foreground">
                      {configuredCount}/{HOME_SLIDE_LIMIT}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{
                        width: `${(configuredCount / HOME_SLIDE_LIMIT) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Changes go live on the homepage as soon as you save.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={resetToDefaults}
                    disabled={isPending}
                  >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    Use default images
                  </Button>
                </div>
              </aside>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
              <div aria-live="polite" className="min-w-0">
                {message ? (
                  <p
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium",
                      message.type === "success"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-destructive",
                    )}
                  >
                    {message.type === "success" ? (
                      <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
                    )}
                    {message.text}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isDirty
                      ? "You have unsaved changes."
                      : "All changes are saved."}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isPending || hasInvalidUrl || !isDirty}
                className="w-full sm:w-auto"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-4" aria-hidden="true" />
                )}
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
