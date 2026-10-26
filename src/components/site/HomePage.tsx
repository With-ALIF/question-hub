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
              "grid divide-x divide-border/60 border-y border-border/50",
              stats.length <= 1
                ? "grid-cols-1"
                : stats.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3",
            )}
          >
            {stats.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="group flex flex-col items-center px-2 py-5 text-center sm:px-6 sm:py-6"
              >
                <span className="flex max-w-full items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground transition-colors group-hover:text-foreground sm:text-[11px] sm:tracking-[0.16em]">
                  <Icon className="size-3 shrink-0 text-primary sm:size-3.5" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </span>
                <p className="mt-2 font-display text-xl font-bold leading-none tracking-tight text-foreground tabular-nums sm:mt-3 sm:text-4xl lg:text-[2.75rem]">
                  <CountUp value={value} />
                </p>
                <span
                  className="mt-2 h-px w-6 rounded-full bg-linear-to-r from-primary/70 to-transparent transition-all duration-300 group-hover:w-10 sm:mt-3 sm:w-10"
                  aria-hidden="true"
                />
              </div>
            ))}
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
