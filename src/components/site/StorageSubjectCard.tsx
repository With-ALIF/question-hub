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
import type { QuestionSubject } from "@/lib/questions/storage";

const otherMeta = {
  icon: BookOpen,
  accent: "chart-1",
  name: "অন্যান্য বিষয়",
  tagline: "ইংরেজি, বাংলা, সাধারণ জ্ঞান ও অন্যান্য টপিক",
};

const subjectMeta: Record<
  string,
  { icon: LucideIcon; accent: string; name: string; tagline: string }
> = {
  physics: {
    icon: Atom,
    accent: "chart-1",
    name: "পদার্থবিজ্ঞান",
    tagline: "বলবিদ্যা, তরঙ্গ, তড়িৎ ও আধুনিক পদার্থবিজ্ঞান",
  },
  chemistry: {
    icon: FlaskConical,
    accent: "chart-2",
    name: "রসায়ন",
    tagline: "জৈব, অজৈব ও ভৌত রসায়ন",
  },
  biology: {
    icon: Dna,
    accent: "chart-3",
    name: "জীববিজ্ঞান",
    tagline: "কোষ, বংশগতিবিদ্যা, মানব শারীরতত্ত্ব ও পরিবেশ",
  },
  mathematics: {
    icon: Sigma,
    accent: "chart-4",
    name: "উচ্চতর গণিত",
    tagline: "বীজগণিত, ক্যালকুলাস, জ্যামিতি ও ত্রিকোণমিতি",
  },
  ict: {
    icon: MonitorSmartphone,
    accent: "chart-5",
    name: "আইসিটি",
    tagline: "কম্পিউটিং, নেটওয়ার্কিং, ডেটাবেস ও প্রোগ্রামিং",
  },
  other: otherMeta,
};

export function StorageSubjectCard({ subject }: { subject: QuestionSubject }) {
  const meta = subjectMeta[subject.slug] ?? otherMeta;
  const Icon = meta.icon;
  const displayName = meta.name || subject.name;
  const chapters = DEFAULT_CHAPTERS[subject.slug] ?? [];

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
              {subject.total.toLocaleString("bn-BD")} টি প্রশ্ন
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <p className="text-sm text-muted-foreground">{meta.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="font-normal text-xs">
            {subject.mcq.toLocaleString("bn-BD")} এমসিকিউ
          </Badge>
          <Badge variant="secondary" className="font-normal text-xs">
            {subject.written.toLocaleString("bn-BD")} লিখিত
          </Badge>
          {chapters.length > 0 && (
            <Badge variant="outline" className="font-normal text-xs">
              {chapters.length.toLocaleString("bn-BD")} টি টপিক
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link
          href={`/questions?subject=${subject.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          প্রশ্নসমূহ দেখুন
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </CardFooter>
    </Card>
  );
}
