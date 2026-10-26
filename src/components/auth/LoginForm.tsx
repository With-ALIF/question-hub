"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpenCheck, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { signInAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/state";
import { useI18n } from "@/lib/i18n/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tr } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState(
    signInAction,
    INITIAL_AUTH_STATE,
  );

  const urlError = searchParams.get("error");
  const callbackError =
    urlError === "auth_callback_failed"
      ? tr(
          "Could not sign in with Google. Please try again.",
          "Google দিয়ে লগইন সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।"
        )
      : null;

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
            <LanguageSwitcher />
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
                {tr("Welcome back!", "আবারও স্বাগতম!")}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                {tr(
                  "Log in to pick up your preparation right where you left off.",
                  "যেখান থেকে শেষ করেছিলেন সেখান থেকেই আবার প্রস্তুতি শুরু করতে অ্যাকাউন্টে লগইন করুন।",
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email + Password Form */}
              <form className="space-y-4" action={formAction}>
                <div className="space-y-2">
                  <Label htmlFor="email">{tr("Email", "ইমেইল")}</Label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{tr("Password", "পাসওয়ার্ড")}</Label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? tr("Hide password", "পাসওয়ার্ড লুকান") : tr("Show password", "পাসওয়ার্ড দেখান")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full font-medium cursor-pointer" disabled={isPending} aria-busy={isPending}>
                  {isPending ? tr("Signing in...", "লগইন হচ্ছে...") : tr("Log in", "লগইন করুন")}
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

              {/* Continue with Google */}
              <GoogleSignInButton
                onError={(err) => setGoogleError(err)}
              />

              {(state.message || googleError || callbackError) && (
                <p
                  role="status"
                  className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-xs text-destructive"
                >
                  {googleError || callbackError || state.message}
                </p>
              )}

              <p className="pt-2 text-center text-sm text-muted-foreground">
                {tr("New student?", "নতুন শিক্ষার্থী?")}{" "}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                  {tr("Create an account", "অ্যাকাউন্ট তৈরি করুন")}
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
