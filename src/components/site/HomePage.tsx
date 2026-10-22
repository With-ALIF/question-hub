"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Sparkles, Users, BookOpen } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SubjectCard } from "@/components/site/SubjectCard";
import { PlanCard } from "@/components/site/PlanCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { subjects, popularQuestions, plans } from "@/data/mock";

export function HomePage() {
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
  }, [query]);

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
              {subjects.reduce((sum, s) => sum + s.questionCount, 0).toLocaleString()} curated questions
            </Badge>
            <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              Master every exam with a <span className="text-primary">chapter-wise question bank</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Practice thousands of questions across five core subjects — with clear solutions, chapter
              filters and a plan that fits you.
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

            <div className="mt-10 grid max-w-lg mx-auto grid-cols-3 gap-4 text-center">
              {[
                { icon: BookOpen, value: "8,910+", label: "Questions" },
                { icon: Users, value: "3,200+", label: "Students" },
                { icon: Sparkles, value: "5", label: "Subjects" },
              ].map(({ icon: Icon, value, label }) => (
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
                {query ? `Showing results for “${query}”` : "Five core subjects, hundreds of chapters."}
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
              No subjects match “{query}”. Try “Physics” or “Calculus”.
            </p>
          )}
        </section>

        {/* Popular questions */}
        <section aria-labelledby="popular-heading" className="bg-secondary/40 py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="popular-heading" className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Popular questions
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Most viewed by students this month.</p>

            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {popularQuestions.map((q) => (
                <li key={q.id}>
                  <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-medium">
                        {q.subjectName}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{q.chapter}</span>
                    </div>
                    <p className="mt-3 flex-1 text-sm font-medium leading-relaxed text-foreground">{q.text}</p>
                    <p className="mt-4 text-xs text-muted-foreground">
                      {q.views} views · {q.likes.toLocaleString()} likes
                    </p>
                  </article>
                </li>
              ))}
            </ul>
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
