import type { SubscriptionPlan, SubscriptionPlanId } from "./types";

export const subscriptionPlans: readonly SubscriptionPlan[] = [
  {
    id: "free",
    name: "Starter",
    priceLabel: "৳0",
    durationMonths: null,
    featureKeys: ["basic-search", "limited-questions", "community-answers"],
    highlighted: false,
  },
  {
    id: "monthly",
    name: "Scholar",
    priceLabel: "৳199",
    durationMonths: 1,
    featureKeys: [
      "unlimited-questions",
      "all-subjects",
      "expert-solutions",
      "chapter-practice",
      "priority-support",
    ],
    highlighted: true,
  },
  {
    id: "yearly",
    name: "Topper",
    priceLabel: "৳1,499",
    durationMonths: 12,
    featureKeys: [
      "scholar-features",
      "past-papers",
      "pdf-notes",
      "mock-exams",
      "early-access",
    ],
    highlighted: false,
  },
];

export function getSubscriptionPlan(
  planId: SubscriptionPlanId,
): SubscriptionPlan | undefined {
  return subscriptionPlans.find((plan) => plan.id === planId);
}
