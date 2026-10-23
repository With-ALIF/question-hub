"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminSignInAction } from "@/lib/auth/actions";
import type { AuthState } from "@/lib/auth/state";

const INITIAL_STATE: AuthState = { status: "idle", message: "" };

export function AdminLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(
    adminSignInAction,
    INITIAL_STATE,
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Admin sign in
          </h1>
          <p className="text-sm text-muted-foreground">
            Restricted to accounts with the <code className="font-mono text-xs">admin</code> or{" "}
            <code className="font-mono text-xs">super_admin</code> role.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Welcome back</CardTitle>
            <CardDescription>Sign in to reach the admin dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isPending} aria-busy={isPending}>
                {isPending ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            {state.message ? (
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
            ) : null}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Need an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Student sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
