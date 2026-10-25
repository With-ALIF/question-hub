"use client";

import Link from "next/link";
import {
  Atom,
  BookOpen,
  Dna,
  FlaskConical,
  MonitorSmartphone,
  Sigma,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { DEFAULT_CHAPTERS } from "@/data/subjects";
import { useI18n } from "@/lib/i18n/client";
import type { QuestionSubject } from "@/lib/questions/storage";

const subjectMeta: Record<string, { icon: LucideIcon; accent: string }> = {
  physics: { icon: Atom, accent: "chart-1" },
  chemistry: { icon: FlaskConical, accent: "chart-2" },
  biology: { icon: Dna, accent: "chart-3" },
  mathematics: { icon: Sigma, accent: "chart-4" },
  ict: { icon: MonitorSmartphone, accent: "chart-5" },
  other: { icon: BookOpen, accent: "chart-1" },
};

const fallbackMeta = { icon: BookOpen, accent: "chart-1" };

export function StorageSubjectCard({ subject }: { subject: QuestionSubject }) {
  const meta = subjectMeta[subject.slug] ?? fallbackMeta;
  const Icon = meta.icon;
  const chapters = DEFAULT_CHAPTERS[subject.slug] ?? [];
  const { tr, num, subjectName, subjectTagline } = useI18n();
  const displayName = subjectName(subject.slug, subject.name);
  const tagline = subjectTagline(subject.slug);

  return (
    <Card className="group flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg font-sans">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `color-mix(in oklab, var(--${meta.accent}) 14%, transparent)`,
              color: `var(--${meta.accent})`,
            }}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">
              {displayName}
            </h3>
            <p className="text-xs text-muted-foreground">
              {tr(`${num(subject.total)} questions`, `${num(subject.total)}টি প্রশ্ন`)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <p className="text-sm text-muted-foreground">{tagline}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="font-normal text-xs">
            {tr(`${num(subject.mcq)} MCQs`, `${num(subject.mcq)} এমসিকিউ`)}
          </Badge>
          <Badge variant="secondary" className="font-normal text-xs">
            {tr(`${num(subject.written)} written`, `${num(subject.written)} লিখিত`)}
          </Badge>
          {chapters.length > 0 && (
            <Badge variant="outline" className="font-normal text-xs">
              {tr(`${num(chapters.length)} topics`, `${num(chapters.length)}টি টপিক`)}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link
          href={`/questions?subject=${subject.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          {tr("View questions", "প্রশ্নসমূহ দেখুন")}
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </CardFooter>
    </Card>
  );
}
