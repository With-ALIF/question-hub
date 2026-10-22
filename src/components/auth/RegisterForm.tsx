"use client";

import { useActionState } from "react";
import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { signUpAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_STATE } from "@/lib/auth/state";

const inputClass =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    signUpAction,
    INITIAL_AUTH_STATE,
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center justify-center gap-2" aria-label="Question Bank home">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpenCheck className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              Question<span className="text-primary">Bank</span>
            </span>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl">Create your account</CardTitle>
              <CardDescription>Free to start — practice the first 100 questions today.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" action={formAction}>
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <input id="name" name="name" type="text" required placeholder="Rafi Ahmed" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <input id="email" name="email" type="email" required placeholder="you@example.com" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <input id="password" name="password" type="password" required placeholder="Minimum 8 characters" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <input id="confirm-password" name="confirmPassword" type="password" required placeholder="Repeat your password" className={inputClass} />
                </div>

                <Button type="submit" className="w-full" disabled={isPending} aria-busy={isPending}>
                  Register
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
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                  Log in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
