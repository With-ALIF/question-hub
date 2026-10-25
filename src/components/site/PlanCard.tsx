"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import type { LocalizedText, Plan } from "@/data/plans";

export function PlanCard({ plan }: { plan: Plan }) {
  const { lang, tr } = useI18n();
  const pick = (value: LocalizedText) => value[lang];

  return (
    <Card
      className={`relative flex flex-col ${
        plan.highlighted ? "border-primary shadow-lg ring-1 ring-primary/30" : ""
      }`}
    >
      {plan.highlighted && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 text-accent-foreground">
          {plan.badge ? pick(plan.badge) : tr("Most popular", "সর্বাধিক জনপ্রিয়")}
        </Badge>
      )}
      <CardHeader className="pb-2">
        <h3 className="font-display text-lg font-semibold text-foreground">{pick(plan.name)}</h3>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{pick(plan.duration)}</p>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="flex items-baseline gap-1.5">
          <span className="font-display text-4xl font-bold tracking-tight text-foreground">{plan.price}</span>
          <span className="text-sm text-muted-foreground">{pick(plan.priceNote)}</span>
        </p>
        <ul className="mt-5 space-y-2.5">
          {plan.features.map((feature) => (
            <li key={feature.en} className="flex items-start gap-2.5 text-sm text-foreground">
              <span
                className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full bg-linear-to-br from-sky-400 via-blue-500 to-blue-700 text-white shadow-[0_1px_5px_rgba(37,99,235,0.45)] ring-1 ring-inset ring-white/30 dark:from-sky-400 dark:via-blue-500 dark:to-blue-600"
                aria-hidden="true"
              >
                <Check className="size-3" strokeWidth={3} />
              </span>
              {pick(feature)}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="pt-4">
        <Button
          asChild
          variant={plan.highlighted ? "default" : "outline"}
          className="w-full"
        >
          <Link href="/register">{pick(plan.cta)}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
