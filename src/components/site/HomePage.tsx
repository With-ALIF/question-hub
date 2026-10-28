"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Library, ListChecks, type LucideIcon } from "lucide-react";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { PricingTabs } from "@/components/site/PricingTabs";
import { CountUp } from "@/components/site/CountUp";
import { HeroCarousel } from "@/components/site/HeroCarousel";
import { HomeFaqSection } from "@/components/site/HomeFaqSection";
import { HomeClosingCta } from "@/components/site/HomeClosingCta";
import { PaperCreationGuide } from "@/components/site/PaperCreationGuide";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import type { Subject } from "@/data/subjects";
import type { PaymentNumbers } from "@/lib/payments/config";
import { cn } from "@/lib/utils";

export type RecentQuestion = {
  id: string;
  question: string;
  source: string | null;
  topic: string | null;
  year: string | null;
};

type HomePageProps = {
  subjects: Subject[];
  totalQuestions?: number | undefined;
  mcqTotal?: number | undefined;
  recentQuestions?: RecentQuestion[] | undefined;
  slides: string[];
  signedIn: boolean;
  paymentNumbers: PaymentNumbers;
};

const featureSpanClasses = [
  "col-span-4 sm:col-span-1 lg:col-span-2",
  "col-span-2 sm:col-span-1 lg:col-span-2",
  "col-span-2 sm:col-span-1 lg:col-span-2",
  "col-span-4 sm:col-span-1 lg:col-span-3",
  "col-span-6 sm:col-span-2 lg:col-span-3",
];

const featureImageSizes = [
  "(max-width: 640px) 66vw, (max-width: 1024px) 50vw, 33vw",
  "(max-width: 640px) 33vw, (max-width: 1024px) 50vw, 33vw",
  "(max-width: 640px) 33vw, (max-width: 1024px) 50vw, 33vw",
  "(max-width: 640px) 66vw, (max-width: 1024px) 50vw, 50vw",
  "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw",
];

export function HomePage({
  subjects,
  totalQuestions,
  mcqTotal,
  recentQuestions = [],
  slides,
  signedIn,
  paymentNumbers,
}: HomePageProps) {
  const { tr } = useI18n();

  const features = [
    {
      href: "/subjects",
      image: "/images/features/subject-bank.jpg",
      imageAlt: tr("Library shelves filled with books", "বইয়ে ভরা লাইব্রেরির তাক"),
      title: tr("Verified question bank", "যাচাইকৃত প্রশ্নব্যাংক"),
      description: tr(
        "Every subject and chapter in one organised, trusted library.",
        "প্রতিটি বিষয় ও অধ্যায়ের যাচাইকৃত প্রশ্ন, এক সুসংগঠিত লাইব্রেরিতে।",
      ),
    },
    {
      href: "/model-test",
      image: "/images/features/chapter-practice.jpg",
      imageAlt: tr("Students studying together", "একসাথে পড়ছে শিক্ষার্থীরা"),
      title: tr("Model tests & practice", "মডেল টেস্ট ও অনুশীলন"),
      description: tr(
        "Practice at your own pace and keep track of your score and progress.",
        "নিজের গতি অনুযায়ী অনুশীলন করুন, স্কোর ও অগ্রগতি দেখুন।",
      ),
    },
    {
      href: "/questions",
      image: "/images/features/mcq-written.jpg",
      imageAlt: tr("A student writing notes", "নোট লিখছে একজন শিক্ষার্থী"),
      title: tr("MCQ and written, together", "MCQ ও লিখিত — একসাথে"),
      description: tr(
        "Questions, explanations, and correct answers in one place.",
        "প্রশ্ন, ব্যাখ্যা এবং সঠিক উত্তর — সব এক জায়গায়।",
      ),
    },
    {
      href: "/exam-paper",
      image: "/images/features/exam-papers.jpg",
      imageAlt: tr("A classroom during a lesson", "ক্লাস চলছে"),
      title: tr("Board & admission prep", "বোর্ড ও ভর্তি প্রস্তুতি"),
      description: tr(
        "Past papers and exam-focused practice for every milestone.",
        "বোর্ড ও ভর্তি পরীক্ষার প্রশ্নপত্র এবং পরীক্ষাভিত্তিক প্রস্তুতি।",
      ),
    },
    {
      href: "/questions",
      image: "/images/features/new-questions.jpg",
      imageAlt: tr(
        "Students studying together with laptops",
        "ল্যাপটপ নিয়ে একসাথে পড়ছে শিক্ষার্থীরা",
      ),
      title: tr("New questions first", "নতুন প্রশ্ন সবার আগে"),
      description: tr(
        "Fresh questions are added regularly, with explanations.",
        "নিয়মিত নতুন প্রশ্ন যোগ হয়, ব্যাখ্যাসহ।",
      ),
    },
  ];

  const stats: { icon: LucideIcon; value: number; label: string }[] = [];
  if (typeof totalQuestions === "number") {
    stats.push({
      icon: BookOpen,
      value: totalQuestions,
      label: tr("Questions", "প্রশ্ন"),
    });
  }
  if (typeof mcqTotal === "number") {
    stats.push({
      icon: ListChecks,
      value: mcqTotal,
      label: tr("MCQ questions", "MCQ প্রশ্ন"),
    });
  }
  stats.push({
    icon: Library,
    value: subjects.length,
    label: tr("Subjects", "বিষয়"),
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <section className="relative">
          <h1 className="sr-only">
            {tr(
              "QuestionBank — a subject-wise question bank for every exam",
              "QuestionBank — প্রতিটি পরীক্ষার জন্য বিষয়ভিত্তিক প্রশ্ন ব্যাংক",
            )}
          </h1>
          <HeroCarousel slides={slides} />
        </section>

        <section
          aria-label={tr("QuestionBank at a glance", "এক নজরে QuestionBank")}
          className="relative mx-auto mt-8 max-w-4xl px-4 sm:mt-10 sm:px-6"
        >
          <div
            className={cn(
              "grid divide-x divide-border/60 border-y border-border/50",
              stats.length <= 1
                ? "grid-cols-1"
                : stats.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3",
            )}
          >
            {stats.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="group flex flex-col items-center px-2 py-5 text-center sm:px-6 sm:py-6"
              >
                <span className="flex max-w-full items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground transition-colors group-hover:text-foreground sm:text-[11px] sm:tracking-[0.16em]">
                  <Icon className="size-3 shrink-0 text-primary sm:size-3.5" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </span>
                <p className="mt-2 font-display text-xl font-bold leading-none tracking-tight text-foreground tabular-nums sm:mt-3 sm:text-4xl lg:text-[2.75rem]">
                  <CountUp value={value} />
                </p>
                <span
                  className="mt-2 h-px w-6 rounded-full bg-linear-to-r from-primary/70 to-transparent transition-all duration-300 group-hover:w-10 sm:mt-3 sm:w-10"
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
        </section>

        <section
          id="features"
          aria-labelledby="features-heading"
          className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24"
        >
          <div className="border-b border-border/60 pb-8">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-px w-8 bg-primary/70" aria-hidden="true" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    {tr("Inside QuestionBank", "QuestionBank-এর ভেতরে")}
                  </span>
                </div>
                <h2
                  id="features-heading"
                  className="mt-4 max-w-3xl font-display text-[2rem] font-semibold leading-[1.12] tracking-tight text-foreground sm:text-4xl lg:text-[3.4rem]"
                >
                  <span className="text-primary">{tr("QuestionBank", "QuestionBank-এ")}</span>{" "}
                  {tr(
                    "gives students everything they need.",
                    "শিক্ষার্থীরা যা\u00A0যা পাচ্ছে, সব একসাথে।",
                  )}
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground lg:justify-self-end lg:pb-2">
                {tr(
                  "Subjects, chapters, MCQ practice, and exam papers — for every step of your prep.",
                  "বিষয়, অধ্যায়, MCQ আর প্রশ্নপত্র — প্রস্তুতির প্রতিটি ধাপে।",
                )}
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-6 gap-x-3 gap-y-7 sm:mt-12 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-6">
            {features.map((feature, index) => (
              <Link
                key={feature.title}
                href={feature.href}
                className={cn("group flex flex-col", featureSpanClasses[index])}
              >
                <div className="relative overflow-hidden rounded-2xl bg-secondary">
                  <Image
                    src={feature.image}
                    alt={feature.imageAlt}
                    width={1200}
                    height={800}
                    sizes={featureImageSizes[index]}
                    className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] sm:h-52 lg:h-60"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-3 font-display text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:mt-4 sm:text-xl">
                  {feature.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:mt-1.5 sm:text-sm">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button variant="link" asChild>
              <Link href="/subjects">
                {tr("Browse all subjects", "সব বিষয় দেখুন")}
                <span aria-hidden="true">→</span>
              </Link>
            </Button>
          </div>
        </section>

        <section aria-labelledby="plans-heading" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="text-center">
            <h2 id="plans-heading" className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {tr("Plans for students & teachers", "শিক্ষার্থী ও শিক্ষকদের জন্য প্ল্যান")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tr(
                "Start free, then pick the plan that fits how you learn or teach.",
                "বিনামূল্যে শুরু করুন, তারপর আপনার পড়া বা পড়ানোর ধরন অনুযায়ী প্ল্যান বেছে নিন।",
              )}
            </p>
          </div>

          <PricingTabs signedIn={signedIn} paymentNumbers={paymentNumbers} />

          <div className="mt-8 text-center">
            <Button variant="link" asChild>
              <Link href="/plans">
                {tr("Compare all plan details →", "সব প্ল্যানের বিস্তারিত তুলনা করুন →")}
              </Link>
            </Button>
          </div>
        </section>

        <section
          aria-label={tr("How to create a question paper", "সহজ ৩ ধাপে প্রশ্নপত্র তৈরি")}
          className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:pt-6"
        >
          <PaperCreationGuide />
        </section>

        {/* FAQ Section */}
        <HomeFaqSection />

        <HomeClosingCta />
      </main>

      <Footer />
    </div>
  );
}
