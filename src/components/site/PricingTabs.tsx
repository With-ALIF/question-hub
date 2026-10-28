"use client";

import { GraduationCap, Presentation, type LucideIcon } from "lucide-react";

import { PlanCard } from "@/components/site/PlanCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { plansByAudience, type PlanAudience } from "@/data/plans";
import { useI18n } from "@/lib/i18n/client";
import type { PaymentNumbers } from "@/lib/payments/config";

type PricingTabsProps = {
  defaultAudience?: PlanAudience;
  signedIn?: boolean;
  paymentNumbers: PaymentNumbers;
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
              />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
