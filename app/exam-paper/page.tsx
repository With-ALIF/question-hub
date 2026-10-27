import type { Metadata } from "next";
import Link from "next/link";
import { Lock, LogIn } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { ExamPaperBuilderView } from "@/components/exam-paper/ExamPaperBuilderView";
import {
  getQuestionPage,
  isQuestionType,
  type QuestionType,
} from "@/lib/questions/storage";
import { sanitizeFilters } from "@/lib/questions/filters";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  return {
    title: tr(
      "Exam Paper Builder — QuestionBank",
      "পরীক্ষাপত্র তৈরি (Exam Paper Builder) — QuestionBank",
    ),
    description: tr(
      "Select questions by subject and chapter to build custom 4-set exam papers and solution PDFs.",
      "বিষয় ও অধ্যায় ভিত্তিক প্রশ্ন সিলেক্ট করে কাস্টম ৪-সেট প্রশ্নপত্র ও সমাধান PDF তৈরি করুন।",
    ),
  };
}

type SearchParams = Promise<{
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

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ExamPaperPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  const { tr } = await getI18n();

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar initialUser={user} />
        <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
          <Card className="w-full max-w-md border-border/80 bg-card/80 p-8 text-center sm:p-10 shadow-lg backdrop-blur">
            <CardContent className="flex flex-col items-center p-0">
              <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                <Lock className="size-8" aria-hidden="true" />
              </span>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                {tr("Log in to create exam papers", "পরীক্ষাপত্র তৈরি করতে লগইন করুন")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {tr(
                  "Log in to select questions, generate 4-set question sheets and download printable PDFs.",
                  "প্রশ্ন সিলেক্ট করে কাস্টম ৪-সেট প্রশ্নপত্র ও সমাধান PDF তৈরি করতে অনুগ্রহ করে লগইন করুন।",
                )}
              </p>
              <Button asChild className="mt-6 w-full gap-2 shadow-md">
                <Link href="/login?next=/exam-paper">
                  <LogIn className="size-4" aria-hidden="true" />
                  <span>{tr("Log in", "লগইন করুন")}</span>
                </Link>
              </Button>
              <p className="mt-4 text-xs text-muted-foreground">
                {tr("Don't have an account?", "অ্যাকাউন্ট নেই?")}{" "}
                <Link
                  href="/register"
                  className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  {tr("Register here", "রেজিস্টার করুন")}
                </Link>
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }
  const params = await searchParams;
  const requestedSubject = Array.isArray(params.subject)
    ? params.subject.join(",")
    : (params.subject?.trim() ?? "");
  const requestedType = firstValue(params.type)?.trim() ?? "";
  const requestedPage = Number(firstValue(params.page) ?? "1");
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const type: QuestionType = isQuestionType(requestedType) ? requestedType : "all";
  const requestedFilters = sanitizeFilters(params);

  const result = await getQuestionPage({
    subject: requestedSubject || "physics",
    page,
    type,
    filters: requestedFilters,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar initialUser={user} />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <ExamPaperBuilderView
            questions={result.questions}
            subjects={result.subjects}
            currentSubject={result.subject}
            currentType={result.type}
            page={result.page}
            pageSize={result.pageSize}
            totalPages={result.totalPages}
            total={result.total}
            filters={result.filters}
            activeFilters={result.activeFilters}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
