"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, LifeBuoy, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createTicketAction } from "@/lib/tickets/actions";
import {
  TICKET_CATEGORIES,
  TICKET_MESSAGE_MAX,
  TICKET_MESSAGE_MIN,
  type TicketCategory,
  type TicketErrorCode,
} from "@/lib/tickets/types";
import { useI18n } from "@/lib/i18n/client";

const CATEGORY_ORDER = Object.keys(TICKET_CATEGORIES) as TicketCategory[];

export function SupportTicketForm() {
  const { tr, lang, num } = useI18n();
  const [category, setCategory] = useState<TicketCategory | "">("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<TicketErrorCode | null>(null);
  const [sentCode, setSentCode] = useState<string | null>(null);

  const label = (value: TicketCategory) =>
    lang === "bn" ? TICKET_CATEGORIES[value].bn : TICKET_CATEGORIES[value].en;

  const errorText = (code: TicketErrorCode) => {
    switch (code) {
      case "auth":
        return tr("Please log in again before sending.", "পাঠানোর আগে আবার লগইন করুন।");
      case "invalid_category":
        return tr("Select a category first.", "প্রথমে একটি বিভাগ বেছে নিন।");
      case "message_too_short":
        return tr(
          `Write at least ${TICKET_MESSAGE_MIN} characters so the admin can help.`,
          `এডমিন যাতে সাহায্য করতে পারেন, অন্তত ${num(TICKET_MESSAGE_MIN)} অক্ষর লিখুন।`,
        );
      case "message_too_long":
        return tr(
          `Keep it under ${TICKET_MESSAGE_MAX} characters.`,
          `${num(TICKET_MESSAGE_MAX)} অক্ষরের কম রাখুন।`,
        );
      case "rate_limited":
        return tr(
          "You have sent several tickets already. Please wait a while, the admin replies soon.",
          "আপনি ইতোমধ্যে কয়েকটি টিকিট পাঠিয়েছেন। একটু পর আবার চেষ্টা করুন, এডমিন শীঘ্রই উত্তর দেবেন।",
        );
      default:
        return tr("Could not send your ticket. Try again.", "টিকিট পাঠানো যায়নি। আবার চেষ্টা করুন।");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!category || submitting) {
      if (!category) setError("invalid_category");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSentCode(null);

    const result = await createTicketAction({ category, message });
    setSubmitting(false);

    if (result.ok) {
      setSentCode(result.ticketCode);
      setMessage("");
      setCategory("");
      return;
    }

    setError(result.error);
  };

  return (
    <Card className="border-border/80 bg-card/80 shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LifeBuoy className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-foreground">
              {tr("Open a support ticket", "সাপোর্ট টিকিট খুলুন")}
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {tr(
                "Pick the category and describe the problem. The admin is notified instantly and replies here.",
                "বিভাগ বেছে সমস্যাটি লিখুন। এডমিন সাথে সাথে খবর পান এবং এখানেই উত্তর দেন।",
              )}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="ticket-category"
              className="text-xs font-semibold text-foreground"
            >
              {tr("Category", "বিভাগ")}
            </label>
            <select
              id="ticket-category"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as TicketCategory | "");
                setError(null);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
            >
              <option value="">
                {tr("Select a category…", "বিভাগ বেছে নিন…")}
              </option>
              {CATEGORY_ORDER.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ticket-message" className="text-xs font-semibold text-foreground">
              {tr("Describe the problem", "সমস্যার বিস্তারিত")}
            </label>
            <Textarea
              id="ticket-message"
              rows={6}
              maxLength={TICKET_MESSAGE_MAX}
              placeholder={tr(
                "What happened, when, and any order or question ID that helps us find it…",
                "কী হয়েছে, কখন হয়েছে, এবং অর্ডার বা প্রশ্নের আইডি দিলে দ্রুত খুঁজে পাওয়া যাবে…",
              )}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setError(null);
              }}
              className="resize-none text-sm"
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                {tr(
                  `Minimum ${TICKET_MESSAGE_MIN} characters.`,
                  `অন্তত ${num(TICKET_MESSAGE_MIN)} অক্ষর লিখুন।`,
                )}
              </span>
              <span className="font-mono">
                {num(message.length)}/{num(TICKET_MESSAGE_MAX)}
              </span>
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorText(error)}</span>
            </p>
          ) : null}

          {sentCode ? (
            <p className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                {tr(
                  `Ticket sent. Your reference number is ${sentCode}.`,
                  `টিকিট পাঠানো হয়েছে। আপনার রেফারেন্স নম্বর ${sentCode}.`,
                )}{" "}
                {tr("The admin already got it.", "এডমিন এটি এখনই পেয়েছেন।")}
              </span>
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={submitting || !category || message.trim().length < TICKET_MESSAGE_MIN}
            className="w-full gap-2 sm:w-auto"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
            {submitting
              ? tr("Sending…", "পাঠানো হচ্ছে…")
              : tr("Send to admin", "এডমিনকে পাঠান")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
