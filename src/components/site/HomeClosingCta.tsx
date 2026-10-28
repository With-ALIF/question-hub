"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

export function HomeClosingCta() {
  const { tr } = useI18n();

  return (
    <section
      aria-labelledby="closing-cta-heading"
      className="relative isolate overflow-hidden bg-[#0b4a49] py-16 text-white sm:py-20 lg:py-24"
    >
      <Image
        src="/images/features/exam-papers.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-20"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-linear-to-br from-[#0b4a49]/95 via-[#0b4a49]/90 to-[#0d5c58]/80"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-28 -right-16 size-80 rounded-full bg-emerald-200/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
          QuestionBank
        </span>

        <h2
          id="closing-cta-heading"
          className="mx-auto mt-5 max-w-4xl font-display text-3xl font-bold leading-[1.14] tracking-tight text-white sm:text-4xl lg:text-5xl"
        >
          {tr(
            "Spend less time finding questions, more time teaching.",
            "প্রশ্ন খোঁজার সময় বাঁচান, পড়ানোর সময় বাড়ান।",
          )}
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base lg:text-lg">
          {tr(
            "Pick from thousands of verified questions — and get a print-ready paper with answers in minutes.",
            "হাজারো যাচাইকৃত প্রশ্ন থেকে ক্লিক করে বেছে নিন — কয়েক মিনিটেই পান প্রিন্ট-উপযোগী প্রশ্নপত্র ও উত্তরমালা।",
          )}
        </p>

        <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.17em] text-white/55">
          {tr(
            "For teachers, coaching centres, tutors & parents",
            "শিক্ষক, কোচিং সেন্টার, টিউটর ও অভিভাবকদের জন্য",
          )}
        </p>

        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Button
            asChild
            size="lg"
            className="h-11 gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-primary shadow-lg shadow-black/10 hover:bg-white/90"
          >
            <Link href="/register">
              {tr("Get started free", "বিনামূল্যে শুরু করুন")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-11 gap-2 rounded-xl border-white/25 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
          >
            <Link href="/questions">{tr("Browse questions", "প্রশ্ন দেখুন")}</Link>
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium text-white/60">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-300" aria-hidden="true" />
            {tr("Verified questions", "যাচাইকৃত প্রশ্ন")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-300" aria-hidden="true" />
            {tr("Print-ready PDF", "প্রিন্ট-রেডি PDF")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-300" aria-hidden="true" />
            {tr("Answer key included", "উত্তরমালাসহ")}
          </span>
        </div>
      </div>
    </section>
  );
}
