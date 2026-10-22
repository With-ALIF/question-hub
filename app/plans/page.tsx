import type { Metadata } from "next";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { PlanCard } from "@/components/site/PlanCard";
import { plans } from "@/data/mock";

export const metadata: Metadata = {
  title: "Subscription Plans — QuestionBank",
  description: "Compare free, monthly and yearly plans. Prices, duration and features at a glance.",
  openGraph: {
    title: "Subscription Plans — QuestionBank",
    description: "Compare free, monthly and yearly plans. Prices, duration and features at a glance.",
  },
};

export default function PlansPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Pick your plan
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
              Every plan unlocks the full question bank structure. Upgrade or cancel anytime.
            </p>
          </div>

          <div className="mt-12 grid gap-6 pt-2 md:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            UI prototype — subscription and payment flows are not active yet.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
