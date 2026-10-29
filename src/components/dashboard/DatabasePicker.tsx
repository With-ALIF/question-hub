"use client";

import { useActionState } from "react";
import { CheckCircle2, Database, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { chooseDatabaseAction } from "@/lib/access/database-actions";
import type { DatabaseChoiceState } from "@/lib/access/types";
import { useI18n } from "@/lib/i18n/client";

type DatabaseOption = {
  slug: string;
  name: string;
  name_bn: string | null;
  description: string | null;
};

const INITIAL_STATE: DatabaseChoiceState = { ok: false };

export function DatabasePicker({
  databases,
  selected,
}: {
  databases: DatabaseOption[];
  selected: string | null;
}) {
  const { tr, lang } = useI18n();
  const [state, formAction, isPending] = useActionState(
    chooseDatabaseAction,
    INITIAL_STATE,
  );

  const defaultValue = selected ?? databases[0]?.slug ?? "";
  const labelFor = (database: DatabaseOption) =>
    lang === "bn" && database.name_bn ? database.name_bn : database.name;
  const selectedName = databases.find((database) => database.slug === selected);

  const errorText =
    state.error === "auth"
      ? tr("Please log in again.", "আবার লগইন করুন।")
      : state.error === "forbidden"
        ? tr(
            "Your current plan does not allow choosing a database.",
            "আপনার বর্তমান প্ল্যানে ডেটাবেস বেছে নেওয়ার সুযোগ নেই।",
          )
        : state.error === "invalid_selection"
          ? tr("That database is not available.", "এই ডেটাবেসটি পাওয়া যাচ্ছে না।")
          : state.error === "failed"
            ? tr("Could not save your database. Try again.", "ডেটাবেস সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।")
            : null;

  return (
    <Card className="mt-4 border-primary/30 bg-primary/5 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                {tr("Choose your database", "আপনার ডেটাবেস বেছে নিন")}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {tr(
                  "Your plan includes one database. All subjects and chapters inside it will be available.",
                  "আপনার প্ল্যানে একটি ডেটাবেস অন্তর্ভুক্ত। এর ভেতরের সব বিষয় ও অধ্যায় পাওয়া যাবে।",
                )}
              </p>
            </div>
          </div>

          {selectedName && (
            <Badge
              variant="outline"
              className="self-start border-primary/30 bg-primary/10 text-[11px] font-medium text-primary"
            >
              {tr("Selected", "নির্বাচিত")}: {labelFor(selectedName)}
            </Badge>
          )}
        </div>

        <form action={formAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <select
            name="database"
            defaultValue={defaultValue}
            disabled={isPending || databases.length === 0}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            {databases.map((database) => (
              <option key={database.slug} value={database.slug}>
                {labelFor(database)}
              </option>
            ))}
          </select>
          <Button
            type="submit"
            size="sm"
            className="h-9 shrink-0 gap-1.5"
            disabled={isPending || databases.length === 0}
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
            )}
            {tr("Save database", "ডেটাবেস সংরক্ষণ করুন")}
          </Button>
        </form>

        <div aria-live="polite" className="mt-2 min-h-4 text-xs">
          {state.ok && state.value && (
            <p className="text-emerald-600 dark:text-emerald-400">
              {tr("Database updated.", "ডেটাবেস আপডেট হয়েছে।")}
            </p>
          )}
          {errorText && <p className="text-destructive">{errorText}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
