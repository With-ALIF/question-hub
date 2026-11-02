"use client";

import Link from "next/link";
import { ArrowRight, Lock, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { DEFAULT_SUBJECT_VISUAL, SUBJECT_VISUALS } from "@/data/subject-visuals";
import { getSubjectPapers } from "@/data/papers";
import { DEFAULT_CHAPTERS } from "@/data/subjects";
import { useI18n } from "@/lib/i18n/client";
import type { QuestionSubject } from "@/lib/questions/storage";
import { cn } from "@/lib/utils";

export function StorageSubjectCard({
  subject,
  locked = false,
  highlighted = false,
}: {
  subject: QuestionSubject;
  locked?: boolean;
  highlighted?: boolean;
}) {
  const visual = SUBJECT_VISUALS[subject.slug] ?? DEFAULT_SUBJECT_VISUAL;
  const Icon = visual.icon;
  const chapters = DEFAULT_CHAPTERS[subject.slug] ?? [];
  const papers = getSubjectPapers(subject.slug);
  const { tr, num, subjectName, subjectTagline } = useI18n();
  const displayName = subjectName(subject.slug, subject.name);
  const tagline = subjectTagline(subject.slug);
  const href = `/subjects/${subject.slug}`;

  const card = (
    <Card
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border-border bg-card transition-all duration-300",
        highlighted
          ? "border-transparent shadow-md hover:shadow-xl"
          : "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
        locked && "bg-card/80",
      )}
    >
      {highlighted && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-28"
          style={{
            background: `radial-gradient(70% 100% at 50% 0%, color-mix(in oklab, var(--${visual.accent}) 16%, transparent), transparent 75%)`,
          }}
        />
      )}

      <CardHeader className="relative p-4 pb-2 sm:p-5 sm:pb-3">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl sm:size-12"
            style={{
              backgroundColor: `color-mix(in oklab, var(--${visual.accent}) 14%, transparent)`,
              color: `var(--${visual.accent})`,
              boxShadow: `inset 0 0 0 1px color-mix(in oklab, var(--${visual.accent}) 22%, transparent)`,
            }}
          >
            <Icon className="size-5 sm:size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-sm font-semibold leading-snug text-foreground sm:text-base">
              {displayName}
            </h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
              <span className="font-semibold text-foreground/80">
                {num(subject.total)}
              </span>{" "}
              {tr("questions", "প্রশ্ন")}
            </p>
          </div>
          {locked ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:px-2">
              <Lock className="size-3" aria-hidden="true" />
              {tr("Locked", "লক")}
            </span>
          ) : highlighted ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary sm:px-2">
              <Sparkles className="size-3" aria-hidden="true" />
              {tr("Unlocked", "আনলকড")}
            </span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="relative flex-1 px-4 pb-3 sm:px-5 sm:pb-4">
        <p className="hidden text-sm leading-relaxed text-muted-foreground sm:block">
          {tagline}
        </p>
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
                className={cn(
                  "inline-flex min-h-8 items-center rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors sm:text-xs",
                  highlighted
                    ? "border-primary/25 bg-primary/5 text-primary hover:border-primary/50 hover:bg-primary/10"
                    : "border-border bg-secondary/50 text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
                )}
              >
                {paper.shortName}
              </Link>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="relative px-4 pb-4 pt-0 sm:px-5">
        <Link
          href={href}
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-semibold transition-colors sm:text-sm",
            locked
              ? "text-muted-foreground hover:text-foreground"
              : "text-primary hover:text-primary/80",
          )}
        >
          {locked
            ? tr("Preview chapters", "অধ্যায় প্রিভিউ")
            : tr("View chapters", "অধ্যায় দেখুন")}
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-full transition-transform sm:size-7",
              locked ? "bg-secondary" : "bg-primary/10 group-hover:translate-x-0.5",
            )}
          >
            {locked ? (
              <Lock className="size-3" aria-hidden="true" />
            ) : (
              <ArrowRight className="size-3.5" aria-hidden="true" />
            )}
          </span>
        </Link>
      </CardFooter>
    </Card>
  );

  if (!highlighted) return card;

  return (
    <div className="relative h-full rounded-2xl p-[2px] transition-transform duration-300 hover:-translate-y-1">
      <span
        aria-hidden="true"
        className="subject-ring-glow absolute inset-0 rounded-2xl"
      />
      <span
        aria-hidden="true"
        className="subject-ring-glow absolute -inset-1 rounded-2xl opacity-30 blur-md"
      />
      {card}
    </div>
  );
}
