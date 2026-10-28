"use client";

import { Clock, GraduationCap, Presentation, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { PlanCard } from "@/components/site/PlanCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { plansByAudience, type PlanAudience } from "@/data/plans";
import { useI18n } from "@/lib/i18n/client";
import type { PaymentNumbers } from "@/lib/payments/config";
import type { Order } from "@/lib/payments/types";

type PricingTabsProps = {
  defaultAudience?: PlanAudience | undefined;
  signedIn?: boolean | undefined;
  paymentNumbers: PaymentNumbers;
  pendingOrder?: Order | null | undefined;
};

const AUDIENCES: {
  value: PlanAudience;
  label: [en: string, bn: string];
  description: [en: string, bn: string];
  icon: LucideIcon;
}[] = [
  {
    value: "student",
    label: ["Student", "শিক্ষার্থী"],
    description: [
      "For HSC & admission candidates who practise daily.",
      "HSC ও ভর্তি পরীক্ষার্থীদের প্রতিদিনের অনুশীলনের জন্য।",
    ],
    icon: GraduationCap,
  },
  {
    value: "teacher",
    label: ["Teacher", "শিক্ষক"],
    description: [
      "For educators who build exam papers and share resources.",
      "পরীক্ষাপত্র তৈরি ও রিসোর্স শেয়ার করা শিক্ষকদের জন্য।",
    ],
    icon: Presentation,
  },
];

export function PricingTabs({
  defaultAudience = "student",
  signedIn = false,
  paymentNumbers,
  pendingOrder,
}: PricingTabsProps) {
  const { tr } = useI18n();

  return (
    <Tabs defaultValue={defaultAudience} className="mt-8">
      <TabsList
        aria-label={tr("Choose pricing for students or teachers", "শিক্ষার্থী বা শিক্ষকের প্ল্যান বেছে নিন")}
        className="mx-auto flex h-auto w-full max-w-md gap-1 rounded-xl p-1.5"
      >
        {AUDIENCES.map(({ value, label, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="group flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors hover:text-foreground"
          >
            <Icon
              className="size-4 transition-transform duration-300 ease-out group-data-[state=active]:scale-110"
              aria-hidden="true"
            />
            {tr(...label)}
          </TabsTrigger>
        ))}
      </TabsList>

      {pendingOrder && (
        <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-left">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Clock className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-foreground">
                  {tr("You have a pending order", "আপনার একটি অর্ডার পেন্ডিং আছে")}
                </h4>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  {pendingOrder.order_code}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {tr(
                  "You already ordered a plan. You cannot order another plan until this order is verified or rejected by an admin.",
                  "আপনি ইতোমধ্যে একটি অর্ডার করেছেন যা বর্তমানে পেন্ডিং আছে। সেটি যাচাই বা বাতিল না হওয়া পর্যন্ত অন্য কোনো প্ল্যান অর্ডার করা যাবে না।",
                )}
              </p>
              <div className="mt-2.5">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-7 border-amber-500/30 text-xs hover:bg-amber-500/20"
                >
                  <Link href="/dashboard">
                    {tr("View in dashboard", "ড্যাশবোর্ডে দেখুন")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {AUDIENCES.map(({ value, description }) => (
        <TabsContent
          key={value}
          value={value}
          className="mt-0 outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 data-[state=active]:duration-300 data-[state=active]:ease-out"
        >
          <p className="mt-4 text-center text-sm text-muted-foreground">{tr(...description)}</p>

          <div className="mt-8 grid gap-6 pt-2 md:grid-cols-3">
            {plansByAudience[value].map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                signedIn={signedIn}
                paymentNumbers={paymentNumbers}
                pendingOrder={pendingOrder}
              />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
