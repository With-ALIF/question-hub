import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, FileText, Lock, Sparkles, Timer, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { getCurrentUser } from "@/lib/auth/session";
import { getEntitlement } from "@/lib/access";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  return {
    title: tr("Model Test — QuestionBank", "মডেল টেস্ট — QuestionBank"),
    description: tr(
      "Test your preparation with timed model tests. Coming soon.",
      "সময় ধরে মডেল টেস্ট দিয়ে নিজের প্রস্তুতি যাচাই করার প্ল্যাটফর্ম। খুব শীঘ্রই আসছে।",
    ),
  };
}

export default async function ModelTestPage() {
  const user = await getCurrentUser();
  const { tr } = await getI18n();
  const entitlement = user ? await getEntitlement(user.id) : null;
  const isTeacher = entitlement?.audience === "teacher";

  if (isTeacher) {
    return (
      <div className="flex min-h-screen flex-col bg-background font-sans">
        <Navbar initialUser={user} audience="teacher" />
        <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-xl text-center">
            <Card className="relative overflow-hidden border-border/80 bg-card/80 p-8 sm:p-12 shadow-lg backdrop-blur">
              <CardContent className="p-0 flex flex-col items-center">
                <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Lock className="size-8" aria-hidden="true" />
                </span>
                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {tr("Students only feature", "শুধুমাত্র শিক্ষার্থীদের জন্য")}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base max-w-md">
                  {tr(
                    "Model Test is designed for students preparing for exams. Teacher plans do not include student model tests. If you want to create exam papers, please use the Exam Paper Builder.",
                    "মডেল টেস্ট ফিচারটি শুধুমাত্র পরীক্ষার্থী শিক্ষার্থীদের অনুশীলনের জন্য। টিচার প্ল্যানে মডেল টেস্টের সুবিধা অন্তর্ভুক্ত নয়। প্রশ্নপত্র তৈরি করতে 'পরীক্ষাপত্র' (Exam Paper Builder) ব্যবহার করুন।",
                  )}
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild className="gap-2">
                    <Link href="/exam-paper">
                      <FileText className="size-4" aria-hidden="true" />
                      {tr("Go to Exam Paper", "পরীক্ষাপত্রে যান")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/dashboard">
                      <ArrowLeft className="size-4" aria-hidden="true" />
                      {tr("Dashboard", "ড্যাশবোর্ড")}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer initialUser={user} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar initialUser={user} audience={entitlement?.audience} />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <Card className="relative overflow-hidden border-border/80 bg-card/80 p-8 sm:p-12 shadow-lg backdrop-blur">
            <div className="absolute -top-12 -right-12 size-36 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 size-36 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

            <CardContent className="p-0 flex flex-col items-center">
              <div className="relative mb-6">
                <span className="flex size-20 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-inner">
                  <Timer className="size-10" aria-hidden="true" />
                </span>
                <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                </span>
              </div>

              <Badge variant="outline" className="mb-3 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 text-xs font-semibold">
                {tr("Coming Soon", "শীঘ্রই আসছে")}
              </Badge>

              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {tr("Model Test", "মডেল টেস্ট")}
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {tr(
                  "This feature is coming very soon! You'll be able to sit real-exam-style model tests with time limits, negative marking and live result analysis.",
                  "এই ফিচারটি খুব শীঘ্রই আসবে! এখানে আপনি নির্দিষ্ট সময়সীমা, নেগেটিভ মার্কিং এবং লাইভ রেজাল্ট অ্যানালাইসিস সহ রিয়েল পরীক্ষার মতো মডেল টেস্ট দিতে পারবেন।",
                )}
              </p>

              <div className="mt-6 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3 text-left">
                <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Clock className="size-3.5 text-amber-500" aria-hidden="true" />
                    <span>{tr("Timed test", "টাইমার টেস্ট")}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {tr("Practise under a real countdown.", "সময় মেপে পরীক্ষা দেওয়ার সুবিধা")}
                  </p>
                </div>

                <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Trophy className="size-3.5 text-emerald-500" aria-hidden="true" />
                    <span>{tr("Negative marking", "নেগেটিভ মার্কিং")}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {tr("Accurate scoring for wrong answers.", "ভুল উত্তরের জন্য সঠিক মূল্যায়ন")}
                  </p>
                </div>

                <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <BookOpen className="size-3.5 text-blue-500" aria-hidden="true" />
                    <span>{tr("Subject-wise", "বিষয়ভিত্তিক")}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {tr("Chapter or full-subject tests.", "অধ্যায় বা পুরো বিষয়ের টেস্ট")}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 w-full">
                <Button asChild className="gap-2">
                  <Link href="/dashboard">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    {tr("Back to dashboard", "ড্যাশবোর্ডে ফিরে যান")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer initialUser={user} />
    </div>
  );
}
