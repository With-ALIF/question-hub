"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpenCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { signUpAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/state";
import { useI18n } from "@/lib/i18n/client";

const inputClass =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring";

export function RegisterForm() {
  const router = useRouter();
  const { tr } = useI18n();
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(
    signUpAction,
    INITIAL_AUTH_STATE,
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/");
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary/60 hover:text-foreground cursor-pointer shadow-2xs"
              title={tr("Go back to the previous page", "আগের পেজে ফিরে যান")}
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              <span>{tr("Go back", "ফিরে যান")}</span>
            </button>

            <div className="flex items-center gap-2.5">
              <Link
                href="/"
                className="text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                {tr("Home page", "হোম পেজ")}
              </Link>
              <LanguageSwitcher />
            </div>
          </div>

          <Link
            href="/"
            className="mb-8 flex items-center justify-center gap-2"
            aria-label={tr("QuestionBank home", "QuestionBank হোম")}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpenCheck className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              Question<span className="text-primary">Bank</span>
            </span>
          </Link>

          <Card className="border-border/80 bg-card shadow-sm">
            <CardHeader className="space-y-1.5 pb-4">
              <CardTitle className="font-display text-2xl font-bold tracking-tight text-foreground">
                {tr("Create your account", "আপনার অ্যাকাউন্ট তৈরি করুন")}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                {tr(
                  "Free to start — practice the first 100 questions today.",
                  "বিনামূল্যে শুরু করুন — আজই প্রথম ১০০টি প্রশ্ন অনুশীলন করুন।",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email + Password Form */}
              <form className="space-y-4" action={formAction}>
                <div className="space-y-2">
                  <Label htmlFor="name">{tr("Full name", "পূর্ণ নাম")}</Label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder={tr("Rafi Ahmed", "রাফি আহমেদ")}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{tr("Email", "ইমেইল")}</Label>
                  <input id="email" name="email" type="email" required placeholder="you@example.com" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{tr("Password", "পাসওয়ার্ড")}</Label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder={tr("Minimum 8 characters", "কমপক্ষে ৮ অক্ষর")}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{tr("Confirm password", "পাসওয়ার্ড নিশ্চিত করুন")}</Label>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder={tr("Repeat your password", "আবার পাসওয়ার্ড লিখুন")}
                    className={inputClass}
                  />
                </div>

                <Button type="submit" className="w-full font-medium cursor-pointer" disabled={isPending} aria-busy={isPending}>
                  {isPending ? tr("Creating account...", "অ্যাকাউন্ট তৈরি হচ্ছে...") : tr("Register", "রেজিস্টার করুন")}
                </Button>
              </form>

              {/* Or Divider */}
              <div className="relative my-3 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/80" />
                </div>
                <div className="relative bg-card px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {tr("Or continue with", "অথবা")}
                </div>
              </div>

              {/* Sign up with Google */}
              <GoogleSignInButton
                label={tr("Sign up with Google", "Google দিয়ে সাইন আপ করুন")}
                onError={(err) => setGoogleError(err)}
              />

              {(state.message || googleError) && (
                <p
                  role="status"
                  className={`rounded-lg px-3 py-2 text-center text-xs ${
                    state.status === "error" || googleError
                      ? "bg-destructive/10 text-destructive"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {googleError || state.message}
                </p>
              )}

              <p className="pt-2 text-center text-sm text-muted-foreground">
                {tr("Already have an account?", "আগে থেকেই অ্যাকাউন্ট আছে?")}{" "}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                  {tr("Log in", "লগইন করুন")}
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
