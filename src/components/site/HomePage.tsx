"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Library, ListChecks, type LucideIcon } from "lucide-react";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SubjectCard } from "@/components/site/SubjectCard";
import { PricingTabs } from "@/components/site/PricingTabs";
import { CountUp } from "@/components/site/CountUp";
import { HeroCarousel } from "@/components/site/HeroCarousel";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import type { Subject } from "@/data/subjects";
import { cn } from "@/lib/utils";

const statAccent = {
  chip: "bg-primary/10 text-primary ring-primary/20",
  glow: "bg-primary/10",
  line: "from-primary/70 via-primary/30 to-transparent",
  hover: "hover:border-primary/30",
} as const;

export type RecentQuestion = {
  id: string;
  question: string;
  source: string | null;
  topic: string | null;
  year: string | null;
};

type HomePageProps = {
  subjects: Subject[];
  totalQuestions?: number | undefined;
  mcqTotal?: number | undefined;
  recentQuestions?: RecentQuestion[] | undefined;
  slides: string[];
};

export function HomePage({
  subjects,
  totalQuestions,
  mcqTotal,
  recentQuestions = [],
  slides,
}: HomePageProps) {
  const [query, setQuery] = useState("");
  const { tr, num } = useI18n();

  const filteredSubjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.chapters.some((c) => c.toLowerCase().includes(q)),
    );
  }, [query, subjects]);

  const stats: { icon: LucideIcon; value: number; label: string }[] = [];
  if (typeof totalQuestions === "number") {
    stats.push({
      icon: BookOpen,
      value: totalQuestions,
      label: tr("Questions", "প্রশ্ন"),
    });
  }
  if (typeof mcqTotal === "number") {
    stats.push({
      icon: ListChecks,
      value: mcqTotal,
      label: tr("MCQ questions", "MCQ প্রশ্ন"),
    });
  }
  stats.push({
    icon: Library,
    value: subjects.length,
    label: tr("Subjects", "বিষয়"),
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <section className="relative">
          <h1 className="sr-only">
            {tr(
              "QuestionBank — a subject-wise question bank for every exam",
              "QuestionBank — প্রতিটি পরীক্ষার জন্য বিষয়ভিত্তিক প্রশ্ন ব্যাংক",
            )}
          </h1>
          <HeroCarousel slides={slides} />
        </section>

        <section
          aria-label={tr("QuestionBank at a glance", "এক নজরে QuestionBank")}
          className="relative mx-auto mt-8 max-w-4xl px-4 sm:mt-10 sm:px-6"
        >
          <div
            className={cn(
              "grid gap-2.5 sm:gap-4",
              stats.length <= 1
                ? "grid-cols-1"
                : stats.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3",
            )}
          >
            {stats.map(({ icon: Icon, value, label }) => {
              return (
                <div
                  key={label}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-border/70 bg-linear-to-b from-card via-card to-secondary/30 p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl sm:p-5",
                    statAccent.hover,
                  )}
                >
                  <div
                    className={cn(
                      "pointer-events-none absolute -right-6 -top-8 size-24 rounded-full blur-2xl",
                      statAccent.glow,
                    )}
                    aria-hidden="true"
                  />
                  <Icon
                    className="pointer-events-none absolute -bottom-6 -right-3 hidden size-24 text-primary/[0.06] sm:block"
                    strokeWidth={1.25}
                    aria-hidden="true"
                  />
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 h-0.5 bg-linear-to-r",
                      statAccent.line,
                    )}
                    aria-hidden="true"
                  />

                  <div className="relative flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:text-left">
                    <div className="min-w-0">
                      <p className="font-display text-xl font-bold leading-none tracking-tight text-foreground tabular-nums sm:text-3xl lg:text-4xl">
                        <CountUp value={value} />
                      </p>
                      <p className="mt-1.5 text-[10px] font-semibold uppercase leading-tight tracking-[0.12em] text-muted-foreground sm:mt-2 sm:text-[11px]">
                        {label}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "order-first flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 sm:order-last sm:size-11 sm:rounded-2xl",
                        statAccent.chip,
                      )}
                    >
                      <Icon className="size-4 sm:size-5" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="subjects-heading" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="subjects-heading" className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                {tr("Explore subjects", "বিষয় ঘুরে দেখুন")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {query
                  ? tr(`Showing results for “${query}”`, `“${query}” এর ফলাফল দেখানো হচ্ছে`)
                  : tr(
                      `${num(subjects.length)} subjects with live question counts.`,
                      `${num(subjects.length)}টি বিষয়, লাইভ প্রশ্ন সংখ্যা সহ।`,
                    )}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/subjects">{tr("View all subjects", "সব বিষয় দেখুন")}</Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSubjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </div>
          {filteredSubjects.length === 0 && (
            <p className="mt-10 text-center text-sm text-muted-foreground">
              {subjects.length === 0
                ? tr(
                    "Subject data is unavailable right now. Please try again shortly.",
                    "এই মুহূর্তে বিষয়ের তথ্য পাওয়া যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।",
                  )
                : tr(
                    `No subjects match “${query}”. Try “Physics” or “Calculus”.`,
                    `“${query}” এর সাথে কোনো বিষয় মেলেনি। “Physics” বা “Calculus” চেষ্টা করুন।`,
                  )}
            </p>
          )}
        </section>

        <section aria-labelledby="plans-heading" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="text-center">
            <h2 id="plans-heading" className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {tr("Plans for students & teachers", "শিক্ষার্থী ও শিক্ষকদের জন্য প্ল্যান")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tr(
                "Start free, then pick the plan that fits how you learn or teach.",
                "বিনামূল্যে শুরু করুন, তারপর আপনার পড়া বা পড়ানোর ধরন অনুযায়ী প্ল্যান বেছে নিন।",
              )}
            </p>
          </div>

          <PricingTabs />

          <div className="mt-8 text-center">
            <Button variant="link" asChild>
              <Link href="/plans">
                {tr("Compare all plan details →", "সব প্ল্যানের বিস্তারিত তুলনা করুন →")}
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
