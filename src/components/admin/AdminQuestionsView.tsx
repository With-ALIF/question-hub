"use client";

import { useTransition, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  ListChecks,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";

import { AdminQuestionCard } from "./AdminQuestionCard";
import { AdminSidebar } from "./AdminSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatChapterLabel } from "@/data/chapters";
import type { QuestionFilterOptions, QuestionFilters } from "@/lib/questions/filters";
import type {
  QuestionManifest,
  QuestionSubject,
  QuestionType,
  StorageQuestion,
} from "@/lib/questions/storage";
import { cn } from "@/lib/utils";

const SUBJECT_NAMES_BN: Record<string, string> = {
  physics: "পদার্থবিজ্ঞান",
  chemistry: "রসায়ন",
  mathematics: "উচ্চতর গণিত",
  biology: "জীববিজ্ঞান",
  ict: "তথ্য ও যোগাযোগ প্রযুক্তি",
  other: "অন্যান্য বিষয়",
};

export function AdminQuestionsView({
  manifest,
  subjects,
  selectedSubject,
  selectedType,
  questions,
  page,
  pageSize,
  totalPages,
  total,
  facetFilters,
  activeFilters,
  role = "admin",
}: {
  manifest: QuestionManifest | null;
  subjects: QuestionSubject[];
  selectedSubject: string;
  selectedType: QuestionType;
  questions: StorageQuestion[];
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  facetFilters: QuestionFilterOptions | null;
  activeFilters: QuestionFilters;
  role: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q") ?? activeFilters.topic ?? ""
  );
  const [jumpPageInput, setJumpPageInput] = useState(String(page));

  const updateUrlParams = (newParams: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(newParams)) {
      if (val === null || val === "" || val === undefined) {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    }
    startTransition(() => {
      router.push(`/admin/questions?${next.toString()}`);
    });
  };

  const handleSubjectChange = (slug: string) => {
    updateUrlParams({
      subject: slug,
      page: "1",
      chapter: null,
      topic: null,
      un: null,
      year: null,
      q: null,
    });
  };

  const handleTypeChange = (type: QuestionType) => {
    updateUrlParams({ type, page: "1" });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({ q: searchQuery.trim() || null, page: "1" });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    startTransition(() => {
      router.push(`/admin/questions?subject=${selectedSubject}`);
    });
  };

  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      updateUrlParams({ page: String(p) });
    } else {
      setJumpPageInput(String(page));
    }
  };

  const currentSubjectObj = subjects.find((s) => s.slug === selectedSubject);
  const totalSystemQuestions = manifest?.totalQuestions ?? 0;
  const totalMcq = manifest?.mcqTotal ?? 0;
  const totalWritten = manifest?.writtenTotal ?? 0;

  const fromNumber = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toNumber = Math.min(page * pageSize, total);

  // Client-side text filter if search query is provided
  const displayQuestions = searchQuery.trim()
    ? questions.filter((q) => {
        const query = searchQuery.toLowerCase();
        return (
          q.question_text.toLowerCase().includes(query) ||
          (q.keyword && q.keyword.toLowerCase().includes(query)) ||
          (q.topic_code && q.topic_code.toLowerCase().includes(query)) ||
          (q.institution && q.institution.toLowerCase().includes(query)) ||
          q.id.toLowerCase().includes(query) ||
          (q.external_id !== null && q.external_id !== undefined && String(q.external_id).includes(query)) ||
          (q.answer && q.answer.toLowerCase().includes(query))
        );
      })
    : questions;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background w-full overflow-x-hidden">
      {/* Shared Admin Sidebar */}
      <AdminSidebar
        currentPath="/admin/questions"
        role={role}
        totalQuestions={totalSystemQuestions}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col w-full">
        {/* Top Header */}
        <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-20">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  প্রশ্নব্যাংক পরিচালনা
                </h1>
                <Badge variant="outline" className="hidden sm:inline-flex bg-primary/10 text-primary border-primary/20">
                  {total.toLocaleString()} টি প্রশ্ন
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                সম্পূর্ণ ডাটাবেসের প্রশ্ন পর্যবেক্ষণ, ফিল্টার ও সমাধান যাচাইকরণ
              </p>
            </div>

            {/* Quick Metrics Pills */}
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-3 text-xs bg-muted/50 rounded-xl px-3 py-1.5 border border-border/60">
                <span className="text-muted-foreground">
                  মোট প্রশ্ন: <strong className="text-foreground">{totalSystemQuestions.toLocaleString()}</strong>
                </span>
                <span className="text-border">|</span>
                <span className="text-muted-foreground">
                  MCQ: <strong className="text-foreground">{totalMcq.toLocaleString()}</strong>
                </span>
                <span className="text-border">|</span>
                <span className="text-muted-foreground">
                  লিখিত: <strong className="text-foreground">{totalWritten.toLocaleString()}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Subject Pills Row */}
          <div className="overflow-x-auto border-t border-border/50 px-4 py-2 sm:px-6 bg-card/30 scrollbar-none">
            <div className="flex items-center gap-1.5 min-w-max">
              {subjects.map((sub) => {
                const isSelected = sub.slug === selectedSubject;
                const banglaName = SUBJECT_NAMES_BN[sub.slug] ?? sub.name;

                return (
                  <button
                    key={sub.slug}
                    type="button"
                    onClick={() => handleSubjectChange(sub.slug)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                        : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/60"
                    )}
                  >
                    <span>{banglaName}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px]",
                        isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {sub.total.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-8 space-y-5 max-w-7xl">
          {/* Controls Bar: Type Selector + Search + Filters */}
          <Card className="border-border/80 bg-card shadow-xs">
            <CardContent className="p-4 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Type Switcher */}
                <div className="flex flex-wrap items-center rounded-xl bg-muted/60 p-1 border border-border/50 gap-1 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleTypeChange("all")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                      selectedType === "all"
                        ? "bg-background text-foreground shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    সব প্রশ্ন ({currentSubjectObj ? currentSubjectObj.total.toLocaleString() : total.toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange("mcq")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                      selectedType === "mcq"
                        ? "bg-background text-foreground shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    MCQ ({currentSubjectObj ? currentSubjectObj.mcq.toLocaleString() : ""})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange("written")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                      selectedType === "written"
                        ? "bg-background text-foreground shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    লিখিত ({currentSubjectObj ? currentSubjectObj.written.toLocaleString() : ""})
                  </button>
                </div>

                {/* Reset Filters button */}
                {(activeFilters.un || activeFilters.year || activeFilters.chapter || searchParams.get("q")) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>ফিল্টার রিসেট করুন</span>
                  </Button>
                )}
              </div>

              {/* Search and Secondary Filter Row */}
              <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
                {/* Search input */}
                <form onSubmit={handleSearchSubmit} className="relative sm:col-span-2">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="প্রশ্ন আইডি (যেমন 399548), কীওয়ার্ড বা টেক্সট দিয়ে সার্চ করুন..."
                    className="h-9 w-full rounded-xl border border-input bg-background pl-9 pr-14 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  {searchQuery && (
                    <button
                      type="submit"
                      className="absolute right-1.5 top-1.5 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground cursor-pointer"
                    >
                      সার্চ
                    </button>
                  )}
                </form>

                {/* Year Filter */}
                {facetFilters?.year?.options && facetFilters.year.options.length > 0 && (
                  <div>
                    <select
                      value={activeFilters.year ?? ""}
                      onChange={(e) => updateUrlParams({ year: e.target.value || null, page: "1" })}
                      className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">সকল শিক্ষাবর্ষ (Year)</option>
                      {facetFilters.year.options.map((facet) => (
                        <option key={facet.value} value={facet.value}>
                          {facet.value} ({facet.count})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Institution / Board Filter */}
                {facetFilters?.un?.options && facetFilters.un.options.length > 0 && (
                  <div>
                    <select
                      value={activeFilters.un ?? ""}
                      onChange={(e) => updateUrlParams({ un: e.target.value || null, page: "1" })}
                      className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">সকল প্রতিষ্ঠান / বোর্ড</option>
                      {facetFilters.un.options.map((facet) => (
                        <option key={facet.value} value={facet.value}>
                          {facet.value} ({facet.count})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Summary and Pagination Top */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground px-1">
            <p>
              দেখানো হচ্ছে <strong className="text-foreground">{fromNumber}</strong> থেকে{" "}
              <strong className="text-foreground">{toNumber}</strong> (মোট{" "}
              <strong className="text-foreground">{total.toLocaleString()}</strong> টি প্রশ্ন)
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isPending}
                onClick={() => updateUrlParams({ page: String(page - 1) })}
                className="h-8 gap-1 px-2.5 text-xs cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
                <span>আগের পেজ</span>
              </Button>

              <span className="font-medium text-foreground">
                {page} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isPending}
                onClick={() => updateUrlParams({ page: String(page + 1) })}
                className="h-8 gap-1 px-2.5 text-xs cursor-pointer"
              >
                <span>পরের পেজ</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Question Cards List */}
          <div className="space-y-4">
            {displayQuestions.length > 0 ? (
              displayQuestions.map((q, idx) => (
                <AdminQuestionCard
                  key={q.id}
                  question={q}
                  index={fromNumber + idx}
                />
              ))
            ) : (
              <Card className="border-dashed border-border p-12 text-center bg-card">
                <CardContent className="flex flex-col items-center justify-center p-0">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                    <ListChecks className="size-7" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    কোনো প্রশ্ন পাওয়া যায়নি
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                    আপনার নির্বাচিত ফিল্টার বা সার্চ দিয়ে এই মুহূর্তে কোনো প্রশ্ন মেলেনি।
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    className="mt-4 gap-2"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>সব ফিল্টার রিসেট করুন</span>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Bottom Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                পৃষ্ঠা {page} / {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isPending}
                  onClick={() => updateUrlParams({ page: String(page - 1) })}
                  className="gap-1.5 text-xs"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>পূর্ববর্তী</span>
                </Button>

                {/* Direct Page Jump Form */}
                <form onSubmit={handlePageJump} className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpPageInput}
                    onChange={(e) => setJumpPageInput(e.target.value)}
                    className="h-8 w-14 rounded-lg border border-input bg-background px-2 text-center text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <Button type="submit" variant="ghost" size="sm" className="h-8 px-2 text-xs">
                    যান
                  </Button>
                </form>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isPending}
                  onClick={() => updateUrlParams({ page: String(page + 1) })}
                  className="gap-1.5 text-xs"
                >
                  <span>পরবর্তী</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
