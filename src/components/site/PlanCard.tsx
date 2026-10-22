import { Check } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Plan } from "@/data/mock";

export function PlanCard({ plan }: { plan: Plan }) {
  return (
    <Card
      className={`relative flex flex-col ${
        plan.highlighted ? "border-primary shadow-lg ring-1 ring-primary/30" : ""
      }`}
    >
      {plan.highlighted && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 text-accent-foreground">
          Most popular
        </Badge>
      )}
      <CardHeader className="pb-2">
        <h3 className="font-display text-lg font-semibold text-foreground">{plan.name}</h3>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{plan.duration}</p>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="flex items-baseline gap-1.5">
          <span className="font-display text-4xl font-bold tracking-tight text-foreground">{plan.price}</span>
          <span className="text-sm text-muted-foreground">{plan.priceNote}</span>
        </p>
        <ul className="mt-5 space-y-2.5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {feature}
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
          <Link href="/register">{plan.cta}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
