"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, ListChecks, Search, Sparkles, type LucideIcon } from "lucide-react";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SubjectCard } from "@/components/site/SubjectCard";
import { PlanCard } from "@/components/site/PlanCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { plans } from "@/data/plans";
import type { Subject } from "@/data/subjects";

/** A question row taken from the Storage manifest's live sample. */
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
};

export function HomePage({
  subjects,
  totalQuestions,
  mcqTotal,
  recentQuestions = [],
}: HomePageProps) {
  const [query, setQuery] = useState("");

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

  // Only counts the app can actually verify are shown.
  const stats: { icon: LucideIcon; value: string; label: string }[] = [];
  if (typeof totalQuestions === "number") {
    stats.push({ icon: BookOpen, value: totalQuestions.toLocaleString(), label: "Questions" });
  }
  if (typeof mcqTotal === "number") {
    stats.push({ icon: ListChecks, value: mcqTotal.toLocaleString(), label: "MCQ questions" });
  }
  stats.push({ icon: Sparkles, value: String(subjects.length), label: "Subjects" });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="hero-grid absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
            <Badge variant="secondary" className="mb-5 gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
              <Sparkles className="size-3.5 text-accent-foreground" aria-hidden="true" />
              {typeof totalQuestions === "number"
                ? `${totalQuestions.toLocaleString()} curated questions`
                : `${subjects.length} subjects`}
            </Badge>
            <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              Master every exam with a <span className="text-primary">subject-wise question bank</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Practice questions across core subjects and other topics — with clear solutions,
              subject filters and a plan that fits you.
            </p>

            {/* Search bar */}
            <form
              role="search"
              className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm"
              onSubmit={(e) => e.preventDefault()}
            >
              <Search className="ml-2 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <label htmlFor="hero-search" className="sr-only">
                Search subjects or chapters
              </label>
              <input
                id="hero-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a subject or chapter, e.g. “Genetics”"
                className="h-10 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" className="shrink-0">
                Search
              </Button>
            </form>

            <div className="mt-10 mx-auto grid max-w-lg grid-cols-3 gap-4 text-center">
              {stats.map(({ icon: Icon, value, label }) => (
                <div key={label} className="rounded-2xl border border-border bg-card/70 p-4">
                  <Icon className="mx-auto size-5 text-primary" aria-hidden="true" />
                  <p className="mt-2 font-display text-lg font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Subject cards */}
        <section aria-labelledby="subjects-heading" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="subjects-heading" className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Explore subjects
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {query
                  ? `Showing results for “${query}”`
                  : `${subjects.length} subjects with live question counts.`}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/subjects">View all subjects</Link>
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
                ? "Subject data is unavailable right now. Please try again shortly."
                : `No subjects match “${query}”. Try “Physics” or “Calculus”.`}
            </p>
          )}
        </section>

        {/* Latest questions */}
        <section aria-labelledby="latest-heading" className="bg-secondary/40 py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="latest-heading" className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                  Latest questions
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  A live sample drawn straight from the question bank.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/questions">Browse questions</Link>
              </Button>
            </div>

            {recentQuestions.length > 0 ? (
              <ul className="mt-8 grid gap-4 md:grid-cols-2">
                {recentQuestions.map((q) => (
                  <li key={q.id}>
                    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
                      <div className="flex items-center gap-2">
                        {q.source && (
                          <Badge variant="secondary" className="font-medium">
                            {q.source}
                          </Badge>
                        )}
                        {q.topic && <span className="text-xs text-muted-foreground">{q.topic}</span>}
                        {q.year && (
                          <span className="ml-auto text-xs text-muted-foreground">{q.year}</span>
                        )}
                      </div>
                      <p className="mt-3 flex-1 text-sm font-medium leading-relaxed text-foreground">
                        {q.question}
                      </p>
                    </article>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-8 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Question samples are unavailable right now. Open the question bank to browse
                everything.
              </p>
            )}
          </div>
        </section>

        {/* Subscription plans */}
        <section aria-labelledby="plans-heading" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="text-center">
            <h2 id="plans-heading" className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Simple, student-friendly plans
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Start free, upgrade when you&apos;re ready.</p>
          </div>

          <div className="mt-10 grid gap-6 pt-2 md:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button variant="link" asChild>
              <Link href="/plans">Compare all plan details →</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
