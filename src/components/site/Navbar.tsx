"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookmarkCheck,
  BookOpenCheck,
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

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOutAction } from "@/lib/auth/actions";

type NavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

const baseNavLinks: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/subjects", label: "Subjects" },
  { href: "/questions", label: "Questions" },
  { href: "/plans", label: "Plans" },
];

const loggedInNavLinks: NavItem[] = [
  { href: "/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { href: "/questions", label: "অনুশীলন", icon: BookOpenCheck },
  { href: "/saved", label: "সেভ করা প্রশ্ন", icon: BookmarkCheck },
  { href: "/model-test", label: "মডেল টেস্ট", icon: Timer },
  { href: "/subjects", label: "বিষয়সমূহ", icon: Layers },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar({ initialUser }: { initialUser?: SupabaseUser | null }) {
  const [user, setUser] = useState<SupabaseUser | null>(initialUser ?? null);
  const pathname = usePathname();

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

  const handleSignOut = () => {
    try {
      if (isSupabaseConfigured()) {
        createSupabaseBrowserClient().auth.signOut();
      }
    } catch {
    }
  };

  const mobileNavItems = user
    ? [
        { href: "/dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
        { href: "/questions", label: "অনুশীলন", icon: BookOpenCheck },
        { href: "/saved", label: "সেভড", icon: BookmarkCheck },
        { href: "/model-test", label: "মডেল টেস্ট", icon: Timer },
        { href: "/subjects", label: "বিষয়সমূহ", icon: Layers },
      ]
    : [
        { href: "/", label: "হোম", icon: Home },
        { href: "/subjects", label: "বিষয়", icon: Layers },
        { href: "/questions", label: "প্রশ্ন", icon: BookOpenCheck },
        { href: "/plans", label: "প্ল্যান", icon: Sparkles },
        { href: "/login", label: "লগইন", icon: LogIn },
      ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur font-sans">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
        >
          <Link href="/" className="flex items-center gap-2" aria-label="Question Bank home">
            <span className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BookOpenCheck className="size-4 sm:size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground">
              Question<span className="text-primary">Bank</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActivePath(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground",
                    active ? "bg-secondary text-primary font-semibold" : "text-muted-foreground",
                  )}
                >
                  {Icon && <Icon className="size-4" aria-hidden="true" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <form action={signOutAction} onSubmit={handleSignOut}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  লগআউট
                </Button>
              </form>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {!user && (
              <Button size="sm" asChild className="h-8 px-3 text-xs">
                <Link href="/login">Log in</Link>
              </Button>
            )}
          </div>
        </nav>
      </header>

      <nav
        aria-label="Mobile bottom navigation"
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
                  <Icon className={cn("size-4.5", active ? "stroke-[2.2]" : "stroke-[1.8]")} aria-hidden="true" />
                </span>
                <span className="text-[10px] tracking-tight">{item.label}</span>
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
                <span className="text-[10px] tracking-tight">লগআউট</span>
              </button>
            </form>
          )}
        </div>
      </nav>
    </>
  );
}
