import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  BookmarkCheck,
  CalendarClock,
  CheckCircle2,
  Layers,
  Sparkles,
  Timer,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Navbar } from "@/components/site/Navbar";
import { signOutAction } from "@/lib/auth/actions";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";
import { getQuestionManifest } from "@/lib/questions/storage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ড্যাশবোর্ড — QuestionBank",
  description: "আপনার অ্যাকাউন্টের অ্যাক্সেস, বিষয় এবং প্রশ্ন ব্যাংক ড্যাশবোর্ড।",
};

const BENGALI_SUBJECT_NAMES: Record<string, string> = {
  physics: "পদার্থবিজ্ঞান",
  chemistry: "রসায়ন",
  mathematics: "উচ্চতর গণিত",
  biology: "জীববিজ্ঞান",
  ict: "আইসিটি",
  other: "সাধারণ বিষয়",
};

export default async function UserDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  const manifest = await getQuestionManifest().catch(() => null);

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const rawRole = profile?.role ?? "user";

  const displayName =
    profile?.full_name?.trim() ||
    (typeof meta["full_name"] === "string" ? meta["full_name"] : "") ||
    user.email?.split("@")[0] ||
    "শিক্ষার্থী";

  const planName =
    (typeof meta["plan_name"] === "string" && meta["plan_name"]) ||
    (typeof meta["plan"] === "string" && meta["plan"]) ||
    (rawRole === "admin" || rawRole === "super_admin"
      ? "Admin Pro (লাইফটাইম অ্যাক্সেস)"
      : "Scholar Plan");

  const expiresAt =
    (typeof meta["access_expires_at"] === "string" && meta["access_expires_at"]) ||
    (typeof meta["subscription_expires_at"] === "string" && meta["subscription_expires_at"]) ||
    null;

  let remainingDaysText = "৩০ দিন বাকি";
  let expiryDateFormatted = "";

  if (expiresAt) {
    const expDate = new Date(expiresAt);
    if (!Number.isNaN(expDate.getTime())) {
      const diffMs = expDate.getTime() - Date.now();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      remainingDaysText = diffDays > 0 ? `${diffDays.toLocaleString("bn-BD")} দিন বাকি` : "মেয়াদ উত্তীর্ণ";
      expiryDateFormatted = expDate.toLocaleDateString("bn-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  } else if (rawRole === "admin" || rawRole === "super_admin") {
    remainingDaysText = "আজীবন অ্যাক্সেস";
  }

  const allowedSubjectSlugs: string[] | null = Array.isArray(meta["accessible_subjects"])
    ? (meta["accessible_subjects"] as string[])
    : Array.isArray(meta["allowed_subjects"])
      ? (meta["allowed_subjects"] as string[])
      : null;

  const allSubjects = manifest?.subjects ?? [];
  const accessibleSubjects = allowedSubjectSlugs
    ? allSubjects.filter((s) => allowedSubjectSlugs.includes(s.slug))
    : allSubjects;

  const totalAccessibleMcq = accessibleSubjects.reduce((sum, s) => sum + (s.mcq ?? 0), 0);

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar initialUser={user} />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                স্বাগতম, {displayName.split(" ")[0]}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                আপনার স্টাডি অ্যাক্সেস ও পরীক্ষার প্রস্তুতি ড্যাশবোর্ড
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2 sm:pt-0">
              <span className="text-xs text-muted-foreground">{user.email}</span>
              <form action={signOutAction}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground transition-colors hover:text-destructive hover:border-destructive/40"
                >
                  লগআউট
                </Button>
              </form>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/70 shadow-sm transition-all hover:border-primary/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">বর্তমান প্ল্যান</span>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="size-4" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-3">
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {planName}
                  </h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    <span>অ্যাক্সেস সক্রিয়</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm transition-all hover:border-primary/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">মেয়াদ বাকি</span>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <CalendarClock className="size-4" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-3">
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {remainingDaysText}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {expiryDateFormatted ? `মেয়াদ: ${expiryDateFormatted}` : "সীমাহীন বা সক্রিয় মেয়াদ"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm transition-all hover:border-primary/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">মোট অ্যাক্সেসযোগ্য MCQ</span>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-3">
                  <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">
                    {totalAccessibleMcq > 0
                      ? totalAccessibleMcq.toLocaleString("bn-BD")
                      : "০"}{" "}
                    <span className="text-sm font-normal text-muted-foreground">টি</span>
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    আপনার সিলেক্টেড বিষয়ে উপলব্ধ
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm transition-all hover:border-primary/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">অ্যাক্সেস পাওয়া বিষয়</span>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Layers className="size-4" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-3">
                  <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">
                    {accessibleSubjects.length.toLocaleString("bn-BD")}{" "}
                    <span className="text-sm font-normal text-muted-foreground">টি বিষয়</span>
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground truncate" title={accessibleSubjects.map((s) => BENGALI_SUBJECT_NAMES[s.slug] ?? s.name).join(", ")}>
                    {accessibleSubjects.map((s) => BENGALI_SUBJECT_NAMES[s.slug] ?? s.name).slice(0, 3).join(", ")}
                    {accessibleSubjects.length > 3 ? "..." : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4 border-border/70 bg-card/60 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  অ্যাক্সেস পাওয়া বিষয়সমূহের তালিকা:
                </span>
                <span className="text-xs text-muted-foreground">
                  যেকোনো বিষয়ে ক্লিক করে সরাসরি প্রশ্ন অনুশীলন করো
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {accessibleSubjects.length === 0 ? (
                  <span className="text-xs text-muted-foreground">কোনো বিষয়ের অ্যাক্সেস পাওয়া যায়নি</span>
                ) : (
                  accessibleSubjects.map((sub) => {
                    const banglaName = BENGALI_SUBJECT_NAMES[sub.slug] ?? sub.name;
                    return (
                      <Link
                        key={sub.slug}
                        href={`/questions?subject=${sub.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                      >
                        <span>{banglaName}</span>
                        <span className="rounded-full bg-background px-1.5 py-0.2 text-[10px] text-muted-foreground">
                          {sub.mcq.toLocaleString("bn-BD")}
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <section className="mt-10" aria-labelledby="quick-start-heading">
            <div className="mb-4">
              <h2 id="quick-start-heading" className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                দ্রুত শুরু করো
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                নিচের যেকোনো অপশন নির্বাচন করে এখনই অনুশীলন শুরু করো
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Link
                href="/questions"
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <BookOpen className="size-6" aria-hidden="true" />
                    </span>
                    <Badge variant="outline" className="border-primary/30 text-[11px] font-normal text-primary">
                      অনুশীলন
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-foreground group-hover:text-primary">
                    প্রশ্ন অনুশীলন
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    বিষয় ও অধ্যায় নির্বাচন করে সাজানো প্রশ্ন ও ব্যাখ্যাসহ সমাধান অনুশীলন করো।
                  </p>
                </div>
                <div className="mt-5 flex items-center text-xs font-semibold text-primary">
                  <span>অনুশীলন শুরু করো</span>
                  <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>

              <Link
                href="/model-test"
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-colors group-hover:bg-amber-500 group-hover:text-white">
                      <Timer className="size-6" aria-hidden="true" />
                    </span>
                    <Badge variant="outline" className="border-amber-500/30 text-[11px] font-normal text-amber-600 dark:text-amber-400">
                      টাইমার
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    মডেল টেস্ট
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    নির্দিষ্ট সময়ে পরীক্ষা দিয়ে নিজেকে প্রস্তুত করো এবং সঠিক টাইম ম্যানেজমেন্ট শেখো।
                  </p>
                </div>
                <div className="mt-5 flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <span>পরীক্ষা দাও</span>
                  <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>

              <Link
                href="/questions"
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                      <BookmarkCheck className="size-6" aria-hidden="true" />
                    </span>
                    <Badge variant="outline" className="border-blue-500/30 text-[11px] font-normal text-blue-600 dark:text-blue-400">
                      রিভিশন
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    সেভ করা প্রশ্ন
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    রিভিশন দেওয়ার জন্য গুরুত্বপূর্ণ ও কঠিন প্রশ্নগুলো সহজে সংরক্ষণ করে রাখো।
                  </p>
                </div>
                <div className="mt-5 flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>সংগ্রহ দেখুন</span>
                  <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
