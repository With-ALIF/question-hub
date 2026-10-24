"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  BookOpenCheck,
  Filter,
  Layers,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { QuestionCard } from "@/components/questions/QuestionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  clearAllSavedQuestions,
  getSavedQuestions,
  SAVED_QUESTIONS_EVENT,
  type SavedQuestionItem,
} from "@/lib/saved-questions";
import { cn } from "@/lib/utils";

const SUBJECT_CONFIG: { slug: string; name: string }[] = [
  { slug: "all", name: "সব বিষয়" },
  { slug: "physics", name: "পদার্থবিজ্ঞান" },
  { slug: "chemistry", name: "রসায়ন" },
  { slug: "mathematics", name: "উচ্চতর গণিত" },
  { slug: "biology", name: "জীববিজ্ঞান" },
  { slug: "ict", name: "আইসিটি" },
  { slug: "other", name: "সাধারণ বিষয়" },
];

function inferSubject(question: SavedQuestionItem): string {
  if (question.subject) return question.subject.toLowerCase();
  const code = String(question.topic_code ?? "").trim().toUpperCase();
  if (/^P(?:-|$)/.test(code)) return "physics";
  if (/^C(?:-|$)/.test(code)) return "chemistry";
  if (/^M(?:-|$)/.test(code)) return "mathematics";
  if (/^B(?:-|$)/.test(code)) return "biology";
  if (/^ICT(?:-|$)/.test(code)) return "ict";
  return "other";
}

export function SavedQuestionsView() {
  const [questions, setQuestions] = useState<SavedQuestionItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "mcq" | "written">("all");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setQuestions(getSavedQuestions());
    setMounted(true);

    const handleUpdate = () => {
      setQuestions(getSavedQuestions());
    };

    window.addEventListener(SAVED_QUESTIONS_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(SAVED_QUESTIONS_EVENT, handleUpdate);
    };
  }, []);

  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = { all: questions.length };
    for (const q of questions) {
      const sub = inferSubject(q);
      counts[sub] = (counts[sub] || 0) + 1;
    }
    return counts;
  }, [questions]);

  const mcqCount = useMemo(() => questions.filter((q) => q.is_mcq).length, [questions]);
  const writtenCount = useMemo(() => questions.filter((q) => !q.is_mcq).length, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Subject filter
      if (subjectFilter !== "all") {
        const sub = inferSubject(q);
        if (sub !== subjectFilter) return false;
      }

      // Type filter
      if (typeFilter === "mcq" && !q.is_mcq) return false;
      if (typeFilter === "written" && q.is_mcq) return false;

      // Search query
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const text = (q.question_text || "").toLowerCase();
        const chapter = (q.topic_code || "").toLowerCase();
        const inst = (q.institution || "").toLowerCase();
        const yr = (q.year || "").toLowerCase();
        const kw = (q.keyword || "").toLowerCase();
        const id = String(q.external_id || "");

        const matches =
          text.includes(query) ||
          chapter.includes(query) ||
          inst.includes(query) ||
          yr.includes(query) ||
          kw.includes(query) ||
          id === query;

        if (!matches) return false;
      }

      return true;
    });
  }, [questions, subjectFilter, typeFilter, search]);

  const handleClearAll = () => {
    clearAllSavedQuestions();
    setQuestions([]);
    setShowClearConfirm(false);
  };

  if (!mounted) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <BookmarkCheck className="size-3.5" aria-hidden="true" />
              <span>রিভিশন সংগ্রহ</span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              সেভ করা প্রশ্নাবলি
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              অনুশীলনের সময় আপনার বুকমার্ক করা গুরুত্বপূর্ণ ও কঠিন প্রশ্নগুলো এখানে সংরক্ষিত আছে।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
              <Link href="/questions">
                <BookOpenCheck className="size-3.5" />
                <span>আরও প্রশ্ন অনুশীলন</span>
              </Link>
            </Button>

            {questions.length > 0 && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                className="gap-1.5 text-xs cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>সব মুছুন</span>
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">সংক্ষিপ্ত তথ্য:</span>
          <Badge variant="secondary" className="gap-1.5 font-normal">
            <span>মোট সংরক্ষিত:</span>
            <strong className="text-foreground">{questions.length}</strong>
          </Badge>
          <Badge variant="outline" className="gap-1.5 font-normal">
            <span>MCQ:</span>
            <strong className="text-foreground">{mcqCount}</strong>
          </Badge>
          <Badge variant="outline" className="gap-1.5 font-normal">
            <span>Written:</span>
            <strong className="text-foreground">{writtenCount}</strong>
          </Badge>
        </div>
      </div>

      {/* Confirmation Modal for Clearing All */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-destructive">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="size-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">
                সকল সংরক্ষিত প্রশ্ন মুছে ফেলবেন?
              </h3>
            </div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              এটি করলে আপনার বুকমার্ক করা সমস্ত ({questions.length}টি) প্রশ্ন তালিকা থেকে স্থায়ীভাবে মুছে যাবে।
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowClearConfirm(false)}
              >
                বাতিল
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
              >
                হ্যাঁ, সব মুছে ফেলুন
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filtering & Search Bar */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="প্রশ্ন, অধ্যায় বা বিশ্ববিদ্যালয়ের নাম দিয়ে খুঁজুন..."
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-8 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Type Filter Buttons */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/30 p-1">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  typeFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                সব
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("mcq")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  typeFilter === "mcq"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                MCQ ({mcqCount})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("written")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  typeFilter === "written"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                লিখিত ({writtenCount})
              </button>
            </div>
          </div>

          {/* Subject Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {SUBJECT_CONFIG.map((sub) => {
              const count = subjectCounts[sub.slug] || 0;
              if (sub.slug !== "all" && count === 0) return null;
              const isSelected = subjectFilter === sub.slug;

              return (
                <button
                  key={sub.slug}
                  type="button"
                  onClick={() => setSubjectFilter(sub.slug)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  <span>{sub.name}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px]",
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {questions.length === 0 ? (
        <Card className="border-border/80 bg-card p-10 text-center shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-0">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
              <Bookmark className="size-8" />
            </span>
            <h2 className="mt-4 font-display text-xl font-bold text-foreground">
              এখনো কোনো প্রশ্ন সেভ করা হয়নি
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
              অনুশীলনের সময় প্রশ্নের ওপর থাকা “সেভ” বাটনে ক্লিক করে যে কোনো গুরুত্বপূর্ণ প্রশ্ন এখানে সংরক্ষণ করে রাখতে পারেন।
            </p>
            <Button asChild className="mt-6 gap-2">
              <Link href="/questions">
                <BookOpenCheck className="size-4" />
                <span>প্রশ্ন অনুশীলন শুরু করুন</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredQuestions.length === 0 ? (
        <Card className="border-border/80 bg-card p-8 text-center shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-0">
            <Filter className="size-10 text-muted-foreground/60" />
            <h3 className="mt-3 font-display text-base font-semibold text-foreground">
              কোনো প্রশ্ন পাওয়া যায়নি
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              আপনার বর্তমান সার্চ বা ফিল্টারের সাথে কোনো সংরক্ষিত প্রশ্ন মেলেনি।
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setSubjectFilter("all");
                setTypeFilter("all");
              }}
              className="mt-4 gap-1.5 text-xs"
            >
              <RotateCcw className="size-3.5" />
              <span>ফিল্টার রিসেট করুন</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
            <span>
              প্রদর্শিত হচ্ছে: <strong className="text-foreground">{filteredQuestions.length}</strong>টি প্রশ্ন
            </span>
            {(search || subjectFilter !== "all" || typeFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSubjectFilter("all");
                  setTypeFilter("all");
                }}
                className="text-primary hover:underline cursor-pointer"
              >
                ফিল্টার মুছুন
              </button>
            )}
          </div>

          <div className="grid gap-4">
            {filteredQuestions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
