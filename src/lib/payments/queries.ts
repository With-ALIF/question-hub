import "server-only";

import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  AdminOrder,
  AdminPlanConfig,
  AdminSubscriberUser,
  AdminSubscription,
  GrantableUser,
  Order,
  Subscription,
} from "./types";

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

/** Admin queue: every subscription with a computed effective status. */
export async function getAdminSubscriptions(): Promise<AdminSubscription[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: subs, error } = await supabase
      .from("qb_subscriptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error || !subs || subs.length === 0) {
      return [];
    }

    const userIds = Array.from(new Set(subs.map((sub) => sub.user_id)));
    const orderIds = Array.from(
      new Set(subs.map((sub) => sub.order_id).filter((id): id is string => Boolean(id))),
    );

    const profilesResult = await supabase
      .from("qb_profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    const ordersResult =
      orderIds.length > 0
        ? await supabase.from("qb_orders").select("id, amount_bdt").in("id", orderIds)
        : { data: [] as { id: string; amount_bdt: number }[] };

    const profiles = profilesResult.data ?? [];
    const orders = ordersResult.data ?? [];

    const profileById = new Map(
      profiles.map((profile) => [profile.id, profile]),
    );
    const orderById = new Map(orders.map((order) => [order.id, order]));
    const now = Date.now();

    return subs.map((sub) => {
      const profile = profileById.get(sub.user_id);
      const order = sub.order_id ? orderById.get(sub.order_id) : undefined;
      const expiry = new Date(sub.expires_at).getTime();
      const effectiveStatus: AdminSubscription["effectiveStatus"] =
        sub.status === "cancelled"
          ? "cancelled"
          : sub.status === "expired" || !Number.isFinite(expiry) || expiry <= now
            ? "expired"
            : "active";

      return {
        ...sub,
        customerEmail: profile?.email ?? null,
        customerName: profile?.full_name ?? null,
        amountBdt: order?.amount_bdt ?? null,
        effectiveStatus,
        remainingDays:
          Number.isFinite(expiry) && expiry > now
            ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
            : 0,
      };
    });
  } catch {
    return [];
  }
}

/** Admin plan/limit catalogue, ordered for display. */
export async function getAdminPlanConfigs(): Promise<AdminPlanConfig[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("qb_plans")
      .select("*")
      .order("sort_order", { ascending: true });

    return error ? [] : (data ?? []);
  } catch {
    return [];
  }
}

/**
 * Admin list: every user who has signed in/registered at least once,
 * showing their current plan (active paid, starter/free, expired, or cancelled).
 */
export async function getAdminSubscriberUsers(): Promise<AdminSubscriberUser[]> {
  try {
    const supabase = createSupabaseAdminClient();

    // 1. Fetch all profiles
    const { data: profiles } = await supabase
      .from("qb_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    // 2. Fetch auth users to guarantee no registered user is missed
    let authUsers: Array<{
      id: string;
      email?: string | null;
      created_at?: string;
      last_sign_in_at?: string | null;
      user_metadata?: Record<string, unknown> | null;
    }> = [];

    try {
      const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (authData?.users) {
        authUsers = authData.users;
      }
    } catch {
      // ignore if auth.admin.listUsers is restricted, fallback to profiles
    }

    // 3. Fetch all subscriptions and orders
    const [{ data: subs }, { data: orders }] = await Promise.all([
      supabase.from("qb_subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("qb_orders").select("id, amount_bdt, user_id, status"),
    ]);

    const orderById = new Map((orders ?? []).map((o) => [o.id, o]));

    // Group subscriptions by user_id
    const subsByUser = new Map<string, NonNullable<typeof subs>>();
    for (const sub of subs ?? []) {
      const list = subsByUser.get(sub.user_id) ?? [];
      list.push(sub);
      subsByUser.set(sub.user_id, list);
    }

    // Map of all users by ID
    const userMap = new Map<
      string,
      {
        id: string;
        email: string | null;
        fullName: string | null;
        avatarUrl: string | null;
        role: string | null;
        createdAt: string;
        lastSignInAt: string | null;
        selectedSubjects: string[] | null;
        selectedDatabases: string[] | null;
      }
    >();

    // Add from authUsers first
    for (const au of authUsers) {
      const meta = (au.user_metadata ?? {}) as Record<string, unknown>;
      const fullName =
        typeof meta["full_name"] === "string" && meta["full_name"].trim()
          ? meta["full_name"].trim()
          : typeof meta["name"] === "string" && meta["name"].trim()
            ? meta["name"].trim()
            : null;
      const avatarUrl =
        typeof meta["avatar_url"] === "string" && meta["avatar_url"].trim()
          ? meta["avatar_url"].trim()
          : typeof meta["picture"] === "string" && meta["picture"].trim()
            ? meta["picture"].trim()
            : null;

      userMap.set(au.id, {
        id: au.id,
        email: au.email ?? null,
        fullName,
        avatarUrl,
        role: "user",
        createdAt: au.created_at ?? new Date().toISOString(),
        lastSignInAt: au.last_sign_in_at ?? null,
        selectedSubjects: null,
        selectedDatabases: null,
      });
    }

    // Merge or add from qb_profiles
    for (const profile of profiles ?? []) {
      const existing = userMap.get(profile.id);
      userMap.set(profile.id, {
        id: profile.id,
        email: profile.email ?? existing?.email ?? null,
        fullName: profile.full_name?.trim() || existing?.fullName || null,
        avatarUrl: profile.avatar_url ?? existing?.avatarUrl ?? null,
        role: profile.role ?? existing?.role ?? "user",
        createdAt: profile.created_at ?? existing?.createdAt ?? new Date().toISOString(),
        lastSignInAt: existing?.lastSignInAt ?? null,
        selectedSubjects: profile.selected_subjects ?? null,
        selectedDatabases: profile.selected_databases ?? null,
      });
    }

    const now = Date.now();
    const result: AdminSubscriberUser[] = [];

    for (const [userId, user] of userMap.entries()) {
      const userSubs = subsByUser.get(userId) ?? [];

      // Check for active subscription
      const activeSub = userSubs.find((s) => {
        if (s.status !== "active") return false;
        const exp = new Date(s.expires_at).getTime();
        return Number.isFinite(exp) && exp > now;
      });

      if (activeSub) {
        const exp = new Date(activeSub.expires_at).getTime();
        const linkedOrder = activeSub.order_id ? orderById.get(activeSub.order_id) : undefined;
        result.push({
          ...user,
          currentPlanName: activeSub.plan_name,
          planAudience:
            (activeSub.audience as "student" | "teacher") ||
            (activeSub.plan_id.startsWith("teacher") ? "teacher" : "student"),
          effectiveStatus: "active",
          subscriptionId: activeSub.id,
          orderId: activeSub.order_id ?? null,
          amountBdt: linkedOrder?.amount_bdt ?? null,
          startsAt: activeSub.starts_at,
          expiresAt: activeSub.expires_at,
          remainingDays: Math.ceil((exp - now) / (1000 * 60 * 60 * 24)),
          lastPlanName: null,
        });
        continue;
      }

      // Check latest subscription if exists
      const latestSub = userSubs[0];
      if (latestSub) {
        const linkedOrder = latestSub.order_id ? orderById.get(latestSub.order_id) : undefined;
        const isCancelled = latestSub.status === "cancelled";
        result.push({
          ...user,
          currentPlanName: "Starter (ফ্রি)",
          planAudience:
            (latestSub.audience as "student" | "teacher") ||
            (latestSub.plan_id.startsWith("teacher") ? "teacher" : "student"),
          effectiveStatus: isCancelled ? "cancelled" : "expired",
          subscriptionId: latestSub.id,
          orderId: latestSub.order_id ?? null,
          amountBdt: linkedOrder?.amount_bdt ?? null,
          startsAt: latestSub.starts_at,
          expiresAt: latestSub.expires_at,
          remainingDays: 0,
          lastPlanName: latestSub.plan_name,
        });
        continue;
      }

      // Pure free plan user (never subscribed)
      result.push({
        ...user,
        currentPlanName: "Starter (ফ্রি)",
        planAudience: "student",
        effectiveStatus: "free",
        subscriptionId: null,
        orderId: null,
        amountBdt: null,
        startsAt: null,
        expiresAt: null,
        remainingDays: null,
        lastPlanName: null,
      });
    }

    // Sort by: active paid subscribers first, then most recently joined
    result.sort((a, b) => {
      if (a.effectiveStatus === "active" && b.effectiveStatus !== "active") return -1;
      if (b.effectiveStatus === "active" && a.effectiveStatus !== "active") return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  } catch (err) {
    console.error("Failed to fetch admin subscriber users:", err);
    return [];
  }
}

/**
 * Admin autocomplete: emails of every user who has signed in at least once,
 * newest accounts first. Admin roles are excluded because the custom-access
 * grant form targets student and teacher accounts.
 */
export async function getGrantableUsers(): Promise<GrantableUser[]> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data } = await supabase
      .from("qb_profiles")
      .select("email, full_name, role")
      .eq("role", "user")
      .not("email", "is", null)
      .order("created_at", { ascending: false })
      .limit(500);

    const seen = new Set<string>();
    const users: GrantableUser[] = [];

    for (const profile of data ?? []) {
      const email = profile.email?.trim().toLowerCase();
      if (!email || seen.has(email)) continue;
      seen.add(email);
      users.push({ email, fullName: profile.full_name?.trim() || null });
    }

    return users;
  } catch (err) {
    console.error("Failed to fetch grantable users:", err);
    return [];
  }
}
