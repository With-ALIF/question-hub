"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Flag,
  Globe,
  Images,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  LogOut,
  Menu,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { adminSignOutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  currentPath: string;
  role?: string;
  totalQuestions?: number;
};

const navigationItems = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    labelBn: "ড্যাশবোর্ড",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/questions",
    label: "Questions",
    labelBn: "প্রশ্নব্যাংক পরিচালনা",
    icon: ListChecks,
    badgeKey: "questions",
  },
  {
    href: "/admin/reports",
    label: "Reports",
    labelBn: "ভুল রিপোর্টসমূহ",
    icon: Flag,
  },
  {
    href: "/admin/support",
    label: "Support",
    labelBn: "সাপোর্ট টিকিট",
    icon: LifeBuoy,
  },
  {
    href: "/admin/orders",
    label: "Payments",
    labelBn: "পেমেন্ট ও অর্ডার",
    icon: Wallet,
  },
  {
    href: "/admin/users",
    label: "All Users",
    labelBn: "সকল ব্যবহারকারী",
    icon: Users,
  },
  {
    href: "/admin/subscriptions",
    label: "Paid Subscriptions",
    labelBn: "পেইড সাবস্ক্রিপশন",
    icon: ShieldCheck,
  },
  {
    href: "/admin/plans",
    label: "Plans & Limits",
    labelBn: "প্ল্যান ও সীমা",
    icon: SlidersHorizontal,
  },
  {
    href: "/admin/home-slider",
    label: "Home Slider",
    labelBn: "হোম স্লাইডার",
    icon: Images,
  },
];

export function AdminSidebar({
  currentPath,
  role = "admin",
  totalQuestions,
}: AdminSidebarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/admin/dashboard"
      ? currentPath === "/admin/dashboard" || currentPath === "/admin"
      : currentPath.startsWith(href);

  return (
    <>
      {/* Desktop Sidebar (Left Column on lg screens) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-card lg:block">
        <div className="flex h-full flex-col">
          {/* Brand header */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base font-bold text-foreground">
                  Admin Portal
                </span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary uppercase">
                  {role.replace("_", " ")}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                QuestionBank Management
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            <div>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                Navigation
              </p>
              <nav className="space-y-1">
                {navigationItems.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all group",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="size-4 shrink-0" aria-hidden="true" />
                        <span>{item.label}</span>
                      </div>
                      {item.badgeKey === "questions" &&
                        typeof totalQuestions === "number" && (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              active
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                            )}
                          >
                            {totalQuestions.toLocaleString()}
                          </span>
                        )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                Quick Links
              </p>
              <nav className="space-y-1">
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Globe
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span>Visit Website</span>
                  </div>
                  <ExternalLink
                    className="size-3 text-muted-foreground/60"
                    aria-hidden="true"
                  />
                </Link>
              </nav>
            </div>
          </div>

          {/* Footer logout */}
          <div className="p-3 border-t border-border">
            <form action={adminSignOutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header with hamburger menu */}
      <div className="sticky top-0 z-50 flex h-12 w-full shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" aria-hidden="true" />
          </span>
          <span className="font-display text-sm font-bold text-foreground">
            Admin Portal
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase">
            {role.replace("_", " ")}
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="admin-mobile-menu"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-secondary"
          >
            {menuOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Navigation Menu */}
      {menuOpen && (
        <>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation menu"
            className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-sm lg:hidden"
          />
          <nav
            id="admin-mobile-menu"
            aria-label="Admin mobile navigation"
            className="fixed inset-x-0 top-12 z-50 flex max-h-[calc(100vh-3rem)] flex-col overflow-hidden bg-card shadow-xl lg:hidden"
          >
            <div className="flex-1 overflow-y-auto p-3">
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                Navigation
              </p>
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary font-semibold text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="size-4 shrink-0" aria-hidden="true" />
                        <span>{item.label}</span>
                      </span>
                      {item.badgeKey === "questions" &&
                        typeof totalQuestions === "number" && (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              active
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-secondary text-muted-foreground"
                            )}
                          >
                            {totalQuestions.toLocaleString()}
                          </span>
                        )}
                    </Link>
                  );
                })}
              </div>

              <p className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                Quick Links
              </p>
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <span className="flex items-center gap-3">
                  <Globe className="size-4 shrink-0" aria-hidden="true" />
                  <span>Visit Website</span>
                </span>
                <ExternalLink
                  className="size-3 text-muted-foreground/60"
                  aria-hidden="true"
                />
              </Link>
            </div>

            <div className="border-t border-border p-3">
              <form action={adminSignOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  <span>Sign out</span>
                </button>
              </form>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
