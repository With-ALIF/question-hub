import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { QuestionCard, type QuestionListItem } from "@/components/questions/QuestionCard";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

const SOURCE_OPTIONS = ["Ac.QB", "Ad.QB", "qb5", "EAP", "MAP", "JOB", "Ex.MCQ", "AAP"];
const TYPE_OPTIONS = [
  { value: "mcq", label: "MCQ only" },
  { value: "written", label: "Written only" },
  { value: "all", label: "All questions" },
] as const;

type QuestionsSearchParams = Promise<{
  q?: string | string[];
  source?: string | string[];
  type?: string | string[];
  page?: string | string[];
}>;

export const metadata: Metadata = {
  title: "Questions — QuestionBank",
  description: "Search and practise questions from the QuestionBank collection.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeType(value: string | undefined): "mcq" | "written" | "all" {
  return value === "written" || value === "all" || value === "mcq" ? value : "mcq";
}

function buildPageHref(
  nextPage: number,
  filters: { q: string; source: string; questionType: string },
) {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.source) params.set("source", filters.source);
  if (filters.questionType !== "mcq") params.set("type", filters.questionType);
  if (nextPage > 1) params.set("page", String(nextPage));

  const query = params.toString();
  return query ? `/questions?${query}` : "/questions";
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: QuestionsSearchParams;
}) {
  const params = await searchParams;
  const q = firstValue(params.q)?.trim() ?? "";
  const source = firstValue(params.source)?.trim() ?? "";
  const questionType = normalizeType(firstValue(params.type));
  const requestedPage = Number(firstValue(params.page) ?? "1");
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const from = (page - 1) * PAGE_SIZE;

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("qb_questions")
    .select(
      "id, external_id, question_text, options, correct_option, answer, explanation, source_db, institution, year, topic_code, keyword, is_mcq",
    )
    .eq("is_published", true)
    .order("external_id", { ascending: true })
    .range(from, from + PAGE_SIZE - 1);

  if (q) query = query.ilike("question_text", `%${q}%`);
  if (source) query = query.eq("source_db", source);
  if (questionType === "mcq") query = query.eq("is_mcq", true);
  if (questionType === "written") query = query.eq("is_mcq", false);

  const { data, error } = await query;
  const questions = (data ?? []) as QuestionListItem[];
  const hasFilters = Boolean(q || source || questionType !== "mcq");
  const hasPrevious = page > 1;
  const hasNext = questions.length === PAGE_SIZE;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="space-y-3">
            <Badge variant="secondary">Question bank</Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Practice questions
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Search the imported collection by question text, source and type. Answers and
              explanations stay hidden until you reveal them.
            </p>
          </div>

          <form
            action="/questions"
            method="get"
            className="mt-7 grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
          >
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Search
              </span>
              <Input
                name="q"
                defaultValue={q}
                placeholder="Search question text..."
                aria-label="Search question text"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Source
              </span>
              <select
                name="source"
                defaultValue={source}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring sm:w-32"
              >
                <option value="">All</option>
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Type
              </span>
              <select
                name="type"
                defaultValue={questionType}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring sm:w-36"
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <Button type="submit" className="sm:mb-0">
              <Search className="size-4" aria-hidden="true" />
              Search
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {error
                ? "Could not load questions."
                : questions.length === 0
                  ? "No questions"
                  : `Showing ${from + 1}–${from + questions.length}`}
              {!error && questions.length > 0 && (
                <span className="text-muted-foreground/70"> · page {page}</span>
              )}
            </p>

            {hasFilters && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/questions">Clear filters</Link>
              </Button>
            )}
          </div>

          {error ? (
            <Card className="mt-4 border-dashed">
              <CardContent className="space-y-2 p-6 text-sm">
                <p className="font-semibold text-foreground">The question table is not ready yet.</p>
                <p className="text-muted-foreground">
                  Apply the raw-import SQL migration, then import the JSONL files. Once the
                  columns exist, this page will load automatically.
                </p>
                <p className="break-words font-mono text-xs text-destructive">{error.message}</p>
              </CardContent>
            </Card>
          ) : questions.length === 0 ? (
            <Card className="mt-4 border-dashed">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No questions found. Try a different search or clear the filters.
              </CardContent>
            </Card>
          ) : (
            <div className="mt-4 space-y-4">
              {questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={from + index + 1}
                />
              ))}
            </div>
          )}

          {!error && (hasPrevious || hasNext) && (
            <nav
              aria-label="Question pagination"
              className="mt-8 flex items-center justify-between gap-3"
            >
              <Button variant="outline" size="sm" asChild={hasPrevious} disabled={!hasPrevious}>
                {hasPrevious ? (
                  <Link
                    href={buildPageHref(page - 1, { q, source, questionType })}
                    rel="prev"
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                    Previous
                  </Link>
                ) : (
                  <span>
                    <ChevronLeft className="size-4" aria-hidden="true" />
                    Previous
                  </span>
                )}
              </Button>

              <span className="text-sm text-muted-foreground">Page {page}</span>

              <Button variant="outline" size="sm" asChild={hasNext} disabled={!hasNext}>
                {hasNext ? (
                  <Link
                    href={buildPageHref(page + 1, { q, source, questionType })}
                    rel="next"
                  >
                    Next
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <span>
                    Next
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </span>
                )}
              </Button>
            </nav>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
