"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PaymentMethod } from "@/lib/supabase/types";

import {
  BD_PHONE_PATTERN,
  TRX_PATTERN,
  findPlan,
  isPaymentMethod,
} from "./config";
import { sendPaymentNotifications } from "./notify";
import type { CreateOrderResult } from "./types";

export type CreateManualOrderInput = {
  planId: string;
  method: PaymentMethod;
  trxId: string;
  senderNumber?: string;
};

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_ORDERS = 5;

function makeOrderCode() {
  const token = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `QB-${token}`;
}

/**
 * Creates a pending manual payment order. The price and duration are always
 * resolved from the server-side plan catalog, never from client input.
 */
export async function createManualOrderAction(
  input: CreateManualOrderInput,
): Promise<CreateOrderResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, error: "auth" };
  }

  if (!input || typeof input.planId !== "string" || !isPaymentMethod(input.method)) {
    return { ok: false, error: "invalid_input" };
  }

  const trxId = String(input.trxId ?? "").trim().toUpperCase();
  const senderNumber = String(input.senderNumber ?? "").trim();

  if (!TRX_PATTERN.test(trxId)) {
    return { ok: false, error: "invalid_input" };
  }

  if (senderNumber && !BD_PHONE_PATTERN.test(senderNumber)) {
    return { ok: false, error: "invalid_input" };
  }

  const match = findPlan(input.planId);

  if (!match || match.plan.amountBdt <= 0 || match.plan.durationDays <= 0) {
    return { ok: false, error: "invalid_plan" };
  }

  try {
    const supabase = createSupabaseAdminClient();

    // A plan disabled by an admin cannot be purchased even though its static
    // price/duration catalogue entry still exists.
    const { data: planConfig } = await supabase
      .from("qb_plans")
      .select("is_active")
      .eq("plan_id", match.plan.id)
      .maybeSingle();

    if (planConfig && planConfig.is_active === false) {
      return { ok: false, error: "invalid_plan" };
    }

    // The one-time role choice fixes which plan family the account may buy.
    const { data: roleChoice } = await supabase
      .from("qb_user_audience")
      .select("audience")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleChoice && roleChoice.audience !== match.audience) {
      return { ok: false, error: "audience_mismatch" };
    }

    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count } = await supabase
      .from("qb_orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", since);

    if ((count ?? 0) >= RATE_LIMIT_MAX_ORDERS) {
      return { ok: false, error: "rate_limited" };
    }

    const { data: existingPendingOrder } = await supabase
      .from("qb_orders")
      .select("id, order_code")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();

    if (existingPendingOrder) {
      return { ok: false, error: "pending_order_exists" };
    }

    const { data: activeSub } = await supabase
      .from("qb_subscriptions")
      .select("id, plan_name, expires_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (activeSub) {
      return { ok: false, error: "active_subscription_exists" };
    }

    const { data: duplicate } = await supabase
      .from("qb_orders")
      .select("id")
      .eq("payment_method", input.method)
      .eq("trx_id", trxId)
      .in("status", ["pending", "approved"])
      .maybeSingle();

    if (duplicate) {
      return { ok: false, error: "duplicate_trx" };
    }

    const { data, error } = await supabase
      .from("qb_orders")
      .insert({
        order_code: makeOrderCode(),
        user_id: user.id,
        plan_id: match.plan.id,
        plan_name: match.plan.name.en,
        audience: match.audience,
        amount_bdt: match.plan.amountBdt,
        duration_days: match.plan.durationDays,
        payment_method: input.method,
        sender_number: senderNumber || null,
        trx_id: trxId,
        status: "pending",
      })
      .select("order_code")
      .single();

    if (error || !data) {
      if (error?.code === "23505") {
        return { ok: false, error: "duplicate_trx" };
      }

      return { ok: false, error: "failed" };
    }

    const metadata = user.user_metadata ?? {};
    const customerName =
      typeof metadata["full_name"] === "string"
        ? metadata["full_name"]
        : typeof metadata["name"] === "string"
          ? metadata["name"]
          : null;

    after(() =>
      sendPaymentNotifications({
        orderCode: data.order_code,
        planName: match.plan.name.en,
        planNameBn: match.plan.name.bn,
        audience: match.audience,
        amountBdt: match.plan.amountBdt,
        durationLabel: match.plan.duration.bn,
        method: input.method,
        trxId,
        senderNumber: senderNumber || null,
        customerName,
        customerEmail: user.email ?? null,
      }),
    );

    revalidatePath("/dashboard");
    revalidatePath("/admin/orders");

    return { ok: true, orderCode: data.order_code };
  } catch {
    return { ok: false, error: "failed" };
  }
}
