import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  BookmarkCheck,
  CalendarClock,
  CheckCircle2,
  FileText,
  Layers,
  Sparkles,
  Timer,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FreeSubjectPicker } from "@/components/dashboard/FreeSubjectPicker";
import { DatabasePicker } from "@/components/dashboard/DatabasePicker";
import { Navbar } from "@/components/site/Navbar";
import { signOutAction } from "@/lib/auth/actions";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/roles";
import { getEntitlement } from "@/lib/access";
import { getActiveDatabases } from "@/lib/access/databases";
import { getQuestionManifest } from "@/lib/questions/storage";
import { getMyPendingOrder } from "@/lib/payments/queries";
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

  const [profile, manifest, entitlement, pendingOrder, databases] = await Promise.all([
    getCurrentProfile(),
    getQuestionManifest().catch(() => null),
    getEntitlement(user.id),
    getMyPendingOrder(),
    getActiveDatabases(),
  ]);

  if (isAdminRole(profile?.role)) {
    redirect("/admin/dashboard");
  }
  const { tr, num, lang, subjectName } = await getI18n();
  const locale = localeForLanguage(lang);

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const displayName =
    profile?.full_name?.trim() ||
    (typeof meta["full_name"] === "string" ? meta["full_name"] : "") ||
    user.email?.split("@")[0] ||
    tr("Student", "শিক্ষার্থী");

  const isPaid = entitlement.paidAccess && entitlement.status === "active";
  const freePlanName = tr("Starter (Free)", "Starter (ফ্রি)");
  const planName =
    entitlement.status === "unavailable"
      ? tr("Verification unavailable", "যাচাই করা যাচ্ছে না")
      : isPaid
        ? entitlement.planName ?? freePlanName
        : entitlement.status === "cancelled"
          ? freePlanName
          : entitlement.lastPlanName ?? entitlement.planName ?? freePlanName;

  const accessStatus =
    entitlement.status === "active"
      ? {
          label: tr("Access active", "অ্যাক্সেস সক্রিয়"),
          className: "text-emerald-600 dark:text-emerald-400",
        }
      : entitlement.status === "expired"
        ? {
            label: tr("Expired — renew to continue", "মেয়াদ শেষ — চালিয়ে যেতে রিনিউ করুন"),
            className: "text-amber-600 dark:text-amber-400",
          }
        : entitlement.status === "cancelled"
          ? {
              label: tr("Free plan (subscription cancelled)", "ফ্রি প্ল্যান (সাবস্ক্রিপশন বাতিল)"),
              className: "text-amber-600 dark:text-amber-400",
            }
          : entitlement.status === "unavailable"
            ? {
                label: tr("Could not verify access", "অ্যাক্সেস যাচাই করা যায়নি"),
                className: "text-amber-600 dark:text-amber-400",
              }
            : {
                label: tr("Free plan", "ফ্রি প্ল্যান"),
                className: "text-blue-600 dark:text-blue-400",
              };

  const expiresAt = entitlement.expiresAt;
  const remainingDays = entitlement.remainingDays;

  let remainingDaysText: string;
  if (entitlement.status === "cancelled") {
    remainingDaysText = tr("No paid expiry", "পেইড মেয়াদ নেই");
  } else if (expiresAt && remainingDays !== null) {
    remainingDaysText =
      remainingDays > 0
        ? tr(`${num(remainingDays)} days left`, `${num(remainingDays)} দিন বাকি`)
        : tr("Expired", "মেয়াদ উত্তীর্ণ");
  } else {
    remainingDaysText = tr("No paid expiry", "পেইড মেয়াদ নেই");
  }

  let expiryDateFormatted = "";
  if (expiresAt && entitlement.status !== "cancelled") {
    const expDate = new Date(expiresAt);
    if (!Number.isNaN(expDate.getTime())) {
      expiryDateFormatted = expDate.toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }

  const allowedSubjectSlugs = entitlement.access.subjects;
  const allSubjects = manifest?.subjects ?? [];
  const accessibleSubjects =
    allowedSubjectSlugs === null
      ? allSubjects
      : allSubjects.filter((subject) => allowedSubjectSlugs.includes(subject.slug));

  const totalAccessibleMcq = accessibleSubjects.reduce((sum, subject) => sum + (subject.mcq ?? 0), 0);
  const accessibleNames = accessibleSubjects.map((subject) => subjectName(subject.slug, subject.name));
  const subjectSelectionLimit = entitlement.subjectSelectionLimit;
  const selectedSubject = allowedSubjectSlugs?.[0] ?? null;
  const subjectOptions = allSubjects.map((subject) => ({
    slug: subject.slug,
    name: subjectName(subject.slug, subject.name),
  }));
  const databaseSelectionLimit = entitlement.databaseSelectionLimit;
  const selectedDatabase = entitlement.access.databases?.[0] ?? null;
  const allowedDatabaseSlugs = entitlement.access.allowedDatabases;
  const selectableDatabases =
    allowedDatabaseSlugs === null
      ? databases
      : databases.filter((database) => allowedDatabaseSlugs.includes(database.slug));

  const limitLabel = (limit: number | null) =>
    limit === null ? tr("Unlimited", "আনলিমিটেড") : num(limit);
  const remainingLabel = (remaining: number | null) =>
    remaining === null ? tr("Unlimited", "আনলিমিটেড") : num(remaining);
  const usagePercent = (used: number, limit: number | null) => {
    if (limit === null) return 0;
    if (limit <= 0) return 100;
    return Math.min(100, Math.round((used / limit) * 100));
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar initialUser={user} audience={entitlement.audience} />

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
                  <div className={`mt-1 flex items-center gap-1.5 text-xs font-medium ${accessStatus.className}`}>
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    <span>{accessStatus.label}</span>
                  </div>
                  {!isPaid && (
                    <Button asChild size="sm" className="mt-3 h-7 text-xs">
                      <Link href="/plans">
                        {entitlement.status === "expired"
                          ? tr("Renew plan", "প্ল্যান রিনিউ")
                          : tr("Upgrade plan", "প্ল্যান আপগ্রেড")}
                      </Link>
                    </Button>
                  )}
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
                      : tr("No paid subscription term", "কোনো পেইড সাবস্ক্রিপশন মেয়াদ নেই")}
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
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {tr("Usage summary", "ব্যবহারের সারসংক্ষেপ")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tr("Daily counters reset at midnight", "দৈনিক গণনা মধ্যরাতে রিসেট হবে")} · {entitlement.usageDate}
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    key: "mcq",
                    label: tr("MCQ practice", "MCQ অনুশীলন"),
                    used: entitlement.usage.mcq,
                    limit: entitlement.limits.dailyMcq,
                    remaining: entitlement.remaining.mcq,
                  },
                  ...(entitlement.audience === "student"
                    ? [
                        {
                          key: "model",
                          label: tr("Model tests (today)", "মডেল টেস্ট (আজ)"),
                          used: entitlement.usage.modelTest,
                          limit: entitlement.limits.dailyModelTest,
                          remaining: entitlement.remaining.modelTest,
                        },
                        ...(entitlement.limits.totalModelTest !== null
                          ? [
                              {
                                key: "model-total",
                                label: tr("Model tests (total)", "মডেল টেস্ট (মোট)"),
                                used: entitlement.usage.modelTestTotal,
                                limit: entitlement.limits.totalModelTest,
                                remaining: entitlement.remaining.modelTestTotal,
                              },
                            ]
                          : []),
                      ]
                    : []),
                  {
                    key: "saved",
                    label: tr("Saved questions", "সেভ করা প্রশ্ন"),
                    used: entitlement.usage.savedQuestions,
                    limit: entitlement.limits.savedQuestions,
                    remaining: entitlement.remaining.savedQuestions,
                  },
                  ...(entitlement.audience === "teacher" &&
                  (entitlement.limits.examPapers !== null ||
                    entitlement.usage.examPapers > 0)
                    ? [
                        {
                          key: "exam-papers",
                          label: tr("Exam papers", "পরীক্ষাপত্র"),
                          used: entitlement.usage.examPapers,
                          limit: entitlement.limits.examPapers,
                          remaining: entitlement.remaining.examPapers,
                        },
                      ]
                    : []),
                ].map((row) => {
                  const percent = usagePercent(row.used, row.limit);
                  return (
                    <div key={row.key} className="rounded-lg border border-border/70 bg-background/60 p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{row.label}</span>
                        <span className="text-muted-foreground">
                          {num(row.used)} / {limitLabel(row.limit)}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full ${
                            percent >= 100 ? "bg-destructive" : "bg-primary"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {tr("Remaining:", "বাকি:")} {remainingLabel(row.remaining)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {(!isPaid || entitlement.status === "cancelled") && (
                <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  {entitlement.status === "cancelled"
                    ? tr(
                        "Your subscription was cancelled. Paid explanations and model tests are locked.",
                        "আপনার সাবস্ক্রিপশন বাতিল হয়েছে। পেইড ব্যাখ্যা ও মডেল টেস্ট লক করা আছে।",
                      )
                    : entitlement.status === "expired"
                      ? tr(
                          "Your paid access has expired automatically. Renew your plan to restore it.",
                          "আপনার পেইড অ্যাক্সেস স্বয়ংক্রিয়ভাবে শেষ হয়েছে। ফিরে পেতে প্ল্যান রিনিউ করুন।",
                        )
                      : tr(
                          "You are on the free plan. Explanations, more model tests and database access require an upgrade.",
                          "আপনি ফ্রি প্ল্যানে আছেন। ব্যাখ্যা, বেশি মডেল টেস্ট ও ডেটাবেস অ্যাক্সেসের জন্য আপগ্রেড করুন।",
                        )}
                </p>
              )}
            </CardContent>
          </Card>

          {databaseSelectionLimit > 0 && (
            <DatabasePicker
              databases={selectableDatabases.map((database) => ({
                slug: database.slug,
                name: database.name,
                name_bn: database.name_bn,
                description: database.description,
              }))}
              selected={selectedDatabase}
            />
          )}

          {subjectSelectionLimit > 0 && (
            <FreeSubjectPicker
              subjects={subjectOptions}
              selected={selectedSubject}
              limit={subjectSelectionLimit}
            />
          )}

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

              {entitlement.audience === "teacher" ? (
                <Link
                  href="/exam-paper"
                  className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                        <FileText className="size-6" aria-hidden="true" />
                      </span>
                      <Badge variant="outline" className="border-emerald-500/30 text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                        {tr("Teacher", "শিক্ষক")}
                      </Badge>
                    </div>
                    <h3 className="mt-4 font-display text-base font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      {tr("Exam paper builder", "পরীক্ষাপত্র তৈরি")}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {tr(
                        "Select questions to build custom 4-set question sheets and downloadable PDFs.",
                        "কাস্টম ৪-সেট প্রশ্নপত্র ও সমাধান প্রিন্টযোগ্য PDF তৈরি করতে প্রশ্ন নির্বাচন করুন।",
                      )}
                    </p>
                  </div>
                  <div className="mt-5 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>{tr("Build exam paper", "পরীক্ষাপত্র বানান")}</span>
                    <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </Link>
              ) : (
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
              )}

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
