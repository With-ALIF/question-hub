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
import type { QuestionSubject } from "@/lib/questions/storage";

const otherMeta = {
  icon: BookOpen,
  accent: "chart-1",
  tagline: "English, Bangla, general knowledge & other topics",
};

const subjectMeta: Record<
  string,
  { icon: LucideIcon; accent: string; tagline: string }
> = {
  physics: {
    icon: Atom,
    accent: "chart-1",
    tagline: "Mechanics, waves, electricity & modern physics",
  },
  chemistry: {
    icon: FlaskConical,
    accent: "chart-2",
    tagline: "Organic, inorganic & physical chemistry",
  },
  biology: {
    icon: Dna,
    accent: "chart-3",
    tagline: "Cells, genetics, human physiology & ecology",
  },
  mathematics: {
    icon: Sigma,
    accent: "chart-4",
    tagline: "Algebra, calculus, geometry & trigonometry",
  },
  ict: {
    icon: MonitorSmartphone,
    accent: "chart-5",
    tagline: "Computing, networking, databases & programming",
  },
  other: otherMeta,
};

export function StorageSubjectCard({ subject }: { subject: QuestionSubject }) {
  const meta = subjectMeta[subject.slug] ?? otherMeta;
  const Icon = meta.icon;

  return (
    <Card className="group flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
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
              {subject.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {subject.total.toLocaleString()} questions
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <p className="text-sm text-muted-foreground">{meta.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="font-normal">
            {subject.mcq.toLocaleString()} MCQ
          </Badge>
          <Badge variant="secondary" className="font-normal">
            {subject.written.toLocaleString()} written
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link
          href={`/questions?subject=${subject.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Browse questions
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </CardFooter>
    </Card>
  );
}
