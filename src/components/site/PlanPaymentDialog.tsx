"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Clock, Copy, Loader2, ShieldCheck, BadgeCheck } from "lucide-react";

import type { Plan } from "@/data/plans";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/client";
import { createManualOrderAction } from "@/lib/payments/actions";
import {
  BD_PHONE_PATTERN,
  PAYMENT_METHODS,
  PAYMENT_METHOD_IDS,
  TRX_PATTERN,
  type PaymentNumbers,
} from "@/lib/payments/config";
import type { Order, PaymentErrorCode, Subscription } from "@/lib/payments/types";
import type { PaymentMethod } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type PlanPaymentDialogProps = {
  plan: Plan;
  /** CTA text shown on the trigger button. */
  label: string;
  highlighted?: boolean | undefined;
  paymentNumbers: PaymentNumbers;
  pendingOrder?: Order | null | undefined;
  activeSubscription?: Subscription | null | undefined;
};

function formatExpiryDate(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return iso;
  }
}

export function PlanPaymentDialog({
  plan,
  label,
  highlighted,
  paymentNumbers,
  pendingOrder,
  activeSubscription,
}: PlanPaymentDialogProps) {
  const router = useRouter();
  const { tr, num, lang } = useI18n();
  const trxInputId = useId();
  const senderInputId = useId();

  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("bkash");
  const [trxId, setTrxId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activeMethod = PAYMENT_METHODS[method];

  const errorText = (code: PaymentErrorCode) => {
    switch (code) {
      case "auth":
        return tr(
          "Please log in to your account before paying.",
          "পেমেন্ট করার আগে আপনার অ্যাকাউন্টে লগইন করুন।",
        );
      case "pending_order_exists":
        return tr(
          "You already have a pending order. You cannot order another plan until it is verified or rejected.",
          "আপনি ইতোমধ্যে একটি অর্ডার করেছেন যা পেন্ডিং আছে। সেটি যাচাই বা বাতিল না হওয়া পর্যন্ত নতুন অর্ডার করা যাবে না।",
        );
      case "active_subscription_exists":
        return tr(
          "You already have an active subscription. You cannot purchase another paid plan until your current plan expires.",
          "আপনার ইতোমধ্যে একটি প্ল্যান কেনা রয়েছে। সেটির মেয়াদ শেষ না হওয়া পর্যন্ত নতুন কোনো পেইড প্ল্যান কেনা যাবে না।",
        );
      case "invalid_input":
        return tr(
          "Enter a valid transaction ID (6–20 letters/numbers).",
          "সঠিক ট্রানজেকশন আইডি দিন (৬–২০ অক্ষর/সংখ্যা)।",
        );
      case "invalid_plan":
        return tr("This plan cannot be purchased.", "এই প্ল্যানটি কেনা যাচ্ছে না।");
      case "duplicate_trx":
        return tr(
          "This transaction ID has already been submitted.",
          "এই ট্রানজেকশন আইডিটি আগেই জমা দেওয়া হয়েছে।",
        );
      case "rate_limited":
        return tr(
          "Too many attempts. Please wait a few minutes and try again.",
          "অনেকবার চেষ্টা করা হয়েছে। কয়েক মিনিট পর আবার চেষ্টা করুন।",
        );
      case "audience_mismatch":
        return tr(
          "Your account is registered as a student, so only student plans can be ordered (or the reverse). Ask the admin to change your role.",
          "আপনার অ্যাকাউন্ট যেভাবে নিবন্ধিত (শিক্ষার্থী বা শিক্ষক), শুধু সেই প্ল্যান অর্ডার করা যাবে। ভূমিকা পরিবর্তনে অ্যাডমিনের সাথে যোগাযোগ করুন।",
        );
      default:
        return tr(
          "Something went wrong. Please try again.",
          "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        );
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && isPending) return;

    if (!next) {
      setError(null);
      setTrxId("");
      setSenderNumber("");
      setOrderCode(null);
      setCopied(false);
      setMethod("bkash");
    }

    setOpen(next);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(paymentNumbers[method]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked by the browser; the number stays visible.
    }
  };

  const handleSubmit = () => {
    setError(null);
    const normalizedTrx = trxId.trim().toUpperCase();
    const normalizedSender = senderNumber.trim();

    if (!TRX_PATTERN.test(normalizedTrx)) {
      setError(errorText("invalid_input"));
      return;
    }

    if (normalizedSender && !BD_PHONE_PATTERN.test(normalizedSender)) {
      setError(
        tr(
          "Enter a valid 11-digit mobile number, or leave it empty.",
          "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন, অথবা ঘরটি খালি রাখুন।",
        ),
      );
      return;
    }

    if (pendingOrder) {
      setError(errorText("pending_order_exists"));
      return;
    }

    if (activeSubscription) {
      setError(errorText("active_subscription_exists"));
      return;
    }

    startTransition(async () => {
      const result = await createManualOrderAction({
        planId: plan.id,
        method,
        trxId: normalizedTrx,
        senderNumber: normalizedSender,
      });

      if (result.ok) {
        setOrderCode(result.orderCode);
        setTrxId("");
        setSenderNumber("");
        router.refresh();
        return;
      }

      setError(errorText(result.error));
    });
  };

  const steps = [
    tr(
      `Dial ${activeMethod.ussd} or open the ${activeMethod.name} app`,
      `${activeMethod.ussd} ডায়াল করে ${activeMethod.name} মোবাইল মেনুতে যান অথবা ${activeMethod.name} অ্যাপ খুলুন`,
    ),
    tr("Tap Send Money", "সেন্ড মানি-তে ক্লিক করুন"),
    tr(
      `Send ৳${num(plan.amountBdt)} to the number below`,
      `নিচের নম্বরে ৳${num(plan.amountBdt)} পাঠান`,
    ),
    tr("Confirm with your PIN", "আপনার PIN দিয়ে নিশ্চিত করুন"),
    tr(
      "Copy the TrxID from the SMS and submit it below",
      "SMS থেকে TrxID কপি করে নিচে জমা দিন",
    ),
  ];

  if (pendingOrder) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant={highlighted ? "default" : "outline"} className="w-full">
            {label}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_1.5rem)] max-w-md gap-0 overflow-y-auto p-0 sm:w-full">
          <DialogHeader className="border-b bg-amber-500/10 p-5 pr-12 text-left">
            <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold text-amber-700 dark:text-amber-400">
              <Clock className="size-5 shrink-0" />
              {tr("Order Pending", "অর্ডার পেন্ডিং আছে")}
            </DialogTitle>
            <DialogDescription className="text-amber-800/80 dark:text-amber-300/80">
              {tr("You have an order waiting for verification", "আপনার একটি অর্ডার অপেক্ষমাণ রয়েছে")}
            </DialogDescription>
          </DialogHeader>

          <div className="p-5">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Clock className="size-7" aria-hidden="true" />
              </span>
              <h3 className="mt-3 font-display text-base font-bold text-foreground">
                {tr(
                  "You already have a pending order",
                  "আপনি একটি অর্ডার করেছেন, পেন্ডিং আছে",
                )}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {tr(
                  "Your previous order is waiting for admin verification. You cannot order another plan until this order is verified (approved) or rejected.",
                  "আপনার পূর্ববর্তী অর্ডারটি অ্যাডমিন যাচাইয়ের জন্য অপেক্ষমাণ রয়েছে। অর্ডারটি যাচাই (ভেরিফাই) অথবা বাতিল (রিজেক্ট) না হওয়া পর্যন্ত অন্য কোনো প্ল্যান অর্ডার করা যাবে না।",
                )}
              </p>

              <div className="mt-4 rounded-xl border border-dashed border-border bg-background px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {tr("Pending Order ID", "পেন্ডিং অর্ডার আইডি")}
                </p>
                <p className="mt-0.5 font-mono text-base font-bold tracking-wider text-amber-600 dark:text-amber-400">
                  {pendingOrder.order_code}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pendingOrder.plan_name} · ৳{num(pendingOrder.amount_bdt)}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link href="/dashboard">
                    {tr("View in dashboard", "ড্যাশবোর্ডে দেখুন")}
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  {tr("Close", "বন্ধ করুন")}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (activeSubscription) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant={highlighted ? "default" : "outline"} className="w-full">
            {label}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_1.5rem)] max-w-md gap-0 overflow-y-auto p-0 sm:w-full">
          <DialogHeader className="border-b bg-emerald-500/10 p-5 pr-12 text-left">
            <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold text-emerald-700 dark:text-emerald-400">
              <BadgeCheck className="size-5 shrink-0" />
              {tr("Active Plan Exists", "প্ল্যান ইতিমধ্যে সক্রিয় আছে")}
            </DialogTitle>
            <DialogDescription className="text-emerald-800/80 dark:text-emerald-300/80">
              {tr("You already have an active subscription", "আপনার একটি সাবস্ক্রিপশন চালু রয়েছে")}
            </DialogDescription>
          </DialogHeader>

          <div className="p-5">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <BadgeCheck className="size-7" aria-hidden="true" />
              </span>
              <h3 className="mt-3 font-display text-base font-bold text-foreground">
                {tr(
                  "You already have an active paid plan",
                  "আপনার ইতোমধ্যে একটি প্ল্যান কেনা রয়েছে",
                )}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {tr(
                  "You cannot purchase another paid plan while your current subscription is active. Please wait until your plan expires.",
                  "আপনার বর্তমানে একটি পেইড সাবস্ক্রিপশন চালু আছে। সেটির মেয়াদ শেষ না হওয়া পর্যন্ত নতুন কোনো পেইড প্ল্যান কেনা যাবে না।",
                )}
              </p>

              <div className="mt-4 rounded-xl border border-dashed border-border bg-background px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {tr("Active Plan", "বর্তমান সক্রিয় প্ল্যান")}
                </p>
                <p className="mt-0.5 font-display text-base font-bold text-foreground">
                  {activeSubscription.plan_name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tr("Expires on: ", "মেয়াদ শেষ হবে: ")}
                  <strong className="text-foreground">
                    {formatExpiryDate(activeSubscription.expires_at)}
                  </strong>
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link href="/dashboard">
                    {tr("Go to dashboard", "ড্যাশবোর্ডে যান")}
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  {tr("Close", "বন্ধ করুন")}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={highlighted ? "default" : "outline"} className="w-full">
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_1.5rem)] max-w-md gap-0 overflow-y-auto p-0 sm:w-full">
        <DialogHeader className="border-b bg-muted/40 p-5 pr-12 text-left">
          <DialogTitle className="font-display text-lg font-bold">
            {orderCode
              ? tr("Order submitted", "অর্ডার জমা হয়েছে")
              : tr("Complete your payment", "পেমেন্ট সম্পন্ন করুন")}
          </DialogTitle>
          <DialogDescription>
            {plan.name[lang]} · {plan.duration[lang]}
          </DialogDescription>
        </DialogHeader>

        {orderCode ? (
          <div className="p-5">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-7" aria-hidden="true" />
              </span>
              <h3 className="mt-3 font-display text-base font-bold text-foreground">
                {tr("We received your payment details", "আপনার পেমেন্ট তথ্য পেয়েছি")}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {tr(
                  "Our admin team will verify the TrxID and activate your plan, usually within 24 hours.",
                  "আমাদের এডমিন টিম TrxID যাচাই করে আপনার প্ল্যান অ্যাক্টিভ করবে, সাধারণত ২৪ ঘণ্টার মধ্যে।",
                )}
              </p>

              <div className="mt-4 rounded-xl border border-dashed border-border bg-background px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {tr("Order ID", "অর্ডার আইডি")}
                </p>
                <p className="mt-0.5 font-mono text-base font-bold tracking-wider text-foreground">
                  {orderCode}
                </p>
              </div>

              <ul className="mt-4 space-y-2 text-left text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  {tr(
                    "Keep this order ID for support.",
                    "সাপোর্টের জন্য এই অর্ডার আইডিটি সংরক্ষণ করুন।",
                  )}
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  {tr(
                    "Do not submit the same TrxID twice.",
                    "একই TrxID দুইবার জমা দেবেন না।",
                  )}
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  {tr(
                    "Check your dashboard for the activation status.",
                    "অ্যাক্টিভেশন স্ট্যাটাস ড্যাশবোর্ডে দেখুন।",
                  )}
                </li>
              </ul>

              <Button asChild className="mt-5 w-full">
                <Link href="/dashboard">
                  {tr("Go to dashboard", "ড্যাশবোর্ডে যান")}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3.5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{plan.name[lang]}</p>
                <p className="text-xs text-muted-foreground">{plan.duration[lang]}</p>
              </div>
              <p className="shrink-0 font-display text-xl font-bold tracking-tight text-foreground">
                ৳{num(plan.amountBdt)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {tr("Payment method", "পেমেন্ট মাধ্যম")}
              </p>
              <div role="radiogroup" className="grid grid-cols-2 gap-2.5">
                {PAYMENT_METHOD_IDS.map((id) => {
                  const config = PAYMENT_METHODS[id];
                  const active = method === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setMethod(id);
                        setError(null);
                        setCopied(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border-2 bg-card px-3 py-2.5 text-left transition-all",
                        active
                          ? "shadow-sm"
                          : "border-border hover:border-muted-foreground/40",
                      )}
                      style={
                        active
                          ? {
                              borderColor: config.accent,
                              boxShadow: `0 0 0 3px ${config.accent}1f`,
                            }
                          : undefined
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={config.logo}
                        alt=""
                        width={56}
                        height={28}
                        loading="lazy"
                        className="h-8 w-14 shrink-0 rounded-md bg-white object-contain p-0.5"
                      />
                      <span className="text-sm font-semibold text-foreground">{config.name}</span>
                      <span
                        className={cn(
                          "ml-auto flex size-4 shrink-0 items-center justify-center rounded-full border",
                          active ? "border-transparent text-white" : "border-border",
                        )}
                        style={active ? { backgroundColor: config.accent } : undefined}
                        aria-hidden="true"
                      >
                        {active && <Check className="size-3" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className="rounded-2xl p-4 text-white shadow-sm sm:p-5"
              style={{ background: activeMethod.panel }}
            >
              <div className="text-center">
                <h3 className="font-bangla text-base font-semibold">
                  {tr("Enter transaction ID", "ট্রানজেকশন আইডি দিন")}
                </h3>
                <p className="mt-0.5 text-[11px] text-white/80">
                  {tr(
                    "Copy it from the confirmation SMS",
                    "কনফার্মেশন SMS থেকে কপি করুন",
                  )}
                </p>
              </div>

              <div className="mt-3 space-y-2.5">
                <div>
                  <label
                    htmlFor={trxInputId}
                    className="mb-1.5 block font-bangla text-xs font-medium text-white/90"
                  >
                    {tr("Transaction ID", "ট্রানজেকশন আইডি")}{" "}
                    <span className="text-yellow-200">*</span>
                  </label>
                  <Input
                    id={trxInputId}
                    value={trxId}
                    onChange={(event) =>
                      setTrxId(event.target.value.toUpperCase().replace(/\s/g, "").slice(0, 20))
                    }
                    placeholder={tr("e.g. 9F7A2B1C4D", "যেমন: 9F7A2B1C4D")}
                    maxLength={20}
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={Boolean(error)}
                    className="h-12 rounded-[10px] border-0 bg-white px-4 text-[15px] font-medium uppercase tracking-wide text-gray-900 shadow-sm placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-white/70"
                  />
                </div>

                <div>
                  <label
                    htmlFor={senderInputId}
                    className="mb-1.5 block font-bangla text-xs font-medium text-white/90"
                  >
                    {tr(
                      `Your ${activeMethod.name} number`,
                      `আপনার ${activeMethod.name} নম্বর`,
                    )}{" "}
                    <span className="text-white/60">({tr("optional", "ঐচ্ছিক")})</span>
                  </label>
                  <Input
                    id={senderInputId}
                    value={senderNumber}
                    onChange={(event) =>
                      setSenderNumber(event.target.value.replace(/\D/g, "").slice(0, 11))
                    }
                    placeholder="01XXXXXXXXX"
                    maxLength={11}
                    inputMode="numeric"
                    autoComplete="off"
                    className="h-12 rounded-[10px] border-0 bg-white px-4 text-[15px] tracking-wide text-gray-900 shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-white/70"
                  />
                </div>
              </div>

              <ol className="mt-4 text-[13px] text-white">
                {steps.map((step, index) => (
                  <li key={step}>
                    <div className="flex gap-2 py-2">
                      <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-white/80" />
                      <p className="font-bangla leading-relaxed">{step}</p>
                    </div>
                    {index < steps.length - 1 && <hr className="border-white/20" />}
                  </li>
                ))}
              </ol>

              <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-black/20 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-white/70">
                    {tr("Send to", "টাকা পাঠান")} · {activeMethod.name}
                  </p>
                  <p className="truncate font-mono text-sm font-semibold tracking-wide text-yellow-200">
                    {paymentNumbers[method]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/20 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  {copied ? (
                    <Check className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="size-3.5" aria-hidden="true" />
                  )}
                  {copied ? tr("Copied", "কপি হয়েছে") : tr("Copy", "কপি")}
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between rounded-xl bg-white/15 px-3 py-2">
                <span className="text-xs text-white/85">
                  {tr("Amount to send", "পাঠাতে হবে")}
                </span>
                <span className="font-display text-lg font-bold text-yellow-200">
                  ৳{num(plan.amountBdt)}
                </span>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive"
              >
                {error}
              </p>
            )}

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="h-12 w-full gap-2 rounded-xl text-sm font-semibold"
            >
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isPending
                ? tr("Submitting…", "জমা হচ্ছে…")
                : tr("Confirm payment", "পেমেন্ট কনফার্ম করুন")}
            </Button>

            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {tr(
                "Your plan activates after the admin verifies the TrxID (usually within 24 hours). Wrong or reused TrxIDs are rejected.",
                "এডমিন TrxID যাচাই করার পর প্ল্যান অ্যাক্টিভ হবে (সাধারণত ২৪ ঘণ্টার মধ্যে)। ভুল বা পুনরায় ব্যবহৃত TrxID বাতিল হবে।",
              )}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
