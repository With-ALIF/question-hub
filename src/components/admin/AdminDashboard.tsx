"use client";

import { useState } from "react";
import {
  BookOpen,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquareText,
  ReceiptText,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AdminDashboardData } from "@/lib/admin/dashboard";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: ListChecks, label: "Questions", active: false },
  { icon: BookOpen, label: "Subjects", active: false },
  { icon: ReceiptText, label: "Subscriptions", active: false },
  { icon: MessageSquareText, label: "Feedback", active: false },
] as const;

export function AdminDashboard({
  data,
  error,
}: {
  data: AdminDashboardData;
  error: string | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <p className="px-4 pb-4 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
        Admin panel
      </p>
      <nav aria-label="Admin sections" className="flex flex-col gap-1">
        {sidebarItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              item.active
                ? "bg-primary text-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            <item.icon className="size-4" aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </nav>
      <button
        type="button"
        className="mt-auto flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Log out
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-sidebar-border bg-sidebar p-3 lg:block">
        {sidebar}
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-60 border-r border-sidebar-border bg-sidebar p-3">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            </button>
            <h1 className="font-display text-lg font-bold text-foreground">Dashboard</h1>
          </div>
        </header>

        <main className="flex-1 space-y-8 p-4 sm:p-6">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <section aria-label="Overview statistics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section aria-labelledby="subject-summary-heading">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="subject-summary-heading" className="font-display text-lg font-semibold text-foreground">
                  Subjects
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Live from the Storage manifest.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              {data.subjects.length === 0 ? (
                <Card className="border-dashed sm:col-span-2 xl:col-span-6">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    No Storage subjects yet. Run the shard build script to populate this section.
                  </CardContent>
                </Card>
              ) : (
                data.subjects.map((subject) => (
                  <Card key={subject.id}>
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{subject.name}</p>
                        <Badge variant="secondary" className="font-normal">Active</Badge>
                      </div>
                      <p className="mt-2 font-display text-2xl font-bold text-primary">
                        {subject.questionCount.toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {subject.mcqCount.toLocaleString()} MCQ · {subject.writtenCount.toLocaleString()} written
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
