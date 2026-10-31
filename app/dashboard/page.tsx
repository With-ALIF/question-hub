import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  BookmarkCheck,
  CalendarClock,
  CheckCircle2,
  FileText,
  Layers,
  LifeBuoy,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AudienceGate } from "@/components/dashboard/AudienceGate";
import { FreeSubjectPicker } from "@/components/dashboard/FreeSubjectPicker";
import { DatabasePicker } from "@/components/dashboard/DatabasePicker";
import { Navbar } from "@/components/site/Navbar";
import { signOutAction } from "@/lib/auth/actions";
import { getCurrentAudience, getCurrentProfile, getCurrentUser } from "@/lib/auth/session";
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

  const [profile, manifest, entitlement, pendingOrder, databases, chosenAudience] =
    await Promise.all([
      getCurrentProfile(),
      getQuestionManifest().catch(() => null),
      getEntitlement(user.id),
      getMyPendingOrder(),
      getActiveDatabases(),
      getCurrentAudience(),
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
  // Free users show whichever free plan their role resolves to: Starter for
  // students, Educator for teachers.
  const freePlanName =
    entitlement.planName ?? tr("Starter (Free)", "Starter (ফ্রি)");
  // Paid users see their paid plan; cancelled, expired, or non-paying users automatically see the Free Plan
  const planName =
    entitlement.status === "unavailable"
      ? tr("Verification unavailable", "যাচাই করা যাচ্ছে না")
      : isPaid
        ? entitlement.planName ?? freePlanName
        : freePlanName;

  const accessStatus =
    entitlement.status === "active"
      ? {
          label: tr("Access active", "অ্যাক্সেস সক্রিয়"),
          className: "text-emerald-600 dark:text-emerald-400",
          icon: "check" as const,
        }
      : entitlement.status === "expired"
        ? {
            label: tr(
              `Free plan (term expired${entitlement.lastPlanName ? ` · ${entitlement.lastPlanName}` : ""})`,
              `ফ্রি প্ল্যান (মেয়াদ শেষ${entitlement.lastPlanName ? ` · ${entitlement.lastPlanName}` : ""})`,
            ),
            className: "text-amber-600 dark:text-amber-400",
            icon: "clock" as const,
          }
        : entitlement.status === "cancelled"
          ? {
              label: tr(
                `Free plan (subscription cancelled${entitlement.lastPlanName ? ` · ${entitlement.lastPlanName}` : ""})`,
                `ফ্রি প্ল্যান (সাবস্ক্রিপশন বাতিল${entitlement.lastPlanName ? ` · ${entitlement.lastPlanName}` : ""})`,
              ),
              className: "text-rose-600 dark:text-rose-400",
              icon: "alert" as const,
            }
          : entitlement.status === "unavailable"
            ? {
                label: tr("Could not verify access", "অ্যাক্সেস যাচাই করা যায়নি"),
                className: "text-amber-600 dark:text-amber-400",
                icon: "alert" as const,
              }
            : {
                label: tr("Free plan active", "ফ্রি প্ল্যান সক্রিয়"),
                className: "text-blue-600 dark:text-blue-400",
                icon: "check" as const,
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

  const isStudentAudience = entitlement.audience === "student";
  const selectedSubjectInfo =
    accessibleSubjects.find((subject) => subject.slug === selectedSubject) ??
    accessibleSubjects[0] ??
    null;
  const needsSubjectChoice = !selectedSubjectInfo && subjectSelectionLimit > 0;
  const needsDatabaseChoice = databaseSelectionLimit > 0 && selectedDatabase === null;

  const dailyModelUsed = entitlement.usage.modelTest;
  const dailyModelLimit = entitlement.limits.dailyModelTest;
  const dailyModelRemaining = entitlement.remaining.modelTest;
  const dailyGoalPercent =
    dailyModelLimit === null
      ? dailyModelUsed > 0
        ? 100
        : 0
      : dailyModelLimit <= 0
        ? 100
        : Math.min(100, Math.round((dailyModelUsed / dailyModelLimit) * 100));
  const dailyGoalMet = dailyModelLimit !== null && dailyModelUsed >= dailyModelLimit;
  const subjectCoveragePercent =
    allSubjects.length > 0
      ? Math.min(100, Math.round((accessibleSubjects.length / allSubjects.length) * 100))
      : 0;

  const continueHref = needsDatabaseChoice
    ? "#choose-database"
    : !isStudentAudience
      ? "/exam-paper"
      : selectedSubjectInfo
        ? `/questions?subject=${selectedSubjectInfo.slug}`
        : needsSubjectChoice
          ? "#choose-subject"
          : "/plans";

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar initialUser={user} audience={entitlement.audience} />

      {profile && !chosenAudience ? <AudienceGate /> : null}

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

          <div className="mt-8 overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-br from-primary/10 via-card to-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  {isStudentAudience ? (
                    <BookOpen className="size-5 sm:size-6" aria-hidden="true" />
                  ) : (
                    <FileText className="size-5 sm:size-6" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    {tr("Continue", "চালিয়ে যান")}
                  </p>
                  <h2 className="mt-0.5 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    {needsDatabaseChoice
                      ? tr("Choose your database", "আপনার ডেটাবেস বেছে নিন")
                      : isStudentAudience
                        ? selectedSubjectInfo
                          ? tr("Continue where you left off", "যেখানে ছিলেন সেখান থেকেই শুরু করুন")
                          : needsSubjectChoice
                            ? tr("Choose your free subject", "আপনার ফ্রি বিষয় বেছে নিন")
                            : tr("Unlock your first subject", "প্রথম বিষয় আনলক করুন")
                        : tr("Build a new exam paper", "নতুন পরীক্ষাপত্র তৈরি করুন")}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {needsDatabaseChoice
                      ? tr(
                          "Pick your HSC, Admission or Job database first.",
                          "প্রথমে আপনার HSC, Admission বা Job ডেটাবেস বেছে নিন।",
                        )
                      : isStudentAudience
                        ? selectedSubjectInfo
                          ? tr(
                              `${subjectName(selectedSubjectInfo.slug, selectedSubjectInfo.name)} · ${num(selectedSubjectInfo.mcq ?? 0)} MCQs available`,
                              `${subjectName(selectedSubjectInfo.slug, selectedSubjectInfo.name)} · ${num(selectedSubjectInfo.mcq ?? 0)}টি MCQ উপলব্ধ`,
                            )
                          : needsSubjectChoice
                            ? tr(
                                "Pick one subject to start practising right away.",
                                "এখনই অনুশীলন শুরু করতে একটি বিষয় বেছে নিন।",
                              )
                            : tr(
                                "Upgrade or renew your plan to access the question bank.",
                                "প্রশ্ন ব্যাংক ব্যবহার করতে প্ল্যান আপগ্রেড বা রিনিউ করুন।",
                              )
                        : tr(
                            "Select questions, arrange them and export a printable PDF.",
                            "প্রশ্ন বেছে নিন, সাজান এবং প্রিন্টযোগ্য PDF এক্সপোর্ট করুন।",
                          )}
                  </p>
                </div>
              </div>
              <Button asChild size="sm" className="shrink-0 gap-1.5">
                <Link href={continueHref}>
                  {needsDatabaseChoice
                    ? tr("Choose database", "ডেটাবেস বেছে নিন")
                    : isStudentAudience
                      ? selectedSubjectInfo
                        ? tr("Resume practice", "অনুশীলন চালিয়ে যান")
                        : needsSubjectChoice
                          ? tr("Choose subject", "বিষয় বেছে নিন")
                          : tr("View plans", "প্ল্যান দেখুন")
                      : tr("Open builder", "বিল্ডার খুলুন")}
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {isStudentAudience
                        ? tr("Today's goal", "আজকের লক্ষ্য")
                        : tr("Question bank access", "প্রশ্ন ব্যাংক অ্যাক্সেস")}
                    </span>
                    <h3 className="mt-1 font-display text-lg font-bold text-foreground">
                      {isStudentAudience
                        ? tr("Model tests", "মডেল টেস্ট")
                        : tr(
                            `${num(accessibleSubjects.length)} subjects`,
                            `${num(accessibleSubjects.length)}টি বিষয়`,
                          )}
                    </h3>
                  </div>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Target className="size-4" aria-hidden="true" />
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-5">
                  <div className="relative size-20 shrink-0">
                    <svg
                      viewBox="0 0 64 64"
                      className="size-20 -rotate-90"
                      role="img"
                      aria-label={
                        isStudentAudience
                          ? tr("Daily model test progress", "দৈনিক মডেল টেস্ট অগ্রগতি")
                          : tr("Subject coverage", "বিষয় কভারেজ")
                      }
                    >
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        fill="none"
                        strokeWidth="6"
                        className="stroke-secondary"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        fill="none"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 26}
                        strokeDashoffset={
                          2 * Math.PI * 26 * (1 - (isStudentAudience ? dailyGoalPercent : subjectCoveragePercent) / 100)
                        }
                        className={
                          isStudentAudience
                            ? dailyGoalMet
                              ? "stroke-emerald-500"
                              : "stroke-primary"
                            : subjectCoveragePercent >= 100
                              ? "stroke-emerald-500"
                              : "stroke-primary"
                        }
                      />
                    </svg>
                    <span className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="font-display text-sm font-bold text-foreground">
                        {isStudentAudience
                          ? dailyModelLimit === null
                            ? num(dailyModelUsed)
                            : `${num(Math.min(dailyModelUsed, dailyModelLimit))}/${num(dailyModelLimit)}`
                          : `${num(accessibleSubjects.length)}/${num(allSubjects.length)}`}
                      </span>
                      <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                        {isStudentAudience
                          ? tr("done", "সম্পন্ন")
                          : tr("access", "অ্যাক্সেস")}
                      </span>
                    </span>
                  </div>

                  <div className="min-w-0 text-xs leading-relaxed text-muted-foreground">
                    {isStudentAudience ? (
                      <>
                        <p className="text-sm font-semibold text-foreground">
                          {dailyModelLimit === null
                            ? tr(
                                `${num(dailyModelUsed)} model tests today`,
                                `আজ ${num(dailyModelUsed)}টি মডেল টেস্ট`,
                              )
                            : tr(
                                `${num(dailyModelUsed)} of ${num(dailyModelLimit)} model tests today`,
                                `আজ ${num(dailyModelLimit)}টির মধ্যে ${num(dailyModelUsed)}টি মডেল টেস্ট`,
                              )}
                        </p>
                        <p className="mt-1">
                          {dailyModelLimit === null
                            ? tr("Unlimited on your plan", "আপনার প্ল্যানে আনলিমিটেড")
                            : `${tr("Remaining:", "বাকি:")} ${num(dailyModelRemaining ?? 0)}`}
                        </p>
                        {entitlement.limits.totalModelTest !== null && (
                          <p className="mt-1">
                            {tr("Lifetime:", "সর্বমোট:")}{" "}
                            {num(entitlement.usage.modelTestTotal)} /{" "}
                            {num(entitlement.limits.totalModelTest)}
                          </p>
                        )}
                        <p className="mt-1 text-[11px] text-muted-foreground/80">
                          {tr("Counters reset at midnight", "গণনা মধ্যরাতে রিসেট হয়")}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-foreground">
                          {num(totalAccessibleMcq)} {tr("MCQs available", "টি MCQ উপলব্ধ")}
                        </p>
                        <p className="mt-1">
                          {tr(
                            "These subjects are included in your current plan.",
                            "এই বিষয়গুলো আপনার বর্তমান প্ল্যানে অন্তর্ভুক্ত।",
                          )}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground/80">
                          {tr("Manage them from the dashboard.", "ড্যাশবোর্ড থেকেই ব্যবস্থাপনা করুন।")}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardContent className="flex h-full flex-col justify-between p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {tr("Current plan", "বর্তমান প্ল্যান")}
                    </span>
                    <h3 className="mt-1 font-display text-lg font-bold text-foreground">
                      {planName}
                    </h3>
                    <div className={`mt-1 flex items-center gap-1.5 text-xs font-medium ${accessStatus.className}`}>
                      {accessStatus.icon === "alert" ? (
                        <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                      ) : accessStatus.icon === "clock" ? (
                        <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                      )}
                      <span>{accessStatus.label}</span>
                    </div>
                  </div>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="size-4" aria-hidden="true" />
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-border/70 bg-background/60 p-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {tr("Remaining", "বাকি")}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {remainingDaysText}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {tr("Expiry", "মেয়াদ")}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {expiryDateFormatted || tr("No paid term", "পেইড মেয়াদ নেই")}
                    </p>
                  </div>
                </div>

                {!isPaid && (
                  <Button asChild size="sm" className="mt-4 w-full">
                    <Link href="/plans">
                      {entitlement.status === "expired"
                        ? tr("Renew plan", "প্ল্যান রিনিউ")
                        : tr("Upgrade plan", "প্ল্যান আপগ্রেড")}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {(!isPaid || entitlement.status === "cancelled") && (
            <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
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

          {databaseSelectionLimit > 0 && (
            <div id="choose-database">
              <DatabasePicker
                databases={selectableDatabases.map((database) => ({
                  slug: database.slug,
                  name: database.name,
                  name_bn: database.name_bn,
                  description: database.description,
                }))}
                selected={selectedDatabase}
              />
            </div>
          )}

          {subjectSelectionLimit > 0 && (
            <div id="choose-subject">
              <FreeSubjectPicker
                subjects={subjectOptions}
                selected={selectedSubject}
                limit={subjectSelectionLimit}
              />
            </div>
          )}

          <Card className="mt-4 border-border/70 bg-card/60 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {tr("Subjects you can access", "অ্যাক্সেস পাওয়া বিষয়সমূহ")}
                </span>
                <Link
                  href="/subjects"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {tr("Browse all subjects", "সব বিষয় দেখুন")}
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>
              {accessibleSubjects.length === 0 ? (
                <p className="mt-4 rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                  {needsSubjectChoice
                    ? tr(
                        "Choose your free subject above to get started.",
                        "শুরু করতে উপরে আপনার ফ্রি বিষয় বেছে নিন।",
                      )
                    : tr(
                        "No subject access found in your current plan.",
                        "আপনার বর্তমান প্ল্যানে কোনো বিষয়ের অ্যাক্সেস নেই।",
                      )}
                </p>
              ) : (
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {accessibleSubjects.map((sub) => (
                    <Link
                      key={sub.slug}
                      href={`/questions?subject=${sub.slug}`}
                      className="group flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/60 p-3 transition-colors hover:border-primary/50 hover:bg-primary/5"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Layers className="size-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">
                            {subjectName(sub.slug, sub.name)}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">
                            {num(sub.mcq ?? 0)} {tr("MCQs", "টি MCQ")}
                          </span>
                        </span>
                      </span>
                      <ArrowRight
                        className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                        aria-hidden="true"
                      />
                    </Link>
                  ))}
                </div>
              )}
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

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              <Link
                href="/questions"
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl sm:size-12 bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <BookOpen className="size-5 sm:size-6" aria-hidden="true" />
                    </span>
                    <Badge variant="outline" className="border-primary/30 text-[10px] font-normal sm:text-[11px] text-primary">
                      {tr("Practice", "অনুশীলন")}
                    </Badge>
                  </div>
                  <h3 className="mt-3 font-display text-sm font-semibold sm:mt-4 sm:text-base text-foreground group-hover:text-primary">
                    {tr("Practise questions", "প্রশ্ন অনুশীলন")}
                  </h3>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed sm:text-xs">
                    {tr(
                      "Pick subjects and chapters, then practise curated questions with explanations.",
                      "বিষয় ও অধ্যায় নির্বাচন করে সাজানো প্রশ্ন ও ব্যাখ্যাসহ সমাধান অনুশীলন করুন।",
                    )}
                  </p>
                </div>
                <div className="mt-4 flex items-center text-[11px] font-semibold sm:mt-5 sm:text-xs text-primary">
                  <span>{tr("Start practising", "অনুশীলন শুরু করুন")}</span>
                  <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>

              {entitlement.audience === "teacher" ? (
                <Link
                  href="/exam-paper"
                  className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex size-10 items-center justify-center rounded-xl sm:size-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                        <FileText className="size-5 sm:size-6" aria-hidden="true" />
                      </span>
                      <Badge variant="outline" className="border-emerald-500/30 text-[10px] font-normal sm:text-[11px] text-emerald-600 dark:text-emerald-400">
                        {tr("Teacher", "শিক্ষক")}
                      </Badge>
                    </div>
                    <h3 className="mt-3 font-display text-sm font-semibold sm:mt-4 sm:text-base text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      {tr("Exam paper builder", "পরীক্ষাপত্র তৈরি")}
                    </h3>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed sm:text-xs">
                      {tr(
                        "Select questions to build custom 4-set question sheets and downloadable PDFs.",
                        "কাস্টম ৪-সেট প্রশ্নপত্র ও সমাধান প্রিন্টযোগ্য PDF তৈরি করতে প্রশ্ন নির্বাচন করুন।",
                      )}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center text-[11px] font-semibold sm:mt-5 sm:text-xs text-emerald-600 dark:text-emerald-400">
                    <span>{tr("Build exam paper", "পরীক্ষাপত্র বানান")}</span>
                    <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </Link>
              ) : (
                <Link
                  href="/model-test"
                  className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5 transition-all duration-200 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex size-10 items-center justify-center rounded-xl sm:size-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-colors group-hover:bg-amber-500 group-hover:text-white">
                        <Timer className="size-5 sm:size-6" aria-hidden="true" />
                      </span>
                      <Badge variant="outline" className="border-amber-500/30 text-[10px] font-normal sm:text-[11px] text-amber-600 dark:text-amber-400">
                        {tr("Timer", "টাইমার")}
                      </Badge>
                    </div>
                    <h3 className="mt-3 font-display text-sm font-semibold sm:mt-4 sm:text-base text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      {tr("Model test", "মডেল টেস্ট")}
                    </h3>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed sm:text-xs">
                      {tr(
                        "Take timed tests to prepare yourself and learn proper time management.",
                        "নির্দিষ্ট সময়ে পরীক্ষা দিয়ে নিজেকে প্রস্তুত করুন এবং সঠিক টাইম ম্যানেজমেন্ট শিখুন।",
                      )}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center text-[11px] font-semibold sm:mt-5 sm:text-xs text-amber-600 dark:text-amber-400">
                    <span>{tr("Take a test", "পরীক্ষা দিন")}</span>
                    <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </Link>
              )}

              <Link
                href="/saved"
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5 transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl sm:size-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                      <BookmarkCheck className="size-5 sm:size-6" aria-hidden="true" />
                    </span>
                    <Badge variant="outline" className="border-blue-500/30 text-[10px] font-normal sm:text-[11px] text-blue-600 dark:text-blue-400">
                      {tr("Revision", "রিভিশন")}
                    </Badge>
                  </div>
                  <h3 className="mt-3 font-display text-sm font-semibold sm:mt-4 sm:text-base text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {tr("Saved questions", "সেভ করা প্রশ্ন")}
                  </h3>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed sm:text-xs">
                    {tr(
                      "Keep important and difficult questions saved for quick revision.",
                      "রিভিশন দেওয়ার জন্য গুরুত্বপূর্ণ ও কঠিন প্রশ্নগুলো সহজে সংরক্ষণ করে রাখুন।",
                    )}
                  </p>
                </div>
                <div className="mt-4 flex items-center text-[11px] font-semibold sm:mt-5 sm:text-xs text-blue-600 dark:text-blue-400">
                  <span>{tr("View collection", "সংগ্রহ দেখুন")}</span>
                  <ArrowRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </div>
              </Link>

              <Link
                href="/support"
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5 transition-all duration-200 hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl sm:size-12 bg-violet-500/10 text-violet-600 dark:text-violet-400 transition-colors group-hover:bg-violet-500 group-hover:text-white">
                      <LifeBuoy className="size-5 sm:size-6" aria-hidden="true" />
                    </span>
                    <Badge variant="outline" className="border-violet-500/30 text-[10px] font-normal sm:text-[11px] text-violet-600 dark:text-violet-400">
                      {tr("Ticket", "টিকিট")}
                    </Badge>
                  </div>
                  <h3 className="mt-3 font-display text-sm font-semibold sm:mt-4 sm:text-base text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400">
                    {tr("Help & support", "সাহায্য ও সাপোর্ট")}
                  </h3>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed sm:text-xs">
                    {tr(
                      "Report a payment, account or question problem — the admin replies inside the ticket.",
                      "পেমেন্ট, অ্যাকাউন্ট বা প্রশ্নের সমস্যা জানান — এডমিন টিকিটেই উত্তর দেন।",
                    )}
                  </p>
                </div>
                <div className="mt-4 flex items-center text-[11px] font-semibold sm:mt-5 sm:text-xs text-violet-600 dark:text-violet-400">
                  <span>{tr("Open a ticket", "টিকিট খুলুন")}</span>
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
