"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { getEntitlement } from "./entitlement";
import type { SubjectChoiceState } from "./types";

/**
 * Saves the subject a student picked for a plan that allows self-selection
 * (for example the free plan's single subject). The plan limit is enforced on
 * the server, and only active subjects from qb_subjects can be chosen.
 */
export async function chooseSubjectAction(
  _previousState: SubjectChoiceState,
  formData: FormData,
): Promise<SubjectChoiceState> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, error: "auth" };
  }

  const entitlement = await getEntitlement(user.id);

  if (entitlement.subjectSelectionLimit <= 0) {
    return { ok: false, error: "forbidden" };
  }

  const slug = String(formData.get("subject") ?? "").trim();

  if (!slug || slug.length > 120) {
    return { ok: false, error: "invalid_selection" };
  }

  try {
    const supabase = createSupabaseAdminClient();

    // Free plan restriction: once selected, subjects cannot be changed unless upgraded.
    if (!entitlement.paidAccess) {
      const { data: existingProfile } = await supabase
        .from("qb_profiles")
        .select("selected_subjects")
        .eq("id", user.id)
        .maybeSingle();

      const existing = Array.isArray(existingProfile?.selected_subjects)
        ? existingProfile.selected_subjects.filter(
            (s): s is string => typeof s === "string" && s.trim().length > 0,
          )
        : [];

      if (existing.length > 0) {
        return { ok: false, error: "locked" };
      }
    }

    const { data: subject, error: subjectError } = await supabase
      .from("qb_subjects")
      .select("slug")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (subjectError || !subject) {
      return { ok: false, error: "invalid_selection" };
    }

    const { data: profile, error: updateError } = await supabase
      .from("qb_profiles")
      .update({
        selected_subjects: [subject.slug],
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("id")
      .maybeSingle();

    if (updateError || !profile) {
      return { ok: false, error: "failed" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/questions");
    revalidatePath("/exam-paper");

    return { ok: true, value: subject.slug };
  } catch {
    return { ok: false, error: "failed" };
  }
}
