"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Info, ListChecks, Loader2, Play, Target, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  INDEX_FILTER_KEYS,
  QUESTION_FILTER_KEYS,
  type QuestionFilterFacet,
  type QuestionFilterKey,
  type QuestionFilterOption,
  type QuestionFilterOptions,
  type QuestionFilters,
} from "@/lib/questions/constants";
import { formatPaperLabel } from "@/data/papers";
import { useI18n } from "@/lib/i18n/client";
import {
  MAX_PRACTICE_MINUTES,
  MAX_PRACTICE_QUESTIONS,
  type PracticeQuestion,
} from "@/lib/questions/practice-types";
import { startPracticeAction } from "@/lib/questions/practice-actions";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { ChapterMultiSelect } from "@/components/questions/ChapterMultiSelect";
import { FilterMultiSelect } from "@/components/questions/FilterMultiSelect";

type PracticeSetupCardProps = {
  subjectLabel: string;
  subjectSlug: string;
  activeFilters: QuestionFilters;
  facetFilters: QuestionFilterOptions | null;
  availableCount: number;
  actionPath?: string;
};

type SessionState = {
  questions: PracticeQuestion[];
  minutes: number;
  negative: number;
};

export function PracticeSetupCard({
  subjectLabel,
  subjectSlug,
  activeFilters,
  facetFilters,
  availableCount,
  actionPath = "/questions",
}: PracticeSetupCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { tr, num, filterLabel } = useI18n();

  const [count, setCount] = useState(() => Math.min(20, Math.max(1, availableCount)));
  const [minutes, setMinutes] = useState(15);
  const [negative, setNegative] = useState(0.25);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<
    "auth" | "forbidden" | "no_questions" | "failed" | null
  >(null);
  const [session, setSession] = useState<SessionState | null>(null);

  const effectiveCount = Math.max(1, Math.min(count, Math.max(1, availableCount)));

  const hasActiveFilters = QUESTION_FILTER_KEYS.some((key) => Boolean(activeFilters[key]));

  const clearHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());

    for (const key of QUESTION_FILTER_KEYS) params.delete(key);
    params.delete("page");

    return `${actionPath}?${params.toString()}`;
  }, [actionPath, searchParams]);

  const applyParams = (params: URLSearchParams) => {
    params.delete("page");
    startTransition(() => {
      router.push(`${actionPath}?${params.toString()}`);
    });
  };

  const handleFilterChange = (key: QuestionFilterKey, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
      if (key === "no_explanation") params.delete("has_explanation");
      if (key === "has_explanation") params.delete("no_explanation");
    } else {
      params.delete(key);
    }

    if (key === "paper" && activeFilters.chapter && value) {
      const remainingChapters = activeFilters.chapter
        .split(",")
        .filter(Boolean)
        .filter((chapter) => chapter.startsWith(value));

      if (remainingChapters.length > 0) params.set("chapter", remainingChapters.join(","));
      else params.delete("chapter");
    }

    applyParams(params);
  };

  const handleStart = async () => {
    if (starting || availableCount === 0) return;

    setStarting(true);
    setError(null);

    try {
      const result = await startPracticeAction({
        subject: subjectSlug,
        filters: activeFilters,
        count: effectiveCount,
        minutes,
        negative,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSession({
        questions: result.questions,
        minutes: result.minutes,
        negative: result.negative,
      });
    } catch {
      setError("failed");
    } finally {
      setStarting(false);
    }
  };

  const errorMessage =
    error === "auth"
      ? tr("Please log in again to start a practice session.", "অনুশীলন শুরু করতে আবার লগইন করুন।")
      : error === "forbidden"
        ? tr(
            "Your plan does not allow this practice session.",
            "আপনার প্ল্যানে এই অনুশীলন সেশনটি অনুমোদিত নয়।",
          )
        : error === "no_questions"
          ? tr(
              "No MCQs match the selected filters. Try another chapter or clear the filters.",
              "নির্বাচিত ফিল্টারে কোনো MCQ পাওয়া যায়নি। অন্য অধ্যায় বেছে নিন বা ফিল্টার মুছুন।",
            )
          : error === "failed"
            ? tr(
                "Could not start the session. Please try again.",
                "সেশন শুরু করা যায়নি। আবার চেষ্টা করুন।",
              )
            : null;

  return (
    <>
      <Card className="mt-7 overflow-hidden border-primary/25 shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-gradient-to-r from-primary/12 via-primary/5 to-transparent px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Target className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {tr("Practice session", "অনুশীলন সেশন")}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                    {subjectLabel}
                  </Badge>
                  <Badge variant="secondary">MCQ</Badge>
                  <Badge variant="outline" className="font-normal">
                    {tr(
                      `${num(availableCount)} MCQ available`,
                      `${num(availableCount)}টি MCQ পাওয়া যাবে`,
                    )}
                  </Badge>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <Link href={clearHref}>
                  <X className="size-3.5" aria-hidden="true" />
                  {tr("Clear filters", "ফিল্টার মুছুন")}
                </Link>
              </Button>
            )}
          </div>

          <div className="p-4 sm:p-5">
            <div className="mb-2 flex items-center gap-2">
              <ListChecks className="size-4 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {tr("Question filters", "প্রশ্নের ফিল্টার")}
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {facetFilters &&
                INDEX_FILTER_KEYS.map((key) => {
                  const facet: QuestionFilterFacet | undefined = facetFilters[key];
                  const selected = activeFilters[key] ?? "";

                  if (!facet) return null;

                  if (key === "chapter") {
                    const selectedChapters = selected
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean);

                    return (
                      <div key={key} className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {filterLabel(key)}
                        </span>
                        <ChapterMultiSelect
                          options={facet.options}
                          selectedValues={selectedChapters}
                          totalCount={facet.all}
                          disabled={isPending}
                          onChange={(values) => handleFilterChange("chapter", values.join(","))}
                        />
                      </div>
                    );
                  }

                  if (key === "un" || key === "unit" || key === "set") {
                    const selectedValues = selected
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean);

                    if (facet.options.length === 0 && selectedValues.length === 0) return null;

                    const isInstitution = key === "un";
                    const isUnit = key === "unit";

                    return (
                      <div key={key} className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {filterLabel(key)}
                        </span>
                        <FilterMultiSelect
                          name={key}
                          title={
                            isInstitution
                              ? tr("Select University / Institution", "বিশ্ববিদ্যালয় / প্রতিষ্ঠান")
                              : isUnit
                                ? tr("Select University Unit", "বিশ্ববিদ্যালয় ইউনিট নির্বাচন করুন")
                                : tr("Select Question Set", "প্রশ্ন সেট নির্বাচন করুন")
                          }
                          searchPlaceholder={
                            isInstitution
                              ? tr("Search institution...", "প্রতিষ্ঠান খুঁজুন...")
                              : isUnit
                                ? tr("Search unit...", "ইউনিট খুঁজুন...")
                                : tr("Search set...", "সেট খুঁজুন...")
                          }
                          allLabel={
                            isInstitution
                              ? tr("All institutions", "সকল প্রতিষ্ঠান")
                              : isUnit
                                ? tr("All units", "সকল ইউনিট")
                                : tr("All sets", "সকল সেট")
                          }
                          unitLabel={
                            isInstitution
                              ? tr("institutions selected", "টি প্রতিষ্ঠান")
                              : isUnit
                                ? tr("units selected", "টি ইউনিট")
                                : tr("sets selected", "টি সেট")
                          }
                          options={facet.options}
                          selectedValues={selectedValues}
                          totalCount={facet.all}
                          disabled={isPending}
                          onChange={(values) => handleFilterChange(key, values.join(","))}
                        />
                      </div>
                    );
                  }

                  const hasSelection =
                    !selected || facet.options.some((option) => option.value === selected);

                  return (
                    <label key={key} className="space-y-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {filterLabel(key)}
                      </span>
                      <select
                        name={key}
                        value={selected}
                        onChange={(event) => handleFilterChange(key, event.target.value)}
                        disabled={isPending}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {tr(`All (${num(facet.all)})`, `সব (${num(facet.all)})`)}
                        </option>
                        {facet.options.map((option: QuestionFilterOption) => (
                          <option key={option.value} value={option.value}>
                            {option.label} ({num(option.count)})
                          </option>
                        ))}
                        {!hasSelection && (
                          <option value={selected}>
                            {key === "paper" ? formatPaperLabel(selected) : selected}{" "}
                            ({num(0)})
                          </option>
                        )}
                      </select>
                    </label>
                  );
                })}

              <div className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {filterLabel("no_explanation")}
                </span>
                <label className="flex h-9 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    value="true"
                    checked={activeFilters.no_explanation === "true"}
                    onChange={(event) =>
                      handleFilterChange("no_explanation", event.target.checked ? "true" : "")
                    }
                    disabled={isPending}
                    className="size-4 rounded border-input text-primary focus:ring-1 focus:ring-ring"
                  />
                  <span className="text-sm">{tr("No Explanation", "ব্যাখ্যা নেই")}</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {filterLabel("has_explanation")}
                </span>
                <label className="flex h-9 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    value="true"
                    checked={activeFilters.has_explanation === "true"}
                    onChange={(event) =>
                      handleFilterChange("has_explanation", event.target.checked ? "true" : "")
                    }
                    disabled={isPending}
                    className="size-4 rounded border-input text-primary focus:ring-1 focus:ring-ring"
                  />
                  <span className="text-sm">{tr("Has Explanation", "ব্যাখ্যা আছে")}</span>
                </label>
              </div>
            </div>

            {!facetFilters && (
              <p className="mt-3 text-xs text-muted-foreground">
                {tr(
                  "Detailed filters are unavailable for this subject right now.",
                  "এই বিষয়ের জন্য বিস্তারিত ফিল্টার এখন উপলব্ধ নেই।",
                )}
              </p>
            )}

            <div className="mt-5 rounded-xl border border-border bg-secondary/20 p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tr("Session settings", "সেশন সেটিংস")}
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    {tr("Time (minutes)", "সময় (মিনিট)")}
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={MAX_PRACTICE_MINUTES}
                    value={minutes}
                    onChange={(event) => setMinutes(Number(event.target.value))}
                    disabled={starting}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    {tr("Number of questions", "প্রশ্নের সংখ্যা")}
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={Math.max(1, availableCount)}
                    value={effectiveCount}
                    onChange={(event) => setCount(Number(event.target.value))}
                    disabled={starting || availableCount === 0}
                  />
                  <span className="block text-[11px] text-muted-foreground">
                    {tr(
                      `Max ${num(availableCount)} from current filters`,
                      `বর্তমান ফিল্টারে সর্বোচ্চ ${num(availableCount)}টি`,
                    )}
                  </span>
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    {tr("Negative marks per wrong answer", "প্রতি ভুল উত্তরে নেগেটিভ মার্ক")}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.25}
                    value={negative}
                    onChange={(event) => setNegative(Number(event.target.value))}
                    disabled={starting}
                  />
                  <span className="block text-[11px] text-muted-foreground">
                    {tr(
                      "Use 0 for no negative marking",
                      "নেগেটিভ মার্কিং না চাইলে ০ দিন",
                    )}
                  </span>
                </label>
              </div>
            </div>

            {errorMessage && (
              <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {errorMessage}
              </p>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <p>
                  {tr(
                    "The timer starts as soon as you press Start. Answers and explanations appear in the result.",
                    "শুরু করুন চাপলেই টাইমার চালু হবে। ফলাফলেই উত্তর ও ব্যাখ্যা দেখা যাবে।",
                  )}
                </p>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={handleStart}
                disabled={starting || availableCount === 0 || isPending}
                className="w-full shrink-0 gap-2 sm:w-auto"
              >
                {starting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Play className="size-4" aria-hidden="true" />
                )}
                {starting
                  ? tr("Preparing...", "প্রস্তুত হচ্ছে...")
                  : tr("Start practice", "শুরু করুন")}
              </Button>
            </div>

            {availableCount === 0 && (
              <p className="mt-2 text-right text-[11px] text-muted-foreground">
                {tr(
                  "Choose different filters to unlock a session.",
                  "সেশন শুরু করতে অন্য ফিল্টার বেছে নিন।",
                )}
              </p>
            )}

            {isPending && (
              <p className="mt-2 text-right text-[11px] text-muted-foreground animate-pulse">
                {tr("Updating filters...", "ফিল্টার আপডেট হচ্ছে...")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {session && (
        <PracticeSession
          questions={session.questions}
          minutes={session.minutes}
          negative={session.negative}
          subjectLabel={subjectLabel}
          onExit={() => setSession(null)}
        />
      )}
    </>
  );
}
