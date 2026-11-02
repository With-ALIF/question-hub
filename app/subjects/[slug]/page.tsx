import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronDown, Lock } from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_SUBJECT_VISUAL, SUBJECT_VISUALS } from "@/data/subject-visuals";
import { DEFAULT_CHAPTERS } from "@/data/subjects";
import { canAccessSubject, getEntitlement } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { getSubjectOutline, type OutlineChapter } from "@/lib/questions/outline";
import { getQuestionManifest } from "@/lib/questions/storage";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SubjectPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ paper?: string | string[] }>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: SubjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { tr, subjectName } = await getI18n();
  const manifest = await getQuestionManifest().catch(() => null);
  const subject = manifest?.subjects.find((item) => item.slug === slug);
  const name = subjectName(slug, subject?.name ?? slug);
  const title = tr(`${name} — QuestionBank`, `${name} — QuestionBank`);

  return { title };
}

export default async function SubjectDetailPage({
  params,
  searchParams,
}: SubjectPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const user = await getCurrentUser();
  const { tr, num, subjectName, subjectTagline } = await getI18n();
  const entitlement = user ? await getEntitlement(user.id) : null;
  const databaseCodes =
    entitlement && entitlement.status !== "unavailable"
      ? entitlement.access.databaseCodes
      : null;

  const [manifest, outline] = await Promise.all([
    getQuestionManifest().catch(() => null),
    getSubjectOutline(slug, databaseCodes).catch(() => null),
  ]);

  const manifestSubject = manifest?.subjects.find((item) => item.slug === slug) ?? null;
  if (!manifestSubject && !outline) notFound();

  const accessible = Boolean(user && entitlement && canAccessSubject(entitlement, slug));
  const displayName = subjectName(slug, manifestSubject?.name ?? slug);
  const tagline = subjectTagline(slug);
  const visual = SUBJECT_VISUALS[slug] ?? DEFAULT_SUBJECT_VISUAL;
  const Icon = visual.icon;

  const papers = outline?.papers ?? [];
  const requestedPaper = firstValue(query.paper)?.trim() ?? "";
  const activePaper = papers.find((paper) => paper.code === requestedPaper) ?? papers[0] ?? null;
  const chapters = activePaper?.chapters ?? outline?.chapters ?? [];
  const fallbackChapters = outline ? [] : (DEFAULT_CHAPTERS[slug] ?? []);

  const previewChapters = accessible ? chapters : chapters.slice(0, 2);
  const lockedChapters = accessible ? [] : chapters.slice(2);

  const unlockHref = !user
    ? "/login"
    : entitlement && entitlement.subjectSelectionLimit > 0
      ? "/dashboard"
      : "/plans";
  const unlockLabel = !user
    ? tr("Log in", "লগইন করুন")
    : entitlement && entitlement.subjectSelectionLimit > 0
      ? tr("Choose this subject", "এই বিষয়টি বেছে নিন")
      : tr("Unlock with a plan", "প্ল্যান নিয়ে আনলক করুন");

  const totalQuestions = outline?.total ?? manifestSubject?.total ?? 0;
  const totalMcq = outline?.mcq ?? manifestSubject?.mcq ?? 0;
  const totalWritten = outline?.written ?? manifestSubject?.written ?? 0;

  const renderChapter = (chapter: OutlineChapter, index: number) => {
    const topics = accessible ? chapter.topics : chapter.topics.slice(0, 3);

    return (
      <details
        key={chapter.code}
        open={index === 0 || (!accessible && index === 1)}
        className="group rounded-xl border border-border bg-card"
      >
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-muted-foreground">
            {num(index + 1)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-foreground sm:text-base">
              {chapter.name}
            </span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground sm:text-xs">
              {tr(
                `${num(chapter.mcq)} MCQ · ${num(chapter.written)} written`,
                `${num(chapter.mcq)} MCQ · ${num(chapter.written)} লিখিত`,
              )}
            </span>
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="border-t border-border px-4 py-3">
          {topics.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {topics.map((topic) => (
                <li
                  key={topic.name}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/50 px-2 py-1 text-[11px] text-foreground sm:text-xs"
                >
                  <span>{topic.name}</span>
                  <span className="text-muted-foreground">· {num(topic.count)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              {tr(
                "No topic breakdown for this database yet.",
                "এই ডেটাবেসে এখনো টপিকের বিভাজন নেই।",
              )}
            </p>
          )}

          {accessible && (
            <Link
              href={`/questions?subject=${slug}&chapter=${encodeURIComponent(chapter.code)}`}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline sm:text-sm"
            >
              {tr("Practise this chapter", "এই অধ্যায় অনুশীলন করুন")}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </details>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar initialUser={user} audience={entitlement?.audience} />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <Link
            href="/subjects"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {tr("All subjects", "সকল বিষয়")}
          </Link>

          <div className="mt-5 flex items-start gap-3 sm:gap-4">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl sm:size-14"
              style={{
                backgroundColor: `color-mix(in oklab, var(--${visual.accent}) 14%, transparent)`,
                color: `var(--${visual.accent})`,
              }}
            >
              <Icon className="size-6 sm:size-7" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                {displayName}
              </h1>
              {tagline && (
                <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="font-normal text-xs">
                  {tr(`${num(totalQuestions)} questions`, `${num(totalQuestions)}টি প্রশ্ন`)}
                </Badge>
                <Badge variant="outline" className="font-normal text-xs">
                  {tr(`${num(totalMcq)} MCQ`, `${num(totalMcq)} MCQ`)}
                </Badge>
                <Badge variant="outline" className="font-normal text-xs">
                  {tr(`${num(totalWritten)} written`, `${num(totalWritten)} লিখিত`)}
                </Badge>
                {chapters.length > 0 && (
                  <Badge variant="outline" className="font-normal text-xs">
                    {tr(`${num(chapters.length)} chapters`, `${num(chapters.length)}টি অধ্যায়`)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {!accessible && (
            <Card className="mt-6 border-primary/30 bg-primary/5">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Lock className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {!user
                        ? tr("Log in to unlock this subject", "এই বিষয়টি আনলক করতে লগইন করুন")
                        : tr(
                            "This subject is not in your plan",
                            "এই বিষয়টি আপনার প্ল্যানে নেই",
                          )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {tr(
                        "The first two chapters are open as a preview. Unlock every chapter and topic with a plan.",
                        "প্রিভিউ হিসেবে প্রথম দুটি অধ্যায় খোলা আছে। প্ল্যান নিয়ে সব অধ্যায় ও টপিক আনলক করুন।",
                      )}
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" className="shrink-0">
                  <Link href={unlockHref}>{unlockLabel}</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {accessible && (
            <div className="mt-6">
              <Button asChild size="sm" className="gap-1.5">
                <Link href={`/questions?subject=${slug}`}>
                  {tr("Practise all questions", "সব প্রশ্ন অনুশীলন করুন")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          )}

          {papers.length > 1 && (
            <nav
              aria-label={tr("Papers", "পত্রসমূহ")}
              className="mt-6 flex gap-2 overflow-x-auto pb-1"
            >
              {papers.map((paper) => (
                <Link
                  key={paper.code}
                  href={`/subjects/${slug}?paper=${encodeURIComponent(paper.code)}`}
                  className={cn(
                    "inline-flex min-h-9 shrink-0 items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                    paper.code === activePaper?.code
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary",
                  )}
                >
                  {paper.name}
                </Link>
              ))}
            </nav>
          )}

          {fallbackChapters.length > 0 ? (
            <div className="mt-6 space-y-2">
              {fallbackChapters.map((name, index) => (
                <div
                  key={`${name}-${index}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-muted-foreground">
                    {num(index + 1)}
                  </span>
                  <span className="text-sm text-foreground">{name}</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-3">
                {previewChapters.map((chapter, index) => renderChapter(chapter, index))}
              </div>

              {lockedChapters.length > 0 && (
                <div className="relative mt-4 overflow-hidden rounded-2xl border border-border bg-card">
                  <ul aria-hidden="true" className="pointer-events-none select-none blur-[3px]">
                    {lockedChapters.slice(0, 5).map((chapter, index) => (
                      <li
                        key={chapter.code}
                        className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5 last:border-b-0"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-muted-foreground">
                          {num(index + 3)}
                        </span>
                        <span className="flex-1 text-sm text-foreground">{chapter.name}</span>
                        <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
                      </li>
                    ))}
                  </ul>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/75 p-5 text-center backdrop-blur-[1px]">
                    <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Lock className="size-5" aria-hidden="true" />
                    </span>
                    <p className="text-sm font-semibold text-foreground">
                      {tr(
                        `${num(lockedChapters.length)} more chapters are locked`,
                        `আরও ${num(lockedChapters.length)}টি অধ্যায় লক করা আছে`,
                      )}
                    </p>
                    <p className="max-w-xs text-xs text-muted-foreground">
                      {tr(
                        "Get the full chapter and topic breakdown with a plan.",
                        "প্ল্যান নিয়ে সব অধ্যায় ও টপিকের পূর্ণ তালিকা দেখুন।",
                      )}
                    </p>
                    <Button asChild size="sm">
                      <Link href={unlockHref}>{unlockLabel}</Link>
                    </Button>
                  </div>
                </div>
              )}

              {chapters.length === 0 && (
                <p className="mt-6 text-sm text-muted-foreground">
                  {tr(
                    "No chapter data is available for this subject yet.",
                    "এই বিষয়ের অধ্যায়ের তথ্য এখনো পাওয়া যাচ্ছে না।",
                  )}
                </p>
              )}

              {!accessible && chapters.length <= 2 && chapters.length > 0 && (
                <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center">
                  <Lock className="size-5 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-semibold text-foreground">
                    {tr("Unlock every chapter", "সব অধ্যায় আনলক করুন")}
                  </p>
                  <Button asChild size="sm">
                    <Link href={unlockHref}>{unlockLabel}</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer initialUser={user} />
    </div>
  );
}
