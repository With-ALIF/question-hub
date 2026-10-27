"use client";

import { useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  INDEX_FILTER_KEYS,
  QUESTION_FILTER_KEYS,
  QUESTION_TYPES,
  type QuestionFilterKey,
  type QuestionFilterFacet,
  type QuestionFilterOption,
  type QuestionFilterOptions,
  type QuestionFilters,
  type QuestionSubject,
  type QuestionType,
} from "@/lib/questions/constants";
import { formatChapterLabel } from "@/data/chapters";
import { formatPaperLabel } from "@/data/papers";
import { useI18n } from "@/lib/i18n/client";
import { ChapterMultiSelect } from "./ChapterMultiSelect";
import { FilterMultiSelect } from "./FilterMultiSelect";

export function QuestionFiltersForm({
  subjects,
  selectedSubject,
  type,
  facetFilters,
  activeFilters,
  filtering,
  actionPath = "/questions",
}: {
  subjects: QuestionSubject[];
  selectedSubject: string;
  type: QuestionType;
  facetFilters: QuestionFilterOptions | null;
  activeFilters: QuestionFilters;
  filtering: boolean;
  actionPath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { tr, num, filterLabel, typeLabel, subjectName } = useI18n();

  const selectedSubjectList = useMemo(() => {
    return selectedSubject.split(",").map((s) => s.trim()).filter(Boolean);
  }, [selectedSubject]);

  const subjectOptions = useMemo<QuestionFilterOption[]>(() => {
    return subjects.map((item) => ({
      value: item.slug,
      label: subjectName(item.slug, item.name),
      count: type === "mcq" ? item.mcq : type === "written" ? item.written : item.total,
    }));
  }, [subjects, type, subjectName]);

  const totalSubjectsCount = useMemo(() => {
    return subjectOptions.reduce((acc: number, cur: QuestionFilterOption) => acc + cur.count, 0);
  }, [subjectOptions]);

  const currentSubjectObj = subjects.find((s) => s.slug === selectedSubject);

  const handleSubjectChange = (newSubject: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSubject) {
      params.set("subject", newSubject);
    } else {
      params.delete("subject");
    }
    params.delete("chapter");
    params.delete("paper");
    params.delete("topic");
    params.delete("page");

    startTransition(() => {
      router.push(`${actionPath}?${params.toString()}`);
    });
  };

  const handleTypeChange = (newType: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", newType);
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
      const selectedChaps = activeFilters.chapter.split(",").filter(Boolean);
      const remainingChaps = selectedChaps.filter((ch) => ch.startsWith(value));
      if (remainingChaps.length > 0) {
        params.set("chapter", remainingChaps.join(","));
      } else {
        params.delete("chapter");
      }
    }

    params.delete("page");

    startTransition(() => {
      router.push(`${actionPath}?${params.toString()}`);
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
      if (key === "no_explanation" || key === "has_explanation") {
        const val = formData.get(key);
        if (val === "true" || val === "on" || val === "1") {
          params.set(key, "true");
        }
      } else {
        const val = String(formData.get(key) ?? "").trim();
        if (val) {
          params.set(key, val);
        }
      }
    }

    // Mutual exclusivity
    if (params.get("no_explanation") === "true" && params.get("has_explanation") === "true") {
      params.delete("has_explanation");
    }

    startTransition(() => {
      router.push(`${actionPath}?${params.toString()}`);
    });
  };

  return (
    <form
      action={actionPath}
      method="get"
      onSubmit={handleSubmit}
      className={`mt-7 rounded-xl border border-border bg-card p-4 shadow-sm transition-opacity ${
        isPending ? "opacity-75" : "opacity-100"
      }`}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tr("Subject", "বিষয়")}
          </span>
          <FilterMultiSelect
            name="subject"
            title={tr("Select Subjects", "বিষয় নির্বাচন করুন")}
            searchPlaceholder={tr("Search subject...", "বিষয় খুঁজুন...")}
            allLabel={tr("All subjects", "সকল বিষয়")}
            unitLabel={tr("subjects selected", "টি বিষয়")}
            options={subjectOptions}
            selectedValues={selectedSubjectList}
            totalCount={totalSubjectsCount}
            disabled={isPending}
            onChange={(values) => handleSubjectChange(values.join(","))}
          />
        </div>

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
          INDEX_FILTER_KEYS.map((key) => {
            const facet: QuestionFilterFacet | undefined = facetFilters[key];
            const selected = activeFilters[key] ?? "";

            if (!facet) return null;

            if (key === "chapter") {
              const selectedChapters = selected.split(",").map((s) => s.trim()).filter(Boolean);
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

            if (key === "un") {
              const selectedUns = selected.split(",").map((s) => s.trim()).filter(Boolean);
              return (
                <div key={key} className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {filterLabel(key)}
                  </span>
                  <FilterMultiSelect
                    name="un"
                    title={tr("Select University / Institution", "বিশ্ববিদ্যালয় / প্রতিষ্ঠান")}
                    searchPlaceholder={tr("Search institution...", "প্রতিষ্ঠান খুঁজুন...")}
                    allLabel={tr("All institutions", "সকল প্রতিষ্ঠান")}
                    unitLabel={tr("institutions selected", "টি প্রতিষ্ঠান")}
                    options={facet.options}
                    selectedValues={selectedUns}
                    totalCount={facet.all}
                    disabled={isPending}
                    onChange={(values) => handleFilterChange("un", values.join(","))}
                  />
                </div>
              );
            }

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
                  <option value="">{tr(`All (${num(facet.all)})`, `সব (${num(facet.all)})`)}</option>
                  {facet.options.map((option) => (
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

        {/* no_explanation filter — always visible */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {filterLabel("no_explanation")}
          </span>
          <label className="flex h-9 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name="no_explanation"
              value="true"
              checked={activeFilters.no_explanation === "true"}
              onChange={(e) =>
                handleFilterChange("no_explanation", e.target.checked ? "true" : "")
              }
              disabled={isPending}
              className="size-4 rounded border-input text-primary focus:ring-1 focus:ring-ring"
            />
            <span className="text-sm">{tr("No Explanation", "ব্যাখ্যা নেই")}</span>
          </label>
        </div>

        {/* has_explanation filter — always visible */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {filterLabel("has_explanation")}
          </span>
          <label className="flex h-9 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name="has_explanation"
              value="true"
              checked={activeFilters.has_explanation === "true"}
              onChange={(e) =>
                handleFilterChange("has_explanation", e.target.checked ? "true" : "")
              }
              disabled={isPending}
              className="size-4 rounded border-input text-primary focus:ring-1 focus:ring-ring"
            />
            <span className="text-sm">{tr("Has Explanation", "ব্যাখ্যা আছে")}</span>
          </label>
        </div>
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
            <Link href={`${actionPath}?subject=${selectedSubject}${type !== "all" ? `&type=${type}` : ""}`}>
              <X className="mr-1 size-3.5" aria-hidden="true" />
              {tr("Clear filters", "ফিল্টার মুছুন")}
            </Link>
          </Button>
        )}
      </div>
    </form>
  );
}
