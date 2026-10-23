import "server-only";

import { cache } from "react";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "./session";

/**
 * Admin roles, in ascending order of privilege.
 *
 * `qb_profiles.role` is the single source of truth. It is written only by the
 * Supabase Auth signup trigger or by service-role code, and Postgres guards it
 * with the `protect_profile_role()` trigger, so a signed-in user cannot promote
 * themselves.
 */
export const ADMIN_ROLES = ["admin", "super_admin"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole);
}

/**
 * Returns the signed-in user's role, or null when they are signed out.
 *
 * Read through the service-role client rather than `getCurrentProfile()`:
 * the `qb_profiles` RLS policies only let a user read their own row, which
 * would make this check fail for exactly the accounts it needs to admit.
 */
export const getCurrentRole = cache(async (): Promise<AdminRole | null> => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("qb_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return null;
    }

    return isAdminRole(data?.role) ? data.role : null;
  } catch {
    return null;
  }
});

/** True when the current request carries an authenticated admin session. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  return (await getCurrentRole()) !== null;
}

/**
 * Looks up the role for an arbitrary user id, bypassing RLS.
 *
 * Used immediately after `signInWithPassword`, where the caller has just
 * authenticated a specific user and needs to decide whether to admit them.
 * Returns null when the profile is missing or the lookup fails.
 */
export async function readAdminRole(userId: string): Promise<AdminRole | null> {
  if (!userId) {
    return null;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("qb_profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return null;
    }

    return isAdminRole(data?.role) ? data.role : null;
  } catch {
    return null;
  }
}
