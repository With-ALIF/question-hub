"use client";

import Link from "next/link";
import {
  ExternalLink,
  Flag,
  Globe,
  Images,
  LayoutDashboard,
  ListChecks,
  LogOut,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Wallet,
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
  const isDashboardActive =
    currentPath === "/admin/dashboard" || currentPath === "/admin";
  const isQuestionsActive = currentPath.startsWith("/admin/questions");
  const isReportsActive = currentPath.startsWith("/admin/reports");
  const isOrdersActive = currentPath.startsWith("/admin/orders");
  const isSubscriptionsActive = currentPath.startsWith("/admin/subscriptions");
  const isPlansActive = currentPath.startsWith("/admin/plans");
  const isHomeSliderActive = currentPath.startsWith("/admin/home-slider");

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
                  const isActive =
                    item.href === "/admin/dashboard"
                      ? isDashboardActive
                      : currentPath.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all group",
                        isActive
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
                              isActive
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

      {/* Mobile Top Header (compact banner on mobile) */}
      <div className="flex h-12 w-full shrink-0 items-center justify-between border-b border-border bg-card/90 px-4 lg:hidden sticky top-0 z-20 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" aria-hidden="true" />
          </span>
          <span className="font-display text-sm font-bold text-foreground">
            Admin Portal
          </span>
        </div>
        <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase">
          {role.replace("_", " ")}
        </span>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Admin mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-card/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md shadow-lg lg:hidden"
      >
        <div className="flex h-16 items-center justify-around px-2">
          {/* Dashboard */}
          <Link
            href="/admin/dashboard"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors",
              isDashboardActive
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-lg transition-colors",
                isDashboardActive && "bg-primary/10 text-primary"
              )}
            >
              <LayoutDashboard className="size-4.5" aria-hidden="true" />
            </span>
            <span className="text-[10px] tracking-tight">ড্যাশবোর্ড</span>
          </Link>

          {/* Questions */}
          <Link
            href="/admin/questions"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors relative",
              isQuestionsActive
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-lg transition-colors",
                isQuestionsActive && "bg-primary/10 text-primary"
              )}
            >
              <ListChecks className="size-4.5" aria-hidden="true" />
            </span>
            <span className="text-[10px] tracking-tight">প্রশ্ন</span>
          </Link>

          {/* Reports */}
          <Link
            href="/admin/reports"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors relative",
              isReportsActive
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-lg transition-colors",
                isReportsActive && "bg-primary/10 text-primary"
              )}
            >
              <Flag className="size-4.5" aria-hidden="true" />
            </span>
            <span className="text-[10px] tracking-tight">রিপোর্ট</span>
          </Link>

          {/* Payments */}
          <Link
            href="/admin/orders"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors relative",
              isOrdersActive
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-lg transition-colors",
                isOrdersActive && "bg-primary/10 text-primary"
              )}
            >
              <Wallet className="size-4.5" aria-hidden="true" />
            </span>
            <span className="text-[10px] tracking-tight">পেমেন্ট</span>
          </Link>

          {/* Subscriptions */}
          <Link
            href="/admin/subscriptions"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors relative",
              isSubscriptionsActive
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-lg transition-colors",
                isSubscriptionsActive && "bg-primary/10 text-primary"
              )}
            >
              <ShieldCheck className="size-4.5" aria-hidden="true" />
            </span>
            <span className="text-[10px] tracking-tight">প্ল্যান</span>
          </Link>

          {/* Plans & Limits */}
          <Link
            href="/admin/plans"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors relative",
              isPlansActive
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-lg transition-colors",
                isPlansActive && "bg-primary/10 text-primary"
              )}
            >
              <SlidersHorizontal className="size-4.5" aria-hidden="true" />
            </span>
            <span className="text-[10px] tracking-tight">লিমিট</span>
          </Link>

          {/* Slider */}
          <Link
            href="/admin/home-slider"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors",
              isHomeSliderActive
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-lg transition-colors",
                isHomeSliderActive && "bg-primary/10 text-primary"
              )}
            >
              <Images className="size-4.5" aria-hidden="true" />
            </span>
            <span className="text-[10px] tracking-tight">স্লাইডার</span>
          </Link>

          {/* Website */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 flex-col items-center justify-center gap-1 py-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex size-7 items-center justify-center rounded-lg">
              <Globe className="size-4.5" aria-hidden="true" />
            </span>
            <span className="text-[10px] tracking-tight">সাইট</span>
          </Link>

          {/* Logout */}
          <form action={adminSignOutAction} className="flex-1">
            <button
              type="submit"
              className="flex w-full flex-col items-center justify-center gap-1 py-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            >
              <span className="flex size-7 items-center justify-center rounded-lg">
                <LogOut className="size-4.5" aria-hidden="true" />
              </span>
              <span className="text-[10px] tracking-tight">লগআউট</span>
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
