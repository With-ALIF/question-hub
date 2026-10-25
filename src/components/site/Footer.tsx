"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useI18n } from "@/lib/i18n/client";

export function Footer({ initialUser }: { initialUser?: SupabaseUser | null }) {
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
          © {new Date().getFullYear()} QuestionBank.
        </p>
      </div>
    </footer>
  );
}
