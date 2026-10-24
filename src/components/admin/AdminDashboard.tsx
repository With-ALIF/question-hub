"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Layers, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSidebar } from "./AdminSidebar";
import type { AdminDashboardData } from "@/lib/admin/dashboard";

export function AdminDashboard({
  data,
  error,
  role = "admin",
}: {
  data: AdminDashboardData;
  error: string | null;
  role?: string;
}) {
  const totalQuestionsNum = parseInt(data.stats[0]?.value.replace(/,/g, "") ?? "0", 10);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background w-full overflow-x-hidden">
      {/* Shared Admin Sidebar */}
      <AdminSidebar
        currentPath="/admin/dashboard"
        role={role}
        totalQuestions={totalQuestionsNum}
      />

      <div className="flex min-w-0 flex-1 flex-col w-full">
        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/60 px-4 py-3.5 sm:px-6 backdrop-blur min-h-16">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl truncate">
              Admin Dashboard
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              সিস্টেম ওভারভিউ ও পরিসংখ্যান
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button asChild size="sm" className="gap-2">
              <Link href="/admin/questions">
                <ListChecks className="size-4" />
                <span>প্রশ্নব্যাংক দেখুন</span>
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 space-y-6 sm:space-y-8 p-4 sm:p-6 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {/* Quick Access Action Card */}
          <Card className="border-primary/20 bg-primary/5 shadow-xs overflow-hidden relative">
            <CardContent className="p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 mb-1">
                  Database Active
                </Badge>
                <h3 className="font-display text-lg sm:text-xl font-bold text-foreground break-words">
                  মোট {data.stats[0]?.value ?? "210,000+"} টি প্রশ্ন প্রস্তুত রয়েছে
                </h3>
                <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                  সকল বিষয় ও অধ্যায়ের প্রশ্নসমূহ ফিল্টার করুন, সঠিক উত্তর ও পূর্ণাঙ্গ ব্যাখ্যা যাচাই করুন সরাসরি অ্যাডমিন প্রশ্নব্যাংক থেকে।
                </p>
              </div>
              <Button asChild className="gap-2 shrink-0 w-full sm:w-auto">
                <Link href="/admin/questions">
                  <span>প্রশ্নব্যাংকে যান</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <section aria-label="Overview statistics" className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            {data.stats.map((stat) => (
              <Card key={stat.label} className="border-border/80 bg-card shadow-xs">
                <CardHeader className="pb-1 p-4">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed truncate">{stat.hint}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          {/* Subject Breakdown */}
          <section aria-labelledby="subject-summary-heading" className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="subject-summary-heading" className="font-display text-lg font-bold text-foreground">
                  বিষয়ভিত্তিক প্রশ্ন পরিসংখ্যান
                </h2>
                <p className="text-xs text-muted-foreground">
                  সুপাবেস স্টোরেজ ম্যানিফেস্ট অনুযায়ী লাইভ কাউন্ট
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/questions">সকল প্রশ্ন ফিল্টার করুন →</Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {data.subjects.length === 0 ? (
                <Card className="border-dashed sm:col-span-2 xl:col-span-6">
                  <CardContent className="p-6 text-sm text-muted-foreground text-center">
                    No Storage subjects yet.
                  </CardContent>
                </Card>
              ) : (
                data.subjects.map((subject) => (
                  <Link
                    key={subject.id}
                    href={`/admin/questions?subject=${subject.slug}`}
                    className="block group"
                  >
                    <Card className="h-full border-border/80 bg-card transition-all group-hover:border-primary/50 group-hover:shadow-md cursor-pointer">
                      <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {subject.name}
                          </p>
                          <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                            সক্রিয়
                          </span>
                        </div>
                        <div>
                          <p className="font-display text-2xl font-bold text-primary">
                            {subject.questionCount.toLocaleString()}
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                            {subject.mcqCount.toLocaleString()} MCQ · {subject.writtenCount.toLocaleString()} লিখিত
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
