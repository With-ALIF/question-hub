"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookmarkCheck,
  BookOpenCheck,
  ChevronRight,
  FileText,
  Home,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  LogIn,
  LogOut,
  Menu,
  Sparkles,
  Timer,
  X,
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
  { href: "/plans", label: ["Plans", "প্ল্যান"] },
];

const loggedInNavLinks: NavItem[] = [
  { href: "/dashboard", label: ["Dashboard", "ড্যাশবোর্ড"], icon: LayoutDashboard },
  { href: "/subjects", label: ["Subjects", "বিষয়সমূহ"], icon: Layers },
  { href: "/questions", label: ["Practice", "অনুশীলন"], icon: BookOpenCheck },
  { href: "/exam-paper", label: ["Exam Paper", "পরীক্ষাপত্র"], icon: FileText },
  { href: "/saved", label: ["Saved Questions", "সেভ করা প্রশ্ন"], icon: BookmarkCheck },
  { href: "/model-test", label: ["Model Test", "মডেল টেস্ট"], icon: Timer },
  { href: "/plans", label: ["Plans", "প্ল্যান"], icon: Sparkles },
  { href: "/support", label: ["Support", "সাপোর্ট"], icon: LifeBuoy },
];

const loggedOutMobileLinks: NavItem[] = [
  { href: "/", label: ["Home", "হোম"], icon: Home },
  { href: "/subjects", label: ["Subjects", "বিষয়"], icon: Layers },
  { href: "/questions", label: ["Questions", "প্রশ্ন"], icon: BookOpenCheck },
  { href: "/plans", label: ["Plans", "প্ল্যান"], icon: Sparkles },
];

const loggedInMobileLinks: NavItem[] = [
  { href: "/dashboard", label: ["Dashboard", "ড্যাশবোর্ড"], icon: LayoutDashboard },
  { href: "/subjects", label: ["Subjects", "বিষয়"], icon: Layers },
  { href: "/questions", label: ["Practice", "অনুশীলন"], icon: BookOpenCheck },
  { href: "/exam-paper", label: ["Exam", "পরীক্ষা"], icon: FileText },
  { href: "/saved", label: ["Saved", "সেভড"], icon: BookmarkCheck },
  { href: "/model-test", label: ["Model Test", "মডেল টেস্ট"], icon: Timer },
  { href: "/plans", label: ["Plans", "প্ল্যান"], icon: Sparkles },
  { href: "/support", label: ["Support", "সাপোর্ট"], icon: LifeBuoy },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar({
  initialUser,
  audience,
}: {
  initialUser?: SupabaseUser | null | undefined;
  audience?: "student" | "teacher" | null | undefined;
}) {
  const [user, setUser] = useState<SupabaseUser | null>(initialUser ?? null);
  const [menuOpen, setMenuOpen] = useState(false);
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

  useEffect(() => {
    if (!menuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const navLinks = useMemo(() => {
    if (!user) return baseNavLinks;
    return loggedInNavLinks.filter((item) => {
      if (audience === "student" && item.href === "/exam-paper") return false;
      if (audience === "teacher" && item.href === "/model-test") return false;
      return true;
    });
  }, [user, audience]);

  const mobileNavItems = useMemo(() => {
    if (!user) return loggedOutMobileLinks;
    return loggedInMobileLinks.filter((item) => {
      if (audience === "student" && item.href === "/exam-paper") return false;
      if (audience === "teacher" && item.href === "/model-test") return false;
      return true;
    });
  }, [user, audience]);

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
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border/70 bg-background text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={menuOpen ? tr("Close menu", "মেনু বন্ধ করুন") : tr("Open menu", "মেনু খুলুন")}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? (
                <X className="size-4.5" aria-hidden="true" />
              ) : (
                <Menu className="size-4.5" aria-hidden="true" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {menuOpen ? (
        <>
          <button
            type="button"
            aria-label={tr("Close menu", "মেনু বন্ধ করুন")}
            className="fixed inset-0 z-30 cursor-default bg-black/25 backdrop-blur-[1px] md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="mobile-menu"
            className="fixed inset-x-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-border bg-background shadow-xl md:hidden sm:top-16 sm:max-h-[calc(100dvh-4rem)]"
          >
            <nav
              aria-label={tr("Mobile navigation", "মোবাইল নেভিগেশন")}
              className="mx-auto max-w-6xl px-4 py-4 sm:px-6"
            >
              <div className="grid gap-1">
                {mobileNavItems.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-secondary",
                      )}
                    >
                      {Icon ? <Icon className="size-4.5" aria-hidden="true" /> : null}
                      <span className="flex-1">{tr(...item.label)}</span>
                      <ChevronRight className="size-4 text-muted-foreground/60" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-border/70 pt-4">
                {user ? (
                  <form action={signOutAction} onSubmit={handleSignOut}>
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      {tr("Log out", "লগআউট")}
                    </Button>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" asChild>
                      <Link href="/login" onClick={() => setMenuOpen(false)}>
                        <LogIn className="size-4" aria-hidden="true" />
                        {tr("Log in", "লগইন")}
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href="/register" onClick={() => setMenuOpen(false)}>
                        {tr("Register", "রেজিস্টার")}
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </>
      ) : null}
    </>
  );
}
