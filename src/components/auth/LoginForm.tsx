"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { BookOpenCheck, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { signInAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/state";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(
    signInAction,
    INITIAL_AUTH_STATE,
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 flex items-center justify-center gap-2"
            aria-label="Question Bank home"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpenCheck className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              Question<span className="text-primary">Bank</span>
            </span>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl">Welcome back</CardTitle>
              <CardDescription>Log in to continue where you left off.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" action={formAction}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
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
                  <Label htmlFor="password">Password</Label>
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
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isPending} aria-busy={isPending}>
                  Log in
                </Button>
              </form>

              {state.message && (
                <p
                  role="status"
                  className={`mt-4 rounded-lg px-3 py-2 text-center text-xs ${
                    state.status === "error"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {state.message}
                </p>
              )}

              <p className="mt-6 text-center text-sm text-muted-foreground">
                New here?{" "}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                  Create an account
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
