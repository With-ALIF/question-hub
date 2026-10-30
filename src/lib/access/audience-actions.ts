"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { AudienceChoice, AudienceChoiceState } from "./types";

/**
 * Records the one-time student/teacher choice in qb_user_audience, which
 * decides which free plan backs a new account. The table has one row per user,
 * so a second submit hits the primary key and is reported as locked — the
 * original answer can never be overwritten from here.
 */
export async function chooseAudienceAction(
  _previousState: AudienceChoiceState,
  formData: FormData,
): Promise<AudienceChoiceState> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, error: "auth" };
  }

  const requested = String(formData.get("audience") ?? "").trim().toLowerCase();

  if (requested !== "student" && requested !== "teacher") {
    return { ok: false, error: "invalid_selection" };
  }

  const audience: AudienceChoice = requested;

  try {
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("qb_user_audience")
      .insert({ user_id: user.id, audience });

    if (error) {
      const { data: existing } = await supabase
        .from("qb_user_audience")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      return existing ? { ok: false, error: "locked" } : { ok: false, error: "failed" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/questions");
    revalidatePath("/exam-paper");
    revalidatePath("/model-test");
    revalidatePath("/saved");
    revalidatePath("/plans");

    return { ok: true, value: audience };
  } catch {
    return { ok: false, error: "failed" };
  }
}
