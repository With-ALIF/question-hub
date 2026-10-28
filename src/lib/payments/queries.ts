import "server-only";

import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { AdminOrder, AdminSubscription, Order, Subscription } from "./types";

/** Latest active subscription for the signed-in user (RLS: own rows only). */
export async function getMySubscription(): Promise<Subscription | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("qb_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return error ? null : data;
  } catch {
    return null;
  }
}

/** Most recent order that is still waiting for admin review. */
export async function getMyPendingOrder(): Promise<Order | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("qb_orders")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return error ? null : data;
  } catch {
    return null;
  }
}

/** Admin queue: newest 200 orders with basic customer info. */
export async function getAdminOrders(): Promise<AdminOrder[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("qb_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error || !data || data.length === 0) {
      return [];
    }

    const userIds = Array.from(new Set(data.map((order) => order.user_id)));
    const { data: profiles } = await supabase
      .from("qb_profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    const profileById = new Map(
      (profiles ?? []).map((profile) => [profile.id, profile]),
    );

    return data.map((order) => {
      const profile = profileById.get(order.user_id);
      return {
        ...order,
        customerEmail: profile?.email ?? null,
        customerName: profile?.full_name ?? null,
      };
    });
  } catch {
    return [];
  }
}

/** Admin queue: active subscriptions with basic customer info. */
export async function getAdminSubscriptions(): Promise<AdminSubscription[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: subs, error } = await supabase
      .from("qb_subscriptions")
      .select("*")
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: true });

    if (error || !subs || subs.length === 0) {
      return [];
    }

    const userIds = Array.from(new Set(subs.map((sub) => sub.user_id)));
    const orderIds = Array.from(
      new Set(subs.map((sub) => sub.order_id).filter(Boolean)),
    );

    const [{ data: profiles }, { data: orders }] = await Promise.all([
      supabase
        .from("qb_profiles")
        .select("id, email, full_name")
        .in("id", userIds),
      orderIds.length > 0
        ? supabase.from("qb_orders").select("id, amount_bdt").in("id", orderIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profileById = new Map(
      (profiles ?? []).map((profile) => [profile.id, profile]),
    );
    const orderById = new Map(
      (orders ?? []).map((order) => [order.id, order]),
    );

    return subs.map((sub) => {
      const profile = profileById.get(sub.user_id);
      const order = orderById.get(sub.order_id);
      return {
        ...sub,
        customerEmail: profile?.email ?? null,
        customerName: profile?.full_name ?? null,
        amountBdt: order?.amount_bdt ?? null,
      };
    });
  } catch {
    return [];
  }
}
