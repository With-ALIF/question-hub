export type SubscriptionPlanId = "free" | "monthly" | "yearly";

export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

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
