"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { DEFAULT_SUBJECT_VISUAL, SUBJECT_VISUALS } from "@/data/subject-visuals";
import { getSubjectPapers } from "@/data/papers";
import { DEFAULT_CHAPTERS } from "@/data/subjects";
import { useI18n } from "@/lib/i18n/client";
import type { QuestionSubject } from "@/lib/questions/storage";

export function StorageSubjectCard({
  subject,
  locked = false,
}: {
  subject: QuestionSubject;
  locked?: boolean;
}) {
  const visual = SUBJECT_VISUALS[subject.slug] ?? DEFAULT_SUBJECT_VISUAL;
  const Icon = visual.icon;
  const chapters = DEFAULT_CHAPTERS[subject.slug] ?? [];
  const papers = getSubjectPapers(subject.slug);
  const { tr, num, subjectName, subjectTagline } = useI18n();
  const displayName = subjectName(subject.slug, subject.name);
  const tagline = subjectTagline(subject.slug);
  const href = `/subjects/${subject.slug}`;

  return (
    <Card className="group flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg font-sans">
      <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-11"
            style={{
              backgroundColor: `color-mix(in oklab, var(--${visual.accent}) 14%, transparent)`,
              color: `var(--${visual.accent})`,
            }}
          >
            <Icon className="size-4 sm:size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-sm font-semibold leading-snug text-foreground sm:text-base">
              {displayName}
            </h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
              {tr(`${num(subject.total)} questions`, `${num(subject.total)}টি প্রশ্ন`)}
            </p>
          </div>
          {locked && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:px-2">
              <Lock className="size-3" aria-hidden="true" />
              {tr("Locked", "লক")}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-4 pb-3 sm:px-6 sm:pb-4">
        <p className="hidden text-sm text-muted-foreground sm:block">{tagline}</p>
        <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3">
          <Badge variant="secondary" className="font-normal text-[10px] sm:text-xs">
            {tr(`${num(subject.mcq)} MCQs`, `${num(subject.mcq)} এমসিকিউ`)}
          </Badge>
          <Badge variant="secondary" className="hidden font-normal text-xs sm:inline-flex">
            {tr(`${num(subject.written)} written`, `${num(subject.written)} লিখিত`)}
          </Badge>
          {chapters.length > 0 && (
            <Badge variant="outline" className="hidden font-normal text-xs sm:inline-flex">
              {tr(`${num(chapters.length)} topics`, `${num(chapters.length)}টি টপিক`)}
            </Badge>
          )}
        </div>

        {papers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {papers.map((paper) => (
              <Link
                key={paper.code}
                href={`${href}?paper=${encodeURIComponent(paper.code)}`}
                className="inline-flex min-h-8 items-center rounded-lg border border-border bg-secondary/50 px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary sm:text-xs"
              >
                {paper.shortName}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0 sm:px-6">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80 sm:text-sm"
        >
          {locked ? tr("Preview chapters", "অধ্যায় প্রিভিউ") : tr("View chapters", "অধ্যায় দেখুন")}
          <ArrowRight
            className="size-3.5 transition-transform group-hover:translate-x-0.5 sm:size-4"
            aria-hidden="true"
          />
        </Link>
      </CardFooter>
    </Card>
  );
}
