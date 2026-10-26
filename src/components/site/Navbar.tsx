"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookmarkCheck,
  BookOpenCheck,
  FileText,
  Home,
  Layers,
  LayoutDashboard,
  LogIn,
  LogOut,
  Sparkles,
  Timer,
  type LucideIcon,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOutAction } from "@/lib/auth/actions";
import { useI18n } from "@/lib/i18n/client";

type NavItem = {
  href: string;
  label: [en: string, bn: string];
  icon?: LucideIcon;
};

const baseNavLinks: NavItem[] = [
  { href: "/", label: ["Home", "হোম"] },
  { href: "/subjects", label: ["Subjects", "বিষয়সমূহ"] },
  { href: "/questions", label: ["Questions", "প্রশ্ন"] },
  { href: "/exam-paper", label: ["Exam Paper", "পরীক্ষাপত্র"] },
  { href: "/plans", label: ["Plans", "প্ল্যান"] },
];

const loggedInNavLinks: NavItem[] = [
  { href: "/dashboard", label: ["Dashboard", "ড্যাশবোর্ড"], icon: LayoutDashboard },
  { href: "/subjects", label: ["Subjects", "বিষয়সমূহ"], icon: Layers },
  { href: "/questions", label: ["Practice", "অনুশীলন"], icon: BookOpenCheck },
  { href: "/exam-paper", label: ["Exam Paper", "পরীক্ষাপত্র"], icon: FileText },
  { href: "/saved", label: ["Saved Questions", "সেভ করা প্রশ্ন"], icon: BookmarkCheck },
  { href: "/model-test", label: ["Model Test", "মডেল টেস্ট"], icon: Timer },
];

const loggedOutMobileLinks: NavItem[] = [
  { href: "/", label: ["Home", "হোম"], icon: Home },
  { href: "/subjects", label: ["Subjects", "বিষয়"], icon: Layers },
  { href: "/questions", label: ["Questions", "প্রশ্ন"], icon: BookOpenCheck },
  { href: "/exam-paper", label: ["Exam", "পরীক্ষা"], icon: FileText },
  { href: "/plans", label: ["Plans", "প্ল্যান"], icon: Sparkles },
];

const loggedInMobileLinks: NavItem[] = [
  { href: "/dashboard", label: ["Dashboard", "ড্যাশবোর্ড"], icon: LayoutDashboard },
  { href: "/subjects", label: ["Subjects", "বিষয়"], icon: Layers },
  { href: "/questions", label: ["Practice", "অনুশীলন"], icon: BookOpenCheck },
  { href: "/exam-paper", label: ["Exam", "পরীক্ষা"], icon: FileText },
  { href: "/saved", label: ["Saved", "সেভড"], icon: BookmarkCheck },
  { href: "/model-test", label: ["Model Test", "মডেল টেস্ট"], icon: Timer },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar({ initialUser }: { initialUser?: SupabaseUser | null }) {
  const [user, setUser] = useState<SupabaseUser | null>(initialUser ?? null);
  const pathname = usePathname();
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

  const navLinks = user ? loggedInNavLinks : baseNavLinks;
  const mobileNavItems = user ? loggedInMobileLinks : loggedOutMobileLinks;

  const handleSignOut = () => {
    try {
      if (isSupabaseConfigured()) {
        createSupabaseBrowserClient().auth.signOut();
      }
    } catch {
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur font-sans">
        <nav
          aria-label={tr("Main navigation", "প্রধান নেভিগেশন")}
          className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
        >
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label={tr("QuestionBank home", "QuestionBank হোম")}
          >
            <span className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BookOpenCheck className="size-4 sm:size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground">
              Question<span className="text-primary">Bank</span>
            </span>
          </Link>

          <div className="hidden items-center gap-0.5 md:flex xl:gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActivePath(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-[13px] font-medium transition-colors hover:bg-secondary hover:text-foreground xl:px-3 xl:text-sm",
                    active ? "bg-secondary text-primary font-semibold" : "text-muted-foreground",
                  )}
                >
                  {Icon && <Icon className="size-4" aria-hidden="true" />}
                  <span>{tr(...link.label)}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-1 md:flex xl:gap-2">
            <LanguageSwitcher />
            {user ? (
              <form action={signOutAction} onSubmit={handleSignOut}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 whitespace-nowrap px-2.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive xl:px-4"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  {tr("Log out", "লগআউট")}
                </Button>
              </form>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login" className="whitespace-nowrap px-2.5 xl:px-4">
                    {tr("Log in", "লগইন")}
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/register" className="whitespace-nowrap px-3 xl:px-4">
                    {tr("Register", "রেজিস্টার")}
                  </Link>
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 md:hidden">
            <LanguageSwitcher />
            {!user ? (
              <Button size="sm" asChild className="h-8 px-3 text-xs">
                <Link href="/login">{tr("Log in", "লগইন")}</Link>
              </Button>
            ) : (
              <form action={signOutAction} onSubmit={handleSignOut}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title={tr("Log out", "লগআউট")}
                >
                  <LogOut className="size-3.5" aria-hidden="true" />
                  <span className="text-[11px]">{tr("Log out", "লগআউট")}</span>
                </Button>
              </form>
            )}
          </div>
        </nav>
      </header>

      <nav
        aria-label={tr("Mobile bottom navigation", "মোবাইল নিচের নেভিগেশন")}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-background/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md shadow-lg md:hidden font-sans"
      >
        <div className="flex h-16 items-center justify-around px-1">
          {mobileNavItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors",
                  active
                    ? "font-semibold text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg transition-colors",
                    active && "bg-primary/10 text-primary",
                  )}
                >
                  {Icon && (
                    <Icon className={cn("size-4.5", active ? "stroke-[2.2]" : "stroke-[1.8]")} aria-hidden="true" />
                  )}
                </span>
                <span className="text-[10px] tracking-tight">{tr(...item.label)}</span>
              </Link>
            );
          })}

          {user && (
            <form action={signOutAction} onSubmit={handleSignOut} className="flex-1">
              <button
                type="submit"
                className="flex w-full flex-col items-center justify-center gap-1 py-1 text-muted-foreground transition-colors hover:text-destructive"
              >
                <span className="flex size-7 items-center justify-center rounded-lg">
                  <LogOut className="size-4.5 stroke-[1.8]" aria-hidden="true" />
                </span>
                <span className="text-[10px] tracking-tight">{tr("Log out", "লগআউট")}</span>
              </button>
            </form>
          )}
        </div>
      </nav>
    </>
  );
}
