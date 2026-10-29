"use client";

import { useActionState } from "react";
import { CheckCircle2, Layers, Loader2, Lock, Sparkles } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/client";
import { chooseSubjectAction } from "@/lib/access/subject-actions";
import type { SubjectChoiceState } from "@/lib/access/types";

type SubjectOption = {
  slug: string;
  name: string;
};

const INITIAL_STATE: SubjectChoiceState = { ok: false };

export function FreeSubjectPicker({
  subjects,
  selected,
  limit,
}: {
  subjects: SubjectOption[];
  selected: string | null;
  limit: number;
}) {
  const { tr } = useI18n();
  const [state, formAction, isPending] = useActionState(
    chooseSubjectAction,
    INITIAL_STATE,
  );

  const currentSlug = (state.ok && state.value) ? state.value : selected;
  const isLocked = Boolean(currentSlug);
  const selectedName = subjects.find((subject) => subject.slug === currentSlug)?.name ?? currentSlug;

  const errorText =
    state.error === "auth"
      ? tr("Please log in again.", "আবার লগইন করুন।")
      : state.error === "forbidden"
        ? tr(
            "Your current plan does not allow choosing a subject.",
            "আপনার বর্তমান প্ল্যানে বিষয় বেছে নেওয়ার সুযোগ নেই।",
          )
        : state.error === "locked"
          ? tr(
              "Free plan subjects cannot be changed once selected. Upgrade your plan to access other subjects.",
              "ফ্রি প্ল্যানে একবার বিষয় নির্বাচন করার পর তা আর পরিবর্তন করা যাবে না। অন্য বিষয় আনলক করতে প্ল্যান আপগ্রেড করুন।",
            )
          : state.error === "invalid_selection"
            ? tr("That subject is not available.", "এই বিষয়টি পাওয়া যাচ্ছে না।")
            : state.error === "failed"
              ? tr("Could not save your subject. Try again.", "বিষয় সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।")
              : null;

  if (isLocked) {
    return (
      <Card className="mt-4 border-primary/30 bg-primary/5 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Lock className="size-5" aria-hidden="true" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-base font-semibold text-foreground">
                    {tr("Free subject selected", "ফ্রি বিষয় নির্ধারিত")}
                  </h2>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 bg-emerald-500/10 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400"
                  >
                    <CheckCircle2 className="mr-1 size-3" />
                    {selectedName}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 bg-amber-500/10 text-[10px] font-medium text-amber-700 dark:text-amber-400"
                  >
                    <Lock className="mr-1 size-2.5" />
                    {tr("Locked", "লক করা")}
                  </Badge>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {tr(
                    "You have selected this subject on the free plan. Once chosen, it cannot be changed unless you upgrade your plan.",
                    "ফ্রি প্ল্যানে আপনি এই বিষয়টি নির্বাচন করেছেন। প্ল্যান আপগ্রেড না করা পর্যন্ত এটি আর পরিবর্তন করা যাবে না। সব বিষয় আনলক করতে প্ল্যান আপগ্রেড করুন।",
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
              <Button asChild size="sm" variant="default" className="h-8 gap-1.5 text-xs font-semibold">
                <Link href="/plans">
                  <Sparkles className="size-3.5" />
                  {tr("Upgrade plan", "প্ল্যান আপগ্রেড করুন")}
                </Link>
              </Button>
              {currentSlug && (
                <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                  <Link href={`/questions?subject=${currentSlug}`}>
                    {tr("Practise now", "অনুশীলন শুরু")}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 border-primary/30 bg-primary/5 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                {tr("Choose your free subject", "আপনার ফ্রি বিষয় বেছে নিন")}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {tr(
                  `Your free plan includes ${limit} subject of your choice. Note: Once selected, you cannot change it unless you upgrade your plan.`,
                  `আপনার ফ্রি প্ল্যানে পছন্দের ${limit}টি বিষয় অন্তর্ভুক্ত। সতর্কতার সাথে নির্বাচন করুন: একবার বেছে নিলে প্ল্যান আপগ্রেড না করা পর্যন্ত এটি আর পরিবর্তন করা যাবে না।`,
                )}
              </p>
            </div>
          </div>
        </div>

        <form action={formAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <select
            name="subject"
            defaultValue={subjects[0]?.slug ?? ""}
            disabled={isPending || subjects.length === 0}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            {subjects.map((subject) => (
              <option key={subject.slug} value={subject.slug}>
                {subject.name}
              </option>
            ))}
          </select>
          <Button
            type="submit"
            size="sm"
            className="h-9 shrink-0 gap-1.5"
            disabled={isPending || subjects.length === 0}
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
            )}
            {tr("Confirm subject", "বিষয় নিশ্চিত করুন")}
          </Button>
        </form>

        <div aria-live="polite" className="mt-2 min-h-4 text-xs">
          {errorText && <p className="text-destructive">{errorText}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
