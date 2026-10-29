import type { Metadata } from "next";
import Link from "next/link";
import { Lock, LogIn } from "lucide-react";

import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { getEntitlement } from "@/lib/access";
import { getI18n } from "@/lib/i18n/server";
import { SavedQuestionsView } from "@/components/saved/SavedQuestionsView";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  return {
    title: tr("Saved Questions — QuestionBank", "সেভ করা প্রশ্ন — QuestionBank"),
    description: tr(
      "Your bookmarked questions and exam revision list.",
      "আপনার বুকমার্ক করা প্রশ্নাবলি ও পরীক্ষার রিভিশন তালিকা।",
    ),
  };
}

export default async function SavedQuestionsPage() {
  const user = await getCurrentUser();
  const { tr } = await getI18n();
  const entitlement = user ? await getEntitlement(user.id) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar initialUser={user} />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
          {!user ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-12">
              <Card className="w-full max-w-md border-border/80 bg-card/80 p-8 text-center sm:p-10 shadow-lg backdrop-blur">
                <CardContent className="flex flex-col items-center p-0">
                  <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                    <Lock className="size-8" aria-hidden="true" />
                  </span>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                    {tr("Log in to view saved questions", "সেভ করা প্রশ্ন দেখতে লগইন করুন")}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {tr(
                      "Log in to bookmark important questions and access your revision list.",
                      "গুরুত্বপূর্ণ প্রশ্ন বুকমার্ক করে রাখতে এবং আপনার রিভিশন তালিকা অ্যাক্সেস করতে অনুগ্রহ করে লগইন করুন।",
                    )}
                  </p>
                  <Button asChild className="mt-6 w-full gap-2 shadow-md">
                    <Link href="/login">
                      <LogIn className="size-4" aria-hidden="true" />
                      <span>{tr("Log in", "লগইন করুন")}</span>
                    </Link>
                  </Button>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {tr("Don't have an account?", "অ্যাকাউন্ট নেই?")}{" "}
                    <Link
                      href="/register"
                      className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                    >
                      {tr("Register", "রেজিস্ট্রেশন করুন")}
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <SavedQuestionsView
              canRevealAnswer={entitlement?.features.allowAnswer ?? false}
              canViewExplanation={entitlement?.features.allowExplanation ?? false}
              savedLimit={entitlement?.limits.savedQuestions ?? 0}
            />
          )}
        </section>
      </main>
      {!user && <Footer />}
    </div>
  );
}
