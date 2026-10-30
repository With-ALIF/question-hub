"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, GraduationCap, Loader2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/client";
import { chooseAudienceAction } from "@/lib/access/audience-actions";
import type { AudienceChoiceState } from "@/lib/access/types";

const ADMIN_CONTACT_EMAIL = "qbank273@gmail.com";

const INITIAL_STATE: AudienceChoiceState = { ok: false };

const OPTIONS = [
  {
    value: "student" as const,
    icon: GraduationCap,
    titleEn: "I am a Student",
    titleBn: "আমি শিক্ষার্থী",
    detailEn: "Question practice, model tests and saved questions.",
    detailBn: "প্রশ্ন অনুশীলন, মডেল টেস্ট ও সেভ করা প্রশ্নের সুবিধা।",
  },
  {
    value: "teacher" as const,
    icon: Users,
    titleEn: "I am a Teacher",
    titleBn: "আমি শিক্ষক",
    detailEn: "Exam paper builder with print/PDF export and the full question bank.",
    detailBn: "পরীক্ষাপত্র বিল্ডার, প্রিন্ট/PDF এক্সপোর্ট ও সম্পূর্ণ প্রশ্ন ব্যাংক।",
  },
];

/**
 * First-login gate: an account must declare student or teacher before using the
 * dashboard. The choice picks the matching free plan and is irreversible, so
 * the dialog cannot be dismissed.
 */
export function AudienceGate() {
  const { tr } = useI18n();
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (previousState: AudienceChoiceState, formData: FormData) => {
      const nextState = await chooseAudienceAction(previousState, formData);

      if (nextState.ok || nextState.error === "locked") {
        router.refresh();
      }

      return nextState;
    },
    INITIAL_STATE,
  );

  const errorText =
    state.error === "auth"
      ? tr("Please log in again.", "আবার লগইন করুন।")
      : state.error === "locked"
        ? tr(
            "Your role is already selected. Ask the admin to change it.",
            "আপনার ভূমিকা আগেই নির্বাচিত হয়েছে। পরিবর্তন করতে অ্যাডমিনের সাথে যোগাযোগ করুন।",
          )
        : state.error === "invalid_selection"
          ? tr("Choose either student or teacher.", "শিক্ষার্থী বা শিক্ষক যেকোনো একটি বেছে নিন।")
          : state.error === "failed"
            ? tr("Could not save your choice. Try again.", "নির্বাচন সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।")
            : null;

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent className="max-w-lg [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {tr("First, choose your role", "শুরুতে আপনার ভূমিকা বেছে নিন")}
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            {tr(
              "This decides which free plan your account gets.",
              "এটি নির্ধারণ করে আপনার অ্যাকাউন্টে কোন ফ্রি প্ল্যান চালু হবে।",
            )}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-3 sm:grid-cols-2">
          {OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="submit"
              name="audience"
              value={option.value}
              variant="outline"
              disabled={isPending}
              className="h-auto w-full flex-col items-start justify-start gap-2 whitespace-normal rounded-xl border-border/70 bg-card/60 p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <option.icon className="size-4" aria-hidden="true" />
              </span>
              <span className="font-display text-sm font-bold text-foreground">
                {tr(option.titleEn, option.titleBn)}
              </span>
              <span className="text-[11px] font-normal leading-relaxed text-muted-foreground whitespace-normal">
                {tr(option.detailEn, option.detailBn)}
              </span>
            </Button>
          ))}
        </form>

        <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            {tr(
              `Warning: once selected, your role cannot be changed by yourself. To change it, contact the admin at ${ADMIN_CONTACT_EMAIL}.`,
              `সতর্কতা: একবার নির্বাচন করলে নিজের পক্ষ থেকে তা আর পরিবর্তন করা যাবে না। পরিবর্তন করতে অ্যাডমিনের সাথে যোগাযোগ করুন: ${ADMIN_CONTACT_EMAIL}`,
            )}
          </span>
        </p>

        <div aria-live="polite" className="min-h-4 text-xs">
          {isPending ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              {tr("Saving your choice…", "নির্বাচন সংরক্ষণ হচ্ছে…")}
            </span>
          ) : (
            errorText && <p className="text-destructive">{errorText}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
