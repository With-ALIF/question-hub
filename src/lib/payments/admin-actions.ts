"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { getCurrentRole } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  sendOrderRejectedEmail,
  sendSubscriptionApprovedEmail,
  sendSubscriptionCancelledEmail,
} from "./notify";
import type {
  AdminOrderErrorCode,
  AdminOrderResult,
  AdminSubscriptionResult,
} from "./types";

function mapRpcError(message: string | undefined): AdminOrderErrorCode {
  const text = message ?? "";

  if (text.includes("not_authorized")) return "forbidden";
  if (text.includes("order_not_pending")) return "not_pending";
  if (text.includes("order_not_found")) return "not_found";

  return "failed";
}

function revalidateOrderViews() {
  revalidatePath("/admin/orders");
  revalidatePath("/admin/dashboard");
  revalidatePath("/dashboard");
}

/** Approves a pending order and creates/extends the matching subscription. */
export async function approveOrderAction(orderId: string): Promise<AdminOrderResult> {
  const [role, user] = await Promise.all([getCurrentRole(), getCurrentUser()]);

  if (!role || !user || typeof orderId !== "string" || !orderId) {
    return { ok: false, error: "forbidden" };
  }

  try {
    const supabase = createSupabaseAdminClient();

    // Query order metadata before approving for customer notification
    const { data: order } = await supabase
      .from("qb_orders")
      .select("user_id, order_code, plan_name, amount_bdt, duration_days")
      .eq("id", orderId)
      .maybeSingle();

    const { error } = await supabase.rpc("qb_approve_order", {
      p_order_id: orderId,
      p_admin_id: user.id,
    });

    if (error) {
      return { ok: false, error: mapRpcError(error.message) };
    }

    if (order?.user_id) {
      const { data: profile } = await supabase
        .from("qb_profiles")
        .select("email, full_name")
        .eq("id", order.user_id)
        .maybeSingle();

      const customerEmail = profile?.email;
      if (customerEmail) {
        after(() =>
          sendSubscriptionApprovedEmail({
            customerEmail,
            customerName: profile?.full_name ?? null,
            orderCode: order.order_code,
            planName: order.plan_name,
            amountBdt: order.amount_bdt,
            durationDays: order.duration_days,
          }),
        );
      }
    }

    revalidateOrderViews();
    return { ok: true };
  } catch {
    return { ok: false, error: "failed" };
  }
}

/** Rejects a pending order. The TrxID becomes available again for a retry. */
export async function rejectOrderAction(
  orderId: string,
  note?: string,
): Promise<AdminOrderResult> {
  const [role, user] = await Promise.all([getCurrentRole(), getCurrentUser()]);

  if (!role || !user || typeof orderId !== "string" || !orderId) {
    return { ok: false, error: "forbidden" };
  }

  const cleanNote = typeof note === "string" ? note.trim().slice(0, 300) : "";

  try {
    const supabase = createSupabaseAdminClient();

    // Query order metadata before rejecting for customer notification
    const { data: order } = await supabase
      .from("qb_orders")
      .select("user_id, order_code, plan_name, amount_bdt")
      .eq("id", orderId)
      .maybeSingle();

    const { error } = await supabase.rpc(
      "qb_reject_order",
      cleanNote
        ? { p_order_id: orderId, p_admin_id: user.id, p_note: cleanNote }
        : { p_order_id: orderId, p_admin_id: user.id },
    );

    if (error) {
      return { ok: false, error: mapRpcError(error.message) };
    }

    if (order?.user_id) {
      const { data: profile } = await supabase
        .from("qb_profiles")
        .select("email, full_name")
        .eq("id", order.user_id)
        .maybeSingle();

      const customerEmail = profile?.email;
      if (customerEmail) {
        after(() =>
          sendOrderRejectedEmail({
            customerEmail,
            customerName: profile?.full_name ?? null,
            orderCode: order.order_code,
            planName: order.plan_name,
            amountBdt: order.amount_bdt,
            reason: cleanNote || null,
          }),
        );
      }
    }

    revalidateOrderViews();
    return { ok: true };
  } catch {
    return { ok: false, error: "failed" };
  }
}

/**
 * Cancels an active subscription and sends a cancellation email to the student via Brevo.
 */
export async function cancelSubscriptionAction(
  subscriptionId: string,
  note?: string,
): Promise<AdminSubscriptionResult> {
  const [role, user] = await Promise.all([getCurrentRole(), getCurrentUser()]);

  if (!role || !user || typeof subscriptionId !== "string" || !subscriptionId) {
    return { ok: false, error: "forbidden" };
  }

  const cleanNote = typeof note === "string" ? note.trim().slice(0, 300) : "";

  try {
    const supabase = createSupabaseAdminClient();

    // 1. Fetch subscription details
    const { data: subscription, error: fetchError } = await supabase
      .from("qb_subscriptions")
      .select("id, user_id, order_id, plan_name, status")
      .eq("id", subscriptionId)
      .maybeSingle();

    if (fetchError || !subscription) {
      return { ok: false, error: "not_found" };
    }

    // 2. Update subscription status to 'cancelled'
    const { error: updateError } = await supabase
      .from("qb_subscriptions")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    if (updateError) {
      return { ok: false, error: "failed" };
    }

    // 3. If there is a linked order, update it as well
    let amountBdt: number | null = null;
    if (subscription.order_id) {
      const { data: order } = await supabase
        .from("qb_orders")
        .select("amount_bdt")
        .eq("id", subscription.order_id)
        .maybeSingle();

      amountBdt = order?.amount_bdt ?? null;

      await supabase
        .from("qb_orders")
        .update({
          status: "cancelled",
          admin_note: cleanNote || "Subscription cancelled by admin",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.order_id);
    }

    // 4. Fetch student profile to send cancellation email
    if (subscription.user_id) {
      const { data: profile } = await supabase
        .from("qb_profiles")
        .select("email, full_name")
        .eq("id", subscription.user_id)
        .maybeSingle();

      const customerEmail = profile?.email;
      if (customerEmail) {
        after(() =>
          sendSubscriptionCancelledEmail({
            customerEmail,
            customerName: profile?.full_name ?? null,
            planName: subscription.plan_name,
            amountBdt,
            reason: cleanNote || null,
          }),
        );
      }
    }

    revalidatePath("/admin/subscriptions");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/dashboard");
    revalidatePath("/dashboard");
    revalidatePath("/plans");

    return { ok: true };
  } catch {
    return { ok: false, error: "failed" };
  }
}
