import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";
import type { AudienceChoice } from "@/lib/access/types";

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

/**
 * The one-time student/teacher choice from qb_user_audience. Null means the
 * account has not chosen yet, so the dashboard shows the role gate.
 */
export async function getCurrentAudience(): Promise<AudienceChoice | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("qb_user_audience")
      .select("audience")
      .eq("user_id", user.id)
      .maybeSingle();

    return data?.audience ?? null;
  } catch {
    return null;
  }
}
