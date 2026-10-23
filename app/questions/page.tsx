import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Cloud } from "lucide-react";

import { QuestionCard } from "@/components/questions/QuestionCard";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getQuestionPage,
  isQuestionType,
  QUESTION_PAGE_SIZE,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  type QuestionType,
} from "@/lib/questions/storage";

type QuestionsSearchParams = Promise<{
  subject?: string | string[];
  type?: string | string[];
  page?: string | string[];
}>;

export const metadata: Metadata = {
  title: "Questions — QuestionBank",
  description: "Browse subject-wise questions streamed from Supabase Storage.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildPageHref(subject: string, nextPage: number, type: QuestionType) {
  const params = new URLSearchParams();
  params.set("subject", subject);
  params.set("type", type);
  if (nextPage > 1) params.set("page", String(nextPage));
  return `/questions?${params.toString()}`;
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: QuestionsSearchParams;
}) {
  const params = await searchParams;
  const requestedSubject = firstValue(params.subject)?.trim() ?? "";
  const requestedType = firstValue(params.type)?.trim() ?? "";
  const requestedPage = Number(firstValue(params.page) ?? "1");
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const type: QuestionType = isQuestionType(requestedType) ? requestedType : "all";

  const result = await getQuestionPage({
    subject: requestedSubject || "physics",
    page,
    type,
  });
  const subject = result.subject;
  const pageSize = result.pageSize || QUESTION_PAGE_SIZE;
  const from = (result.page - 1) * pageSize;
  const hasPrevious = result.page > 1;
  const hasNext = result.page < result.totalPages;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="space-y-3">
            <Badge variant="secondary" className="gap-1.5">
              <Cloud className="size-3.5" aria-hidden="true" />
              Storage-backed question bank
            </Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Practice questions
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Questions are stored as sharded JSON files in Supabase Storage. Choose a subject
              below; only the current page shard is downloaded, so the database stays empty.
            </p>
          </div>

          <form
            action="/questions"
            method="get"
            className="mt-7 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <label className="min-w-52 flex-1 space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Subject
              </span>
              <select
                name="subject"
                defaultValue={subject?.slug ?? "physics"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring"
              >
                {result.subjects.length === 0 ? (
                  <option value="physics">Physics</option>
                ) : (
                  result.subjects.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.name} ({item.total.toLocaleString()})
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="min-w-40 space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Type
              </span>
              <select
                name="type"
                defaultValue={type}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring"
              >
                {QUESTION_TYPES.map((item) => {
                  const count = subject
                    ? item === "mcq"
                      ? subject.mcq
                      : item === "written"
                        ? subject.written
                        : subject.total
                    : 0;

                  return (
                    <option key={item} value={item}>
                      {QUESTION_TYPE_LABELS[item]} ({count.toLocaleString()})
                    </option>
                  );
                })}
              </select>
            </label>

            <Button type="submit">Show questions</Button>
          </form>

          {subject && (subject.mcq > 0 || subject.written > 0) && (
            <nav
              aria-label="Question type filter"
              className="mt-3 flex flex-wrap items-center gap-1.5"
            >
              <span className="mr-1 text-xs text-muted-foreground">Quick filter:</span>
              {QUESTION_TYPES.map((item) => {
                const count =
                  item === "mcq" ? subject.mcq : item === "written" ? subject.written : subject.total;
                const isActive = item === type;

                return (
                  <Link
                    key={item}
                    href={buildPageHref(subject.slug, 1, item)}
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {QUESTION_TYPE_LABELS[item]} ({count.toLocaleString()})
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {result.error
                ? "Could not load questions from Storage."
                : result.questions.length === 0
                  ? "No questions"
                  : `Showing ${from + 1}–${from + result.questions.length} of ${result.total.toLocaleString()}`}
              {!result.error && subject && (
                <span className="text-muted-foreground/70">
                  {" "}
                  · {subject.name} · {QUESTION_TYPE_LABELS[type]} · page {result.page} of{" "}
                  {result.totalPages}
                </span>
              )}
            </p>

            {result.manifest && (
              <Badge variant="outline" className="font-normal">
                {result.manifest.totalQuestions.toLocaleString()} questions in Storage
              </Badge>
            )}
          </div>

          {result.error ? (
            <Card className="mt-4 border-dashed">
              <CardContent className="space-y-2 p-6 text-sm">
                <p className="font-semibold text-foreground">Storage question files are not ready.</p>
                <p className="text-muted-foreground">
                  Run{" "}
                  <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                    node --env-file=.env.local scripts/build-question-shards.mjs
                  </code>{" "}
                  once to generate the shard files and manifest in the private{" "}
                  <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">qb-raw</code>{" "}
                  bucket.
                </p>
                <p className="break-words font-mono text-xs text-destructive">{result.error}</p>
              </CardContent>
            </Card>
          ) : result.questions.length === 0 ? (
            <Card className="mt-4 border-dashed">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No {QUESTION_TYPE_LABELS[type].toLowerCase()} questions found for{" "}
                {subject?.name ?? "this subject"}. Pick another type or subject above.
              </CardContent>
            </Card>
          ) : (
            <div className="mt-4 space-y-4">
              {result.questions.map((question, index) => (
                <QuestionCard key={question.id} question={question} index={from + index + 1} />
              ))}
            </div>
          )}

          {!result.error && result.total > 0 && (hasPrevious || hasNext) && (
            <nav
              aria-label="Question pagination"
              className="mt-8 flex items-center justify-between gap-3"
            >
              <Button variant="outline" size="sm" asChild={hasPrevious} disabled={!hasPrevious}>
                {hasPrevious ? (
                  <Link
                    href={buildPageHref(subject?.slug ?? "physics", result.page - 1, type)}
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

              <span className="text-sm text-muted-foreground">
                Page {result.page} of {result.totalPages}
              </span>

              <Button variant="outline" size="sm" asChild={hasNext} disabled={!hasNext}>
                {hasNext ? (
                  <Link
                    href={buildPageHref(subject?.slug ?? "physics", result.page + 1, type)}
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
