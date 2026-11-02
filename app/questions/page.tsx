import type { Metadata } from "next";
import Link from "next/link";
import { Lock, LogIn } from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessSubject, getEntitlement } from "@/lib/access";
import { sanitizeFilters } from "@/lib/questions/filters";
import {
  getQuestionPage,
  isQuestionType,
  QUESTION_PAGE_SIZE,
  type QuestionPageResult,
  type QuestionType,
} from "@/lib/questions/storage";
import { PracticeSetupCard } from "@/components/practice/PracticeSetupCard";
import { countPracticeQuestions } from "@/lib/questions/practice";
import { getI18n } from "@/lib/i18n/server";

type QuestionsSearchParams = Promise<{
  subject?: string | string[];
  type?: string | string[];
  page?: string | string[];
  db?: string | string[];
  un?: string | string[];
  unit?: string | string[];
  set?: string | string[];
  year?: string | string[];
  paper?: string | string[];
  chapter?: string | string[];
  topic?: string | string[];
  no_explanation?: string | string[];
  has_explanation?: string | string[];
}>;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  const title = tr("Questions — QuestionBank", "প্রশ্ন — QuestionBank");
  const description = tr(
    "Browse subject-wise questions streamed from Supabase Storage.",
    "বিষয়ভিত্তিক প্রশ্ন দেখুন ও অনুশীলন করুন।",
  );
  return { title, description, openGraph: { title, description } };
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: QuestionsSearchParams;
}) {
  const user = await getCurrentUser();
  const { tr, subjectName } = await getI18n();
  const params = await searchParams;
  const requestedSubject = Array.isArray(params.subject)
    ? params.subject.join(",")
    : (params.subject?.trim() ?? "");
  const requestedType = firstValue(params.type)?.trim() ?? "";
  const requestedPage = Number(firstValue(params.page) ?? "1");
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const type: QuestionType = isQuestionType(requestedType) ? requestedType : "all";
  const requestedFilters = sanitizeFilters(params);

  const entitlement = user ? await getEntitlement(user.id) : null;
  const entitlementUnavailable = !entitlement || entitlement.status === "unavailable";
  const allowedSubjectSlugs = entitlement?.access.subjects ?? null;
  const databaseCodes = entitlement?.access.databaseCodes ?? null;
  const noDatabaseAccess =
    Boolean(entitlement) && databaseCodes !== null && databaseCodes.length === 0;
  const noSubjectAccess =
    Boolean(entitlement) &&
    allowedSubjectSlugs !== null &&
    allowedSubjectSlugs.length === 0;
  const requestedSubjectSlug = requestedSubject || "physics";
  const subjectBlocked =
    Boolean(entitlement) &&
    !noSubjectAccess &&
    requestedSubjectSlug !== "all" &&
    !canAccessSubject(entitlement!, requestedSubjectSlug);
  const effectiveSubject = subjectBlocked
    ? (allowedSubjectSlugs?.[0] ?? "all")
    : requestedSubjectSlug;

  const restrictedResult: QuestionPageResult = {
    manifest: null,
    subjects: [],
    subject: null,
    type,
    questions: [],
    page: 1,
    pageSize: QUESTION_PAGE_SIZE,
    totalPages: 1,
    total: 0,
    error: null,
    filters: null,
    activeFilters: requestedFilters,
  };

  const result =
    entitlementUnavailable || noSubjectAccess || noDatabaseAccess
      ? restrictedResult
      : await getQuestionPage({
          subject: effectiveSubject,
          page,
          type,
          filters: requestedFilters,
          allowedDatabaseCodes: databaseCodes,
          allowedSubjectSlugs,
        });

  if (!entitlementUnavailable && allowedSubjectSlugs !== null) {
    const allowed = new Set(allowedSubjectSlugs);
    result.subjects = result.subjects.filter((item) => allowed.has(item.slug));
  }

  const subjectsForForm = result.subjects;
  const subject = result.subject;
  const currentSubjectSlug = subject?.slug ?? (effectiveSubject || "physics");

  const selectedSubjectSlugs = currentSubjectSlug
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
  const isAllSubjectsSelected =
    currentSubjectSlug === "all" ||
    (subjectsForForm.length > 1 &&
      subjectsForForm.every((item) => selectedSubjectSlugs.includes(item.slug)));

  const displaySubjectName = isAllSubjectsSelected
    ? tr("All subjects", "সকল বিষয়")
    : subject
      ? subjectName(subject.slug, subject.name)
      : "";
  const facetFilters = result.filters;
  const activeFilters = result.activeFilters;
  const practiceAvailable =
    !entitlementUnavailable && !noSubjectAccess && !noDatabaseAccess
      ? await countPracticeQuestions({
          subject: currentSubjectSlug,
          filters: activeFilters,
          allowedSubjectSlugs,
          allowedDatabaseCodes: databaseCodes,
        })
      : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar initialUser={user} audience={entitlement?.audience} />
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
                    {tr("Log in to view questions", "প্রশ্ন দেখতে লগইন করুন")}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {tr(
                      "Please log in to your account to browse and practise subject-wise questions from the question bank.",
                      "প্রশ্ন ব্যাংকের বিষয়ভিত্তিক প্রশ্নসমূহ দেখতে ও প্র্যাকটিস করতে অনুগ্রহ করে আপনার অ্যাকাউন্টে লগইন করুন।",
                    )}
                  </p>
                  <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
                    <Button asChild size="default" className="gap-2">
                      <Link href="/login">
                        <LogIn className="size-4" aria-hidden="true" />
                        {tr("Log in", "লগইন করুন")}
                      </Link>
                    </Button>
                    <Button variant="outline" size="default" asChild>
                      <Link href="/register">{tr("Register", "রেজিস্ট্রেশন করুন")}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : entitlementUnavailable ? (
            <Card className="mx-auto mt-4 max-w-lg border-amber-500/30 bg-amber-500/5">
              <CardContent className="space-y-3 p-6 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                  <Lock className="size-6" aria-hidden="true" />
                </span>
                <h2 className="font-display text-lg font-bold text-foreground">
                  {tr("Access verification unavailable", "অ্যাক্সেস যাচাই করা যাচ্ছে না")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {tr(
                    "We could not verify your plan right now, so paid question data is temporarily locked. Please try again shortly.",
                    "এই মুহূর্তে আপনার প্ল্যান যাচাই করা যাচ্ছে না, তাই পেইড প্রশ্ন ডেটা সাময়িকভাবে লক করা আছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
                  )}
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard">{tr("Go to dashboard", "ড্যাশবোর্ডে যান")}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : noSubjectAccess ? (
            <Card className="mx-auto mt-4 max-w-lg border-primary/30 bg-primary/5">
              <CardContent className="space-y-3 p-6 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Lock className="size-6" aria-hidden="true" />
                </span>
                <h2 className="font-display text-lg font-bold text-foreground">
                  {tr("No subject access in your plan", "আপনার প্ল্যানে কোনো বিষয়ের অ্যাক্সেস নেই")}
                </h2>
                {entitlement && entitlement.subjectSelectionLimit > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {tr(
                        "Your free plan includes one subject. Choose the subject you want to practise from your dashboard.",
                        "আপনার ফ্রি প্ল্যানে একটি বিষয় অন্তর্ভুক্ত। ড্যাশবোর্ড থেকে অনুশীলনের জন্য বিষয়টি বেছে নিন।",
                      )}
                    </p>
                    <Button asChild size="sm">
                      <Link href="/dashboard">
                        {tr("Choose your subject", "আপনার বিষয় বেছে নিন")}
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {tr(
                        "Your current plan does not include any subject. Renew or upgrade to start practising.",
                        "আপনার বর্তমান প্ল্যানে কোনো বিষয় অন্তর্ভুক্ত নেই। অনুশীলন শুরু করতে রিনিউ বা আপগ্রেড করুন।",
                      )}
                    </p>
                    <Button asChild size="sm">
                      <Link href="/plans">{tr("View plans", "প্ল্যান দেখুন")}</Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : noDatabaseAccess ? (
            <Card className="mx-auto mt-4 max-w-lg border-primary/30 bg-primary/5">
              <CardContent className="space-y-3 p-6 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Lock className="size-6" aria-hidden="true" />
                </span>
                <h2 className="font-display text-lg font-bold text-foreground">
                  {tr("No database selected", "কোনো ডেটাবেস নির্বাচন করা হয়নি")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {tr(
                    "Your plan includes one database. Choose HSC, Admission or Job Preparation from your dashboard to unlock its questions.",
                    "আপনার প্ল্যানে একটি ডেটাবেস অন্তর্ভুক্ত। প্রশ্ন আনলক করতে ড্যাশবোর্ড থেকে HSC, Admission বা Job Preparation বেছে নিন।",
                  )}
                </p>
                <Button asChild size="sm">
                  <Link href="/dashboard">
                    {tr("Choose your database", "আপনার ডেটাবেস বেছে নিন")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {tr("Practice questions", "প্রশ্ন অনুশীলন")}
                </h1>
              </div>

              {subjectBlocked && (
                <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                  {tr(
                    "Your plan does not include the requested subject. Showing an accessible subject instead.",
                    "আপনার প্ল্যানে অনুরোধ করা বিষয়টি অন্তর্ভুক্ত নেই। এর পরিবর্তে অ্যাক্সেসযোগ্য একটি বিষয় দেখানো হচ্ছে।",
                  )}
                </div>
              )}

              <PracticeSetupCard
                subjectLabel={displaySubjectName}
                subjectSlug={currentSubjectSlug}
                activeFilters={activeFilters}
                facetFilters={facetFilters}
                availableCount={practiceAvailable}
              />
            </>
          )}
        </section>
      </main>
      <Footer initialUser={user} />
    </div>
  );
}
