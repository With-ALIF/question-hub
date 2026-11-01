"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpenCheck, Mail } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useI18n } from "@/lib/i18n/client";
import type { Subject } from "@/data/subjects";

type FooterProps = {
  initialUser?: SupabaseUser | null;
  variant?: "default" | "mega";
  subjects?: Subject[];
};

export function Footer({
  initialUser,
  variant = "default",
  subjects = [],
}: FooterProps) {
  const [user, setUser] = useState<SupabaseUser | null>(initialUser ?? null);
  const { tr } = useI18n();

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return () => {};
    }

    let unsubscribe: (() => void) | undefined;

    try {
      const supabase = createSupabaseBrowserClient();

      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          setUser(data.user);
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      unsubscribe = () => {
        subscription.unsubscribe();
      };
    } catch {
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (user) {
    return null;
  }

  if (variant === "mega") {
    const quickLinks = [
      { href: "/", label: tr("Home", "হোম") },
      { href: "/questions", label: tr("Practice", "অনুশীলন") },
      { href: "/plans", label: tr("Plans", "প্ল্যান") },
      { href: "/model-test", label: tr("Model Test", "মডেল টেস্ট") },
      { href: "/exam-paper", label: tr("Exam Paper", "পরীক্ষাপত্র") },
    ];
    const accountLinks = [
      { href: "/login", label: tr("Log in", "লগইন") },
      { href: "/register", label: tr("Register", "রেজিস্টার") },
      { href: "/dashboard", label: tr("Dashboard", "ড্যাশবোর্ড") },
      { href: "/saved", label: tr("Saved Questions", "সেভ করা প্রশ্ন") },
      { href: "/support", label: tr("Support", "সাপোর্ট") },
    ];
    const subjectLinks = subjects.slice(0, 6);

    return (
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
            <div className="sm:col-span-2 lg:col-span-4">
              <Link
                href="/"
                className="flex items-center gap-2"
                aria-label={tr("QuestionBank home", "QuestionBank হোম")}
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <BookOpenCheck className="size-5" aria-hidden="true" />
                </span>
                <span className="font-display text-xl font-bold tracking-tight text-foreground">
                  Question<span className="text-primary">Bank</span>
                </span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {tr(
                  "A curated question bank for students — practice subject-wise questions across Physics, Chemistry, Biology, Mathematics, ICT and more.",
                  "শিক্ষার্থীদের জন্য সাজানো প্রশ্ন ব্যাংক — পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান, উচ্চতর গণিত, আইসিটি ও অন্যান্য বিষয়ের প্রশ্ন অনুশীলন করুন।",
                )}
              </p>
              <a
                href="mailto:qbank273@gmail.com"
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Mail className="size-4" aria-hidden="true" />
                qbank273@gmail.com
              </a>
            </div>

            <div className="lg:col-span-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
                {tr("Subjects", "বিষয়সমূহ")}
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {subjectLinks.map((subject) => (
                  <li key={subject.slug}>
                    <Link
                      href={`/questions?subject=${subject.slug}`}
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      {subject.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/subjects"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    {tr("All subjects", "সব বিষয়")}
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
                {tr("Quick links", "দ্রুত লিংক")}
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
                {tr("Account", "অ্যাকাউন্ট")}
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {accountLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-border py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} QuestionBank ·{" "}
              {tr("All rights reserved.", "সর্বস্বত্ব সংরক্ষিত।")}
            </p>
            <p>
              {tr(
                "Made for HSC, Admission & Job preparation",
                "HSC, ভর্তি ও চাকরির প্রস্তুতির জন্য তৈরি",
              )}
            </p>
          </div>
        </div>
      </footer>
    );
  }

  const pageLinks = [
    { href: "/", label: tr("Home", "হোম") },
    { href: "/subjects", label: tr("Subjects", "বিষয়সমূহ") },
    { href: "/plans", label: tr("Plans", "প্ল্যান") },
    { href: "/login", label: tr("Log in", "লগইন") },
    { href: "/register", label: tr("Register", "রেজিস্টার") },
  ];

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label={tr("QuestionBank home", "QuestionBank হোম")}
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpenCheck className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              Question<span className="text-primary">Bank</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {tr(
              "A curated question bank for students — practice subject-wise questions across Physics, Chemistry, Biology, Mathematics, ICT and more.",
              "শিক্ষার্থীদের জন্য সাজানো প্রশ্ন ব্যাংক — পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান, উচ্চতর গণিত, আইসিটি ও অন্যান্য বিষয়ের প্রশ্ন অনুশীলন করুন।",
            )}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">{tr("Pages", "পেজসমূহ")}</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {pageLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-5">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} QuestionBank
        </p>
      </div>
    </footer>
  );
}
