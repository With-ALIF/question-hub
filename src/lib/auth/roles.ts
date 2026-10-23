import "server-only";

import { cache } from "react";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "./session";

export const ADMIN_ROLES = ["admin", "super_admin"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole);
}

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

export async function isCurrentUserAdmin(): Promise<boolean> {
  return (await getCurrentRole()) !== null;
}

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
