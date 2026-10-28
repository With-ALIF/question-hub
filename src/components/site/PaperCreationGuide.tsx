"use client";

import { useState, type ReactNode } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  FileDown,
  LayoutGrid,
  ListFilter,
  MousePointerClick,
  Search,
  Sparkles,
  Timer,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";

function StepCard({
  step,
  icon: Icon,
  title,
  description,
  children,
}: {
  step: string;
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <article className="relative flex min-w-0 flex-col rounded-xl border border-border bg-background p-3.5 sm:p-4">
      <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
        {step}
      </span>
      <div className="flex items-center gap-2 pr-7">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
        <h3 className="text-xs font-bold text-foreground sm:text-sm">{title}</h3>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-auto pt-3" aria-hidden="true">
        {children}
      </div>
    </article>
  );
}

export function PaperCreationGuide() {
  const { tr } = useI18n();
  const [open, setOpen] = useState(true);

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs"
    >
      <summary className="flex cursor-pointer list-none flex-col gap-3 p-4 [&::-webkit-details-marker]:hidden sm:p-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            <Sparkles className="size-3" aria-hidden="true" />
            {tr("3 easy steps to build a paper", "প্রশ্ন তৈরির সহজ ৩ ধাপ")}
          </span>
          <span className="mt-2 block font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {tr(
              "Build your ideal question paper in 3 easy steps",
              "সহজ ৩ ধাপে তৈরি করুন আপনার কাঙ্ক্ষিত প্রশ্নপত্র",
            )}
          </span>
          <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {tr(
              "Filter from verified questions, pick what you need, and get a print-ready paper with an answer key in moments.",
              "যাচাইকৃত প্রশ্ন থেকে ফিল্টার করুন, পছন্দের প্রশ্ন বাছাই করুন — আর সাথে সাথেই পান প্রিন্ট-উপযোগী প্রশ্নপত্র ও উত্তরমালা।",
            )}
          </span>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground">
          {open ? tr("Hide guide", "গাইড লুকান") : tr("View guide", "গাইড দেখুন")}
          <ChevronDown
            className={cn("size-3.5 transition-transform", open && "rotate-180")}
            aria-hidden="true"
          />
        </span>
      </summary>

      <div className="border-t border-border p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StepCard
            step="১"
            icon={ListFilter}
            title={tr("Filter questions", "প্রশ্ন ফিল্টার করুন")}
            description={tr(
              "Choose class, subject, and chapter.",
              "শ্রেণি, বিষয় ও অধ্যায় বেছে নিন।",
            )}
          >
            <div className="space-y-2 rounded-lg border border-border/80 bg-muted/30 p-2.5">
              <div className="flex min-w-0 items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-[10px] text-muted-foreground">
                <Search className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{tr("Search questions...", "প্রশ্ন খুঁজুন...")}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {[
                  tr("Class 9–10", "৯ম-১০ম"),
                  tr("Bangla 1st", "বাংলা ১ম"),
                  tr("Prose", "গদ্য"),
                ].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-border bg-background px-2 py-0.5 text-[9px] font-medium text-muted-foreground"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-md border border-primary/15 bg-primary/5 px-2 py-1.5">
                <span className="text-[9px] font-semibold text-primary">
                  {tr("48 questions found", "৪৮টি প্রশ্ন পাওয়া গেছে")}
                </span>
                <span className="size-1.5 rounded-full bg-emerald-500" />
              </div>
            </div>
          </StepCard>

          <StepCard
            step="২"
            icon={MousePointerClick}
            title={tr("Select questions", "প্রশ্ন বাছাই করুন")}
            description={tr(
              "Preview questions and add the ones you need.",
              "প্রশ্ন ও উত্তর দেখে পছন্দেরগুলো যোগ করুন।",
            )}
          >
            <div className="rounded-lg border border-border/80 bg-muted/30 p-2.5">
              <div className="rounded-md border border-border bg-background p-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 break-words text-[9px] font-semibold leading-snug text-foreground">
                    ঈশ্বরচন্দ্র বিদ্যাসাগর কত সালে জন্মগ্রহণ করেন?
                  </p>
                  <span className="shrink-0 rounded bg-primary px-1.5 py-0.5 text-[8px] font-semibold text-primary-foreground">
                    {tr("Add", "যোগ")}
                  </span>
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-1">
                  <span className="rounded border border-border px-1.5 py-1 text-[8px] text-muted-foreground">
                    ক. ১৮০৭
                  </span>
                  <span className="flex items-center justify-between rounded border border-emerald-400 bg-emerald-50 px-1.5 py-1 text-[8px] font-medium text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    খ. ১৮২০
                    <CheckCircle2 className="size-2.5" />
                  </span>
                  <span className="rounded border border-border px-1.5 py-1 text-[8px] text-muted-foreground">
                    গ. ১৮২৪
                  </span>
                  <span className="rounded border border-border px-1.5 py-1 text-[8px] text-muted-foreground">
                    ঘ. ১৬২০
                  </span>
                </div>
              </div>
            </div>
          </StepCard>

          <StepCard
            step="৩"
            icon={FileDown}
            title={tr("Print & download", "প্রিন্ট করুন")}
            description={tr(
              "Download a ready paper and answer key as PDF.",
              "প্রস্তুত প্রশ্নপত্র ও উত্তরমালা PDF নামান।",
            )}
          >
            <div className="rounded-lg border border-border/80 bg-muted/30 p-2.5">
              <div className="rounded-md border border-border bg-white p-2 text-gray-950 shadow-xs">
                <div className="border-b border-gray-300 pb-1 text-center">
                  <p className="text-[8px] font-bold">
                    {tr("My School & College", "আমার স্কুল ও কলেজ")}
                  </p>
                  <p className="text-[7px] text-gray-500">
                    {tr("Half-yearly exam", "অর্ধ-বার্ষিক পরীক্ষা")}
                  </p>
                </div>
                <div className="mt-1 flex items-center justify-between text-[6px] font-medium text-gray-600">
                  <span>{tr("Bangla 1st", "বাংলা ১ম")}</span>
                  <span>{tr("Set A", "সেট ক")}</span>
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="block h-0.5 rounded bg-gray-300" />
                    <span className="block h-0.5 w-4/5 rounded bg-gray-300" />
                    <span className="block h-0.5 w-11/12 rounded bg-gray-300" />
                    <span className="block h-0.5 w-3/4 rounded bg-gray-300" />
                  </div>
                  <div className="space-y-1">
                    <span className="block h-0.5 rounded bg-gray-300" />
                    <span className="block h-0.5 w-3/4 rounded bg-gray-300" />
                    <span className="block h-0.5 w-5/6 rounded bg-gray-300" />
                    <span className="block h-0.5 w-2/3 rounded bg-gray-300" />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-gray-200 pt-1 text-[6px] text-gray-500">
                  <span>{tr("Page 1 / 1", "পৃষ্ঠা ১ / ১")}</span>
                  <span className="rounded bg-primary px-1 py-0.5 text-[6px] font-semibold text-primary-foreground">
                    PDF
                  </span>
                </div>
              </div>
            </div>
          </StepCard>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/70 pt-3 text-[10px] font-medium text-muted-foreground sm:text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <Timer className="size-3.5 text-primary" aria-hidden="true" />
            {tr("Ready in 3 minutes", "৩ মিনিটে প্রশ্ন তৈরি")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LayoutGrid className="size-3.5 text-primary" aria-hidden="true" />
            {tr("Standard A4 layout", "স্ট্যান্ডার্ড A4 লেআউট")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck
              className="size-3.5 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            {tr("Answer key included", "উত্তরমালাসহ")}
          </span>
        </div>
      </div>
    </details>
  );
}
