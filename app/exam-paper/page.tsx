import type { Metadata } from "next";
import Link from "next/link";
import { Lock, LogIn } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import {
  canAccessChapter,
  canAccessDatabase,
  canAccessSubject,
  getEntitlement,
} from "@/lib/access";
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

  const entitlement = await getEntitlement(user.id);
  const entitlementUnavailable = entitlement.status === "unavailable";
  const allowedSubjects = entitlement.access.subjects;
  const databaseCodes = entitlement.access.databaseCodes;
  const noSubjectAccess = allowedSubjects !== null && allowedSubjects.length === 0;
  const noDatabaseAccess = databaseCodes !== null && databaseCodes.length === 0;
  const requestedSubjectSlug = requestedSubject || "physics";
  const subjectBlocked =
    !noSubjectAccess &&
    requestedSubjectSlug !== "all" &&
    !canAccessSubject(entitlement, requestedSubjectSlug);
  const effectiveSubject = subjectBlocked
    ? (allowedSubjects?.[0] ?? "all")
    : requestedSubjectSlug;
  const hasExamPaperAccess =
    entitlement.limits.examPapers === null
      ? entitlement.paidAccess
      : (entitlement.remaining.examPapers ?? 0) > 0;
  const canUseBuilder =
    !entitlementUnavailable &&
    hasExamPaperAccess &&
    !noSubjectAccess &&
    !noDatabaseAccess;

  const result = canUseBuilder
    ? await getQuestionPage({
        subject: effectiveSubject,
        page,
        type,
        filters: requestedFilters,
      })
    : null;

  if (result && allowedSubjects !== null) {
    const allowed = new Set(allowedSubjects);
    result.subjects = result.subjects.filter((item) => allowed.has(item.slug));
    result.questions = result.questions.filter(
      (question) => !question.subject || allowed.has(question.subject),
    );
  }

  if (result && entitlement.access.chapters !== null) {
    result.questions = result.questions.filter((question) =>
      canAccessChapter(entitlement, question.topic_code),
    );
  }

  if (result && entitlement.access.databaseCodes !== null) {
    result.questions = result.questions.filter((question) =>
      canAccessDatabase(entitlement, question.source_db),
    );
  }

  const canRevealAnswer = entitlement.features.allowAnswer;
  const canViewExplanation = entitlement.features.allowExplanation;
  const pageQuestions = (result?.questions ?? []).map((question) => ({
    ...question,
    answer: canRevealAnswer ? question.answer : null,
    explanation: canViewExplanation ? question.explanation : null,
    explanation_html: canViewExplanation ? question.explanation_html : null,
    correct_option: canRevealAnswer ? question.correct_option : null,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar initialUser={user} />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {entitlementUnavailable ? (
            <Card className="mx-auto max-w-lg border-amber-500/30 bg-amber-500/5">
              <CardContent className="space-y-3 p-6 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                  <Lock className="size-6" aria-hidden="true" />
                </span>
                <h2 className="font-display text-lg font-bold text-foreground">
                  {tr("Access verification unavailable", "অ্যাক্সেস যাচাই করা যাচ্ছে না")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {tr(
                    "We could not verify your plan right now. Please try again shortly.",
                    "এই মুহূর্তে আপনার প্ল্যান যাচাই করা যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
                  )}
                </p>
              </CardContent>
            </Card>
          ) : !hasExamPaperAccess ? (
            <Card className="mx-auto max-w-lg border-primary/30 bg-primary/5">
              <CardContent className="space-y-3 p-6 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Lock className="size-6" aria-hidden="true" />
                </span>
                <h2 className="font-display text-lg font-bold text-foreground">
                  {tr("Exam paper access required", "পরীক্ষাপত্র তৈরির অ্যাক্সেস প্রয়োজন")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {entitlement.status === "expired"
                    ? tr(
                        "Your subscription has expired. Renew to build and export exam papers again.",
                        "আপনার সাবস্ক্রিপশনের মেয়াদ শেষ হয়েছে। আবার পরীক্ষাপত্র তৈরি ও এক্সপোর্ট করতে রিনিউ করুন।",
                      )
                    : entitlement.limits.examPapers !== null &&
                        entitlement.limits.examPapers > 0
                      ? tr(
                          "You have used your exam paper quota. Upgrade your plan to create more papers.",
                          "আপনার পরীক্ষাপত্রের কোটা শেষ হয়েছে। আরও পরীক্ষাপত্র তৈরি করতে প্ল্যান আপগ্রেড করুন।",
                        )
                      : tr(
                          "Upgrade to a teacher plan to select questions and generate printable exam papers.",
                          "প্রশ্ন সিলেক্ট করে প্রিন্টযোগ্য পরীক্ষাপত্র তৈরি করতে টিচার প্ল্যানে আপগ্রেড করুন।",
                        )}
                </p>
                <Button asChild size="sm">
                  <Link href="/plans">
                    {entitlement.status === "expired"
                      ? tr("Renew plan", "প্ল্যান রিনিউ")
                      : tr("View plans", "প্ল্যান দেখুন")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : noDatabaseAccess ? (
            <Card className="mx-auto max-w-lg border-primary/30 bg-primary/5">
              <CardContent className="space-y-3 p-6 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Lock className="size-6" aria-hidden="true" />
                </span>
                <h2 className="font-display text-lg font-bold text-foreground">
                  {tr("No database selected", "কোনো ডেটাবেস নির্বাচন করা হয়নি")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {tr(
                    "Choose your HSC, Admission or Job Preparation database from the dashboard first.",
                    "প্রথমে ড্যাশবোর্ড থেকে আপনার HSC, Admission বা Job Preparation ডেটাবেস বেছে নিন।",
                  )}
                </p>
                <Button asChild size="sm">
                  <Link href="/dashboard">
                    {tr("Choose your database", "আপনার ডেটাবেস বেছে নিন")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : noSubjectAccess ? (
            <Card className="mx-auto max-w-lg border-primary/30 bg-primary/5">
              <CardContent className="space-y-3 p-6 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Lock className="size-6" aria-hidden="true" />
                </span>
                <h2 className="font-display text-lg font-bold text-foreground">
                  {tr("No subject access in your plan", "আপনার প্ল্যানে কোনো বিষয়ের অ্যাক্সেস নেই")}
                </h2>
                <Button asChild size="sm">
                  <Link href="/plans">{tr("View plans", "প্ল্যান দেখুন")}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : result ? (
            <ExamPaperBuilderView
              questions={pageQuestions}
              subjects={result.subjects}
              currentSubject={result.subject}
              currentType={result.type}
              page={result.page}
              pageSize={result.pageSize}
              totalPages={result.totalPages}
              total={result.total}
              filters={result.filters}
              activeFilters={result.activeFilters}
              canRevealAnswer={canRevealAnswer}
              canViewExplanation={canViewExplanation}
            />
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
