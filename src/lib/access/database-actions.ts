"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { getEntitlement } from "./entitlement";
import type { DatabaseChoiceState } from "./types";

/**
 * Saves the database (HSC / Admission / Job) chosen for plans that use
 * database_selection_limit. The plan limit is enforced on the server.
 */
export async function chooseDatabaseAction(
  _previousState: DatabaseChoiceState,
  formData: FormData,
): Promise<DatabaseChoiceState> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, error: "auth" };
  }

  const entitlement = await getEntitlement(user.id);

  if (entitlement.databaseSelectionLimit <= 0) {
    return { ok: false, error: "forbidden" };
  }

  const slug = String(formData.get("database") ?? "").trim();

  if (!slug || slug.length > 120) {
    return { ok: false, error: "invalid_selection" };
  }

  if (
    entitlement.access.allowedDatabases !== null &&
    !entitlement.access.allowedDatabases.includes(slug)
  ) {
    return { ok: false, error: "invalid_selection" };
  }

  try {
    const supabase = createSupabaseAdminClient();

    const { data: database, error: databaseError } = await supabase
      .from("qb_databases")
      .select("slug")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (databaseError || !database) {
      return { ok: false, error: "invalid_selection" };
    }

    const { data: profile, error: updateError } = await supabase
      .from("qb_profiles")
      .update({
        selected_databases: [database.slug],
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

    return { ok: true, value: database.slug };
  } catch {
    return { ok: false, error: "failed" };
  }
}
