"use client";

import { useEffect } from "react";
import Link from "next/link";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { useOptionalI18n } from "@/lib/i18n/client";
import { DEFAULT_LANGUAGE } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/translator";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const i18n = useOptionalI18n();
  const { tr } = i18n ?? createTranslator(DEFAULT_LANGUAGE);

  useEffect(() => {
    reportLovableError(error, { boundary: "next_app_error" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {tr("This page didn't load", "পেজটি লোড হয়নি")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {tr(
            "Something went wrong on our end. You can try refreshing or head back home.",
            "আমাদের দিকে কিছু একটা সমস্যা হয়েছে। রিফ্রেশ করে দেখুন অথবা হোমে ফিরে যান।",
          )}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {tr("Try again", "আবার চেষ্টা করুন")}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {tr("Go home", "হোমে ফিরে যান")}
          </Link>
        </div>
      </div>
    </div>
  );
}
