"use server";

import { revalidatePath } from "next/cache";

import { getCurrentRole } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { AdminOrderErrorCode, AdminOrderResult } from "./types";

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
    const { error } = await supabase.rpc("qb_approve_order", {
      p_order_id: orderId,
      p_admin_id: user.id,
    });

    if (error) {
      return { ok: false, error: mapRpcError(error.message) };
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
    const { error } = await supabase.rpc(
      "qb_reject_order",
      cleanNote
        ? { p_order_id: orderId, p_admin_id: user.id, p_note: cleanNote }
        : { p_order_id: orderId, p_admin_id: user.id },
    );

    if (error) {
      return { ok: false, error: mapRpcError(error.message) };
    }

    revalidateOrderViews();
    return { ok: true };
  } catch {
    return { ok: false, error: "failed" };
  }
}
