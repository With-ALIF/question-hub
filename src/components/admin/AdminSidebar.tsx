"use client";

import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  Globe,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";
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
];

export function AdminSidebar({ currentPath, role = "admin", totalQuestions }: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card border-r border-border">
      {/* Brand header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-base font-bold text-foreground">Admin Portal</span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary uppercase">
              {role.replace("_", " ")}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">QuestionBank Management</p>
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
                  ? currentPath === "/admin/dashboard" || currentPath === "/admin"
                  : currentPath.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="size-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                  {item.badgeKey === "questions" && typeof totalQuestions === "number" && (
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
                <Globe className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>Visit Website</span>
              </div>
              <ExternalLink className="size-3 text-muted-foreground/60" aria-hidden="true" />
            </Link>
            <Link
              href="/questions"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>Student View</span>
              </div>
              <ExternalLink className="size-3 text-muted-foreground/60" aria-hidden="true" />
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
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Top Bar */}
      <div className="flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-secondary"
            aria-label="Open navigation"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <span className="font-display font-bold text-foreground">Admin Portal</span>
        </div>
        <form action={adminSignOutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </form>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 shadow-2xl">
            <div className="relative h-full">
              {sidebarContent}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-3 inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
