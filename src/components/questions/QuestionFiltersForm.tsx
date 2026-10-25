"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  QUESTION_FILTER_KEYS,
  QUESTION_TYPES,
  type QuestionFilterKey,
  type QuestionFilterFacet,
  type QuestionFilterOptions,
  type QuestionFilters,
  type QuestionSubject,
  type QuestionType,
} from "@/lib/questions/constants";
import { formatChapterLabel } from "@/data/chapters";
import { formatPaperLabel } from "@/data/papers";
import { useI18n } from "@/lib/i18n/client";

export function QuestionFiltersForm({
  subjects,
  selectedSubject,
  type,
  facetFilters,
  activeFilters,
  filtering,
}: {
  subjects: QuestionSubject[];
  selectedSubject: string;
  type: QuestionType;
  facetFilters: QuestionFilterOptions | null;
  activeFilters: QuestionFilters;
  filtering: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { tr, num, filterLabel, typeLabel, subjectName } = useI18n();

  const currentSubjectObj = subjects.find((s) => s.slug === selectedSubject);

  const handleSubjectChange = (newSubject: string) => {
    const params = new URLSearchParams();
    params.set("subject", newSubject);
    if (type && type !== "all") {
      params.set("type", type);
    }
    if (activeFilters.db) params.set("db", activeFilters.db);
    if (activeFilters.un) params.set("un", activeFilters.un);
    if (activeFilters.year) params.set("year", activeFilters.year);

    startTransition(() => {
      router.push(`/questions?${params.toString()}`);
    });
  };

  const handleTypeChange = (newType: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", newType);
    params.delete("page");

    startTransition(() => {
      router.push(`/questions?${params.toString()}`);
    });
  };

  const handleFilterChange = (key: QuestionFilterKey, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    if (key === "paper" && activeFilters.chapter && value) {
      if (!activeFilters.chapter.startsWith(value)) {
        params.delete("chapter");
      }
    }

    params.delete("page");

    startTransition(() => {
      router.push(`/questions?${params.toString()}`);
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();

    const subjectVal = String(formData.get("subject") ?? selectedSubject);
    params.set("subject", subjectVal);

    const typeVal = String(formData.get("type") ?? type);
    if (typeVal && typeVal !== "all") {
      params.set("type", typeVal);
    }

    for (const key of QUESTION_FILTER_KEYS) {
      const val = String(formData.get(key) ?? "").trim();
      if (val) {
        params.set(key, val);
      }
    }

    startTransition(() => {
      router.push(`/questions?${params.toString()}`);
    });
  };

  return (
    <form
      action="/questions"
      method="get"
      onSubmit={handleSubmit}
      className={`mt-7 rounded-xl border border-border bg-card p-4 shadow-sm transition-opacity ${
        isPending ? "opacity-75" : "opacity-100"
      }`}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tr("Subject", "বিষয়")}
          </span>
          <select
            name="subject"
            value={selectedSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            disabled={isPending}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed"
          >
            {subjects.length === 0 ? (
              <option value="physics">{tr("Physics", "পদার্থবিজ্ঞান")}</option>
            ) : (
              subjects.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {subjectName(item.slug, item.name)} ({num(item.total)})
                </option>
              ))
            )}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tr("Type", "ধরন")}
          </span>
          <select
            name="type"
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            disabled={isPending}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed"
          >
            {QUESTION_TYPES.map((item) => {
              const count = currentSubjectObj
                ? item === "mcq"
                  ? currentSubjectObj.mcq
                  : item === "written"
                    ? currentSubjectObj.written
                    : currentSubjectObj.total
                : 0;

              return (
                <option key={item} value={item}>
                  {typeLabel(item)} ({num(count)})
                </option>
              );
            })}
          </select>
        </label>

        {facetFilters &&
          QUESTION_FILTER_KEYS.map((key) => {
            const facet: QuestionFilterFacet = facetFilters[key];
            const selected = activeFilters[key] ?? "";
            const hasSelection = !selected || facet.options.some((opt) => opt.value === selected);

            return (
              <label key={key} className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {filterLabel(key)}
                </span>
                <select
                  name={key}
                  value={selected}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                  disabled={isPending}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed"
                >
                  <option value="">
                    {tr(`All (${num(facet.all)})`, `সব (${num(facet.all)})`)}
                  </option>
                  {facet.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({num(option.count)})
                    </option>
                  ))}
                  {!hasSelection && (
                    <option value={selected}>
                      {key === "chapter"
                        ? formatChapterLabel(selected)
                        : key === "paper"
                          ? formatPaperLabel(selected)
                          : selected}{" "}
                      ({num(0)})
                    </option>
                  )}
                </select>
              </label>
            );
          })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden="true" />}
            {tr("Show questions", "প্রশ্ন দেখুন")}
          </Button>
          {isPending && (
            <span className="text-xs text-muted-foreground animate-pulse">
              {tr("Syncing...", "সিঙ্ক হচ্ছে...")}
            </span>
          )}
        </div>

        {filtering && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/questions?subject=${selectedSubject}${type !== "all" ? `&type=${type}` : ""}`}>
              <X className="mr-1 size-3.5" aria-hidden="true" />
              {tr("Clear filters", "ফিল্টার মুছুন")}
            </Link>
          </Button>
        )}
      </div>
    </form>
  );
}
