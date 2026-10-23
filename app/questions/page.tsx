import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Cloud, Lock, LogIn, X } from "lucide-react";

import { QuestionCard } from "@/components/questions/QuestionCard";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import {
  QUESTION_FILTER_KEYS,
  QUESTION_FILTER_LABELS,
  hasActiveFilters,
  sanitizeFilters,
  type QuestionFilterFacet,
  type QuestionFilterKey,
  type QuestionFilters,
} from "@/lib/questions/filters";
import {
  getQuestionPage,
  isQuestionType,
  QUESTION_PAGE_SIZE,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  type QuestionType,
} from "@/lib/questions/storage";
import { formatChapterLabel } from "@/data/chapters";
import { formatPaperLabel } from "@/data/papers";
import { QuestionFiltersForm } from "@/components/questions/QuestionFiltersForm";

type QuestionsSearchParams = Promise<{
  subject?: string | string[];
  type?: string | string[];
  page?: string | string[];
  db?: string | string[];
  un?: string | string[];
  year?: string | string[];
  paper?: string | string[];
  chapter?: string | string[];
  topic?: string | string[];
}>;

export const metadata: Metadata = {
  title: "Questions — QuestionBank",
  description: "Browse subject-wise questions streamed from Supabase Storage.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function withFilter(
  filters: QuestionFilters,
  key: QuestionFilterKey,
  value: string | null,
): QuestionFilters {
  const next: QuestionFilters = { ...filters };

  if (value === null) delete next[key];
  else next[key] = value;

  return next;
}

function buildPageHref(
  subject: string,
  nextPage: number,
  type: QuestionType,
  filters: QuestionFilters,
) {
  const params = new URLSearchParams();
  params.set("subject", subject);
  params.set("type", type);

  for (const key of QUESTION_FILTER_KEYS) {
    const value = filters[key];
    if (value) params.set(key, value);
  }

  if (nextPage > 1) params.set("page", String(nextPage));
  return `/questions?${params.toString()}`;
}



export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: QuestionsSearchParams;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const requestedSubject = firstValue(params.subject)?.trim() ?? "";
  const requestedType = firstValue(params.type)?.trim() ?? "";
  const requestedPage = Number(firstValue(params.page) ?? "1");
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const type: QuestionType = isQuestionType(requestedType) ? requestedType : "all";
  const requestedFilters = sanitizeFilters(params);

  const result = await getQuestionPage({
    subject: requestedSubject || "physics",
    page,
    type,
    filters: requestedFilters,
  });

  const subject = result.subject;
  const currentSubjectSlug = subject?.slug ?? (requestedSubject || "physics");
  const facetFilters = result.filters;
  const activeFilters = result.activeFilters;
  const filtering = hasActiveFilters(activeFilters);
  const pageSize = result.pageSize || QUESTION_PAGE_SIZE;
  const from = (result.page - 1) * pageSize;
  const hasPrevious = result.page > 1;
  const hasNext = result.page < result.totalPages;

  const summaryFilters = QUESTION_FILTER_KEYS.filter((key) => activeFilters[key]).map(
    (key) =>
      `${QUESTION_FILTER_LABELS[key]}: ${
        key === "chapter"
          ? formatChapterLabel(activeFilters[key])
          : key === "paper"
            ? formatPaperLabel(activeFilters[key])
            : activeFilters[key]
      }`,
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar initialUser={user} />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
          {!user ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-12">
              <Card className="w-full max-w-md border-border/80 bg-card/80 p-8 text-center sm:p-10 shadow-lg backdrop-blur">
                <CardContent className="flex flex-col items-center p-0">
                  <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                    <Lock className="size-8" aria-hidden="true" />
                  </span>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                    questions দেখতে লগইন করুন
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    প্রশ্ন ব্যাংকের বিষয়ভিত্তিক প্রশ্নসমূহ ও প্র্যাকটিস করতে অনুগ্রহ করে আপনার অ্যাকাউন্টে লগইন করুন।
                  </p>
                  <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
                    <Button asChild size="default" className="gap-2">
                      <Link href="/login">
                        <LogIn className="size-4" aria-hidden="true" />
                        লগইন করুন
                      </Link>
                    </Button>
                    <Button variant="outline" size="default" asChild>
                      <Link href="/register">
                        রেজিস্ট্রেশন করুন
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Practice questions
                </h1>
              </div>

              <QuestionFiltersForm
                subjects={result.subjects}
                selectedSubject={currentSubjectSlug}
                type={type}
                facetFilters={facetFilters}
                activeFilters={activeFilters}
                filtering={filtering}
              />

              {!facetFilters && filtering && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Detailed filters are unavailable for this subject right now.
                </p>
              )}

              {filtering && (
                <nav
                  aria-label="Active filters"
                  className="mt-3 flex flex-wrap items-center gap-1.5"
                >
                  <span className="mr-1 text-xs text-muted-foreground">Filtered by:</span>
                  {QUESTION_FILTER_KEYS.filter((key) => activeFilters[key]).map((key) => (
                    <Link
                      key={key}
                      href={buildPageHref(
                        currentSubjectSlug,
                        1,
                        type,
                        withFilter(activeFilters, key, null),
                      )}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-xs text-foreground transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                      title={`Remove ${QUESTION_FILTER_LABELS[key]} filter`}
                    >
                      <span className="text-muted-foreground">{QUESTION_FILTER_LABELS[key]}:</span>
                      <span className="font-medium">
                        {key === "chapter"
                          ? formatChapterLabel(activeFilters[key])
                          : key === "paper"
                            ? formatPaperLabel(activeFilters[key])
                            : activeFilters[key]}
                      </span>
                      <X className="size-3" aria-hidden="true" />
                    </Link>
                  ))}
                </nav>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {result.error
                    ? "Could not load questions from Storage."
                    : result.questions.length === 0
                      ? filtering
                        ? "No questions match these filters."
                        : "No questions"
                      : `Showing ${from + 1}–${from + result.questions.length} of ${result.total.toLocaleString()}`}
                  {!result.error && subject && (
                    <span className="text-muted-foreground/70">
                      {" "}
                      · {subject.name}
                      {summaryFilters.length > 0 && ` · ${summaryFilters.join(" · ")}`}
                      {" "}· {QUESTION_TYPE_LABELS[type]} · page {result.page} of{" "}
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
                  <CardContent className="space-y-3 p-8 text-center text-sm text-muted-foreground">
                    <p>
                      No {QUESTION_TYPE_LABELS[type].toLowerCase()} questions found for{" "}
                      {subject?.name ?? "this subject"}
                      {filtering ? " matching the selected filters." : ". Pick another type or subject above."}
                    </p>
                    {filtering && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={buildPageHref(currentSubjectSlug, 1, type, {})}>
                          Clear filters
                        </Link>
                      </Button>
                    )}
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
                        href={buildPageHref(
                          currentSubjectSlug,
                          result.page - 1,
                          type,
                          activeFilters,
                        )}
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
                        href={buildPageHref(currentSubjectSlug, result.page + 1, type, activeFilters)}
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
            </>
          )}
        </section>
      </main>
      <Footer initialUser={user} />
    </div>
  );
}
