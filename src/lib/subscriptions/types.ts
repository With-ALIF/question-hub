export type SubscriptionPlanId = "free" | "monthly" | "yearly";

export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

/**
 * Domain-only plan metadata. Nothing here charges a user or talks to a payment
 * provider; it exists so a future subscription service can share one source of
 * truth with the current pricing UI.
 */
export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  name: string;
  priceLabel: string;
  durationMonths: number | null;
  featureKeys: readonly string[];
  highlighted: boolean;
};

export type UserSubscription = {
  userId: string;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};
