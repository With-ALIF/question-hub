"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

function GoogleIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

interface GoogleSignInButtonProps {
  label?: string;
  nextUrl?: string;
  className?: string;
  onError?: (error: string) => void;
}

export function GoogleSignInButton({
  label,
  nextUrl = "/dashboard",
  className,
  onError,
}: GoogleSignInButtonProps) {
  const { tr } = useI18n();
  const [loading, setLoading] = useState(false);

  const defaultLabel = tr("Continue with Google", "Google দিয়ে চালিয়ে যান");
  const loadingLabel = tr("Connecting to Google...", "Google-এ যুক্ত হচ্ছে...");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const isLocal =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1");

      const redirectTo = isLocal
        ? `${window.location.origin}/auth/callback`
        : "https://question-hub-bd.vercel.app/auth/callback";

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        setLoading(false);
        onError?.(error.message);
      }
    } catch (err: unknown) {
      setLoading(false);
      const msg =
        err instanceof Error
          ? err.message
          : tr(
              "Failed to initialize Google login. Please try again.",
              "Google লগইন শুরু করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।"
            );
      onError?.(msg);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      aria-busy={loading}
      className={cn(
        "flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border/80 bg-background px-4 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-secondary/70 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shadow-2xs",
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="size-4.5 animate-spin text-muted-foreground" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          <GoogleIcon className="size-5 shrink-0" />
          <span>{label || defaultLabel}</span>
        </>
      )}
    </button>
  );
}
