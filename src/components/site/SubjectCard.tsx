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
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Subject } from "@/data/subjects";

const iconMap: Record<Subject["icon"], LucideIcon> = {
  atom: Atom,
  flask: FlaskConical,
  dna: Dna,
  sigma: Sigma,
  monitor: MonitorSmartphone,
  book: BookOpen,
};

export function SubjectCard({ subject }: { subject: Subject }) {
  const Icon = iconMap[subject.icon];

  return (
    <Card className="group flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `color-mix(in oklab, var(--${subject.accent}) 14%, transparent)`,
              color: `var(--${subject.accent})`,
            }}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">{subject.name}</h3>
            <p className="text-xs text-muted-foreground">{subject.questionCount.toLocaleString()} questions</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {subject.tagline && <p className="text-sm text-muted-foreground">{subject.tagline}</p>}
        {subject.chapters.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {subject.chapters.slice(0, 3).map((chapter) => (
              <Badge key={chapter} variant="secondary" className="font-normal">
                {chapter}
              </Badge>
            ))}
            {subject.chapters.length > 3 && (
              <Badge variant="secondary" className="font-normal">
                +{subject.chapters.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Link
          href={`/questions?subject=${subject.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Browse questions
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </CardFooter>
    </Card>
  );
}
