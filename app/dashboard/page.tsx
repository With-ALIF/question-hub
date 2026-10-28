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
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/site/Navbar";
import { signOutAction } from "@/lib/auth/actions";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/roles";
import { getQuestionManifest } from "@/lib/questions/storage";
import { getMyPendingOrder, getMySubscription } from "@/lib/payments/queries";
import { localeForLanguage } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  return {
    title: tr("Dashboard — QuestionBank", "ড্যাশবোর্ড — QuestionBank"),
    description: tr(
      "Your account access, subjects and question bank dashboard.",
      "আপনার অ্যাকাউন্টের অ্যাক্সেস, বিষয় এবং প্রশ্ন ব্যাংক ড্যাশবোর্ড।",
    ),
  };
}

type DashboardPageProps = {
  searchParams?: Promise<{
    code?: string | string[] | undefined;
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function UserDashboard(props: DashboardPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const codeRaw = searchParams?.["code"];
  const code = typeof codeRaw === "string" ? codeRaw : undefined;

  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}&next=/dashboard`);
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, manifest, subscription, pendingOrder] = await Promise.all([
    getCurrentProfile(),
    getQuestionManifest().catch(() => null),
    getMySubscription(),
    getMyPendingOrder(),
  ]);

  if (isAdminRole(profile?.role)) {
    redirect("/admin/dashboard");
  }
  const { tr, num, lang, subjectName } = await getI18n();
  const locale = localeForLanguage(lang);

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const rawRole = profile?.role ?? "user";

  const displayName =
    profile?.full_name?.trim() ||
    (typeof meta["full_name"] === "string" ? meta["full_name"] : "") ||
    user.email?.split("@")[0] ||
    tr("Student", "শিক্ষার্থী");

  const metaPlanName =
    (typeof meta["plan_name"] === "string" && meta["plan_name"]) ||
    (typeof meta["plan"] === "string" && meta["plan"]) ||
    null;

  const planName =
    subscription?.plan_name ||
    metaPlanName ||
    tr("Starter (Free)", "Starter (ফ্রি)");

  const expiresAt =
    subscription?.expires_at ||
    (typeof meta["access_expires_at"] === "string" && meta["access_expires_at"]) ||
    (typeof meta["subscription_expires_at"] === "string" && meta["subscription_expires_at"]) ||
    null;

  let remainingDaysText = tr(`${num(30)} days left`, `${num(30)} দিন বাকি`);
  let expiryDateFormatted = "";

  if (expiresAt) {
    const expDate = new Date(expiresAt);
    if (!Number.isNaN(expDate.getTime())) {
      const diffMs = expDate.getTime() - Date.now();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      remainingDaysText =
        diffDays > 0
          ? tr(`${num(diffDays)} days left`, `${num(diffDays)} দিন বাকি`)
          : tr("Expired", "মেয়াদ উত্তীর্ণ");
      expiryDateFormatted = expDate.toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
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
  const accessibleNames = accessibleSubjects.map((s) => subjectName(s.slug, s.name));

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar initialUser={user} />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {tr("Welcome,", "স্বাগতম,")} {displayName.split(" ")[0]}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {tr(
                  "Your study access and exam preparation dashboard",
                  "আপনার স্টাডি অ্যাক্সেস ও পরীক্ষার প্রস্তুতি ড্যাশবোর্ড",
                )}
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
                  {tr("Log out", "লগআউট")}
                </Button>
              </form>
            </div>
          </div>

          {pendingOrder && (
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <CalendarClock className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {tr("Payment under review", "পেমেন্ট যাচাই চলছে")}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {tr(
                      `Order ${pendingOrder.order_code} · ${pendingOrder.plan_name} · ৳${num(pendingOrder.amount_bdt)}. We usually verify within 24 hours.`,
                      `অর্ডার ${pendingOrder.order_code} · ${pendingOrder.plan_name} · ৳${num(pendingOrder.amount_bdt)}। সাধারণত ২৪ ঘণ্টার মধ্যে যাচাই করা হয়।`,
                    )}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="self-start border-amber-500/40 bg-amber-500/10 text-[11px] font-semibold text-amber-700 dark:text-amber-400 sm:self-auto"
              >
                {tr("Pending", "পেন্ডিং")}
              </Badge>
            </div>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/70 shadow-sm transition-all hover:border-primary/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {tr("Current plan", "বর্তমান প্ল্যান")}
                  </span>
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
                    <span>{tr("Access active", "অ্যাক্সেস সক্রিয়")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm transition-all hover:border-primary/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {tr("Time remaining", "মেয়াদ বাকি")}
                  </span>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <CalendarClock className="size-4" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-3">
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {remainingDaysText}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {expiryDateFormatted
                      ? tr(`Expiry: ${expiryDateFormatted}`, `মেয়াদ: ${expiryDateFormatted}`)
                      : tr("Unlimited or active term", "সীমাহীন বা সক্রিয় মেয়াদ")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm transition-all hover:border-primary/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {tr("Total accessible MCQs", "মোট অ্যাক্সেসযোগ্য MCQ")}
                  </span>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-3">
                  <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">
                    {num(totalAccessibleMcq)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {tr("total", "টি")}
                    </span>
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tr("Available in your selected subjects", "আপনার সিলেক্টেড বিষয়ে উপলব্ধ")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm transition-all hover:border-primary/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {tr("Subjects with access", "অ্যাক্সেস পাওয়া বিষয়")}
                  </span>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Layers className="size-4" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-3">
                  <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">
                    {num(accessibleSubjects.length)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {tr("subjects", "টি বিষয়")}
                    </span>
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground truncate" title={accessibleNames.join(", ")}>
                    {accessibleNames.slice(0, 3).join(", ")}
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
                  {tr("Subjects you can access:", "অ্যাক্সেস পাওয়া বিষয়সমূহের তালিকা:")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tr(
                    "Click any subject to practise its questions directly",
                    "যেকোনো বিষয়ে ক্লিক করে সরাসরি প্রশ্ন অনুশীলন করুন",
                  )}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {accessibleSubjects.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {tr("No subject access found", "কোনো বিষয়ের অ্যাক্সেস পাওয়া যায়নি")}
                  </span>
                ) : (
                  accessibleSubjects.map((sub) => (
                    <Link
                      key={sub.slug}
                      href={`/questions?subject=${sub.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                    >
                      <span>{subjectName(sub.slug, sub.name)}</span>
                      <span className="rounded-full bg-background px-1.5 py-0.2 text-[10px] text-muted-foreground">
                        {num(sub.mcq)}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <section className="mt-10" aria-labelledby="quick-start-heading">
            <div className="mb-4">
              <h2 id="quick-start-heading" className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {tr("Quick start", "দ্রুত শুরু করুন")}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {tr(
                  "Pick any option below and start practising right now",
                  "নিচের যেকোনো অপশন নির্বাচন করে এখনই অনুশীলন শুরু করুন",
                )}
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
                      {tr("Practice", "অনুশীলন")}
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-foreground group-hover:text-primary">
                    {tr("Practise questions", "প্রশ্ন অনুশীলন")}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {tr(
                      "Pick subjects and chapters, then practise curated questions with explanations.",
                      "বিষয় ও অধ্যায় নির্বাচন করে সাজানো প্রশ্ন ও ব্যাখ্যাসহ সমাধান অনুশীলন করুন।",
                    )}
                  </p>
                </div>
                <div className="mt-5 flex items-center text-xs font-semibold text-primary">
                  <span>{tr("Start practising", "অনুশীলন শুরু করুন")}</span>
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
                      {tr("Timer", "টাইমার")}
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    {tr("Model test", "মডেল টেস্ট")}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {tr(
                      "Take timed tests to prepare yourself and learn proper time management.",
                      "নির্দিষ্ট সময়ে পরীক্ষা দিয়ে নিজেকে প্রস্তুত করুন এবং সঠিক টাইম ম্যানেজমেন্ট শিখুন।",
                    )}
                  </p>
                </div>
                <div className="mt-5 flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <span>{tr("Take a test", "পরীক্ষা দিন")}</span>
                  <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>

              <Link
                href="/saved"
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                      <BookmarkCheck className="size-6" aria-hidden="true" />
                    </span>
                    <Badge variant="outline" className="border-blue-500/30 text-[11px] font-normal text-blue-600 dark:text-blue-400">
                      {tr("Revision", "রিভিশন")}
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {tr("Saved questions", "সেভ করা প্রশ্ন")}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {tr(
                      "Keep important and difficult questions saved for quick revision.",
                      "রিভিশন দেওয়ার জন্য গুরুত্বপূর্ণ ও কঠিন প্রশ্নগুলো সহজে সংরক্ষণ করে রাখুন।",
                    )}
                  </p>
                </div>
                <div className="mt-5 flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>{tr("View collection", "সংগ্রহ দেখুন")}</span>
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
