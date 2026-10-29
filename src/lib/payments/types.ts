import type { Order, PlanConfig, Subscription } from "@/lib/supabase/types";

export type PaymentErrorCode =
  | "auth"
  | "invalid_input"
  | "invalid_plan"
  | "duplicate_trx"
  | "rate_limited"
  | "pending_order_exists"
  | "active_subscription_exists"
  | "failed";

export type CreateOrderResult =
  | { ok: true; orderCode: string }
  | { ok: false; error: PaymentErrorCode };

export type AdminOrderErrorCode =
  | "forbidden"
  | "not_pending"
  | "not_found"
  | "failed";

export type AdminOrderResult =
  | { ok: true }
  | { ok: false; error: AdminOrderErrorCode };

export type AdminOrder = Order & {
  customerEmail: string | null;
  customerName: string | null;
};

export type AdminSubscription = Subscription & {
  customerEmail: string | null;
  customerName: string | null;
  amountBdt: number | null;
  /** Computed from expires_at so stale "active" rows display correctly. */
  effectiveStatus: "active" | "expired" | "cancelled";
  remainingDays: number | null;
};

export type AdminPlanConfig = PlanConfig;

export type AdminSubscriptionResult =
  | { ok: true }
  | { ok: false; error: AdminOrderErrorCode };

export type { Order, Subscription };
