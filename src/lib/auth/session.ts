import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

/**
 * Returns the verified Supabase user for the current request.
 *
 * getUser() validates the access token with Supabase Auth, so the result is
 * safe to use for server-side authorization decisions. It is intentionally
 * request-scoped via React cache() and must not be used in Client Components.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    return data.user;
  } catch {
    return null;
  }
});

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("qb_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
