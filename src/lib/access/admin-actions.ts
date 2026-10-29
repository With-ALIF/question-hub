"use server";

import { revalidatePath } from "next/cache";

import { getCurrentRole } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminPlanErrorCode =
  | "forbidden"
  | "invalid_input"
  | "student_not_found"
  | "not_found"
  | "failed";

export type AdminPlanActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: AdminPlanErrorCode };

export type UpdatePlanConfigInput = {
  planId: string;
  name: string;
  dailyMcqLimit: number | null;
  dailyModelTestLimit: number | null;
  totalModelTestLimit: number | null;
  savedQuestionsLimit: number | null;
  examPaperLimit: number | null;
  allowAnswer: boolean;
  allowExplanation: boolean;
  allowedSubjects: string[] | null;
  allowedChapters: string[] | null;
  allowedDatabases: string[] | null;
  subjectSelectionLimit: number;
  databaseSelectionLimit: number;
  durationDays: number | null;
  isActive: boolean;
};

export type GrantCustomAccessInput = {
  email: string;
  planId: string;
  days: number;
  note?: string;
};

function cleanLimit(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < 0) return undefined;
  return Math.floor(number);
}

function cleanList(value: unknown): string[] | null | undefined {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? Array.from(new Set(items)) : null;
}

export async function updatePlanConfigAction(
  input: UpdatePlanConfigInput,
): Promise<AdminPlanActionResult> {
  const role = await getCurrentRole();

  if (!role) {
    return { ok: false, error: "forbidden" };
  }

  const planId = String(input?.planId ?? "").trim();
  const name = String(input?.name ?? "").trim();

  if (!planId || !name || name.length > 120) {
    return { ok: false, error: "invalid_input" };
  }

  const dailyMcqLimit = cleanLimit(input.dailyMcqLimit);
  const dailyModelTestLimit = cleanLimit(input.dailyModelTestLimit);
  const totalModelTestLimit = cleanLimit(input.totalModelTestLimit);
  const savedQuestionsLimit = cleanLimit(input.savedQuestionsLimit);
  const examPaperLimit = cleanLimit(input.examPaperLimit);
  const durationDays = cleanLimit(input.durationDays);
  const allowedSubjects = cleanList(input.allowedSubjects);
  const allowedChapters = cleanList(input.allowedChapters);
  const allowedDatabases = cleanList(input.allowedDatabases);
  const subjectSelectionLimit = cleanLimit(input.subjectSelectionLimit);
  const databaseSelectionLimit = cleanLimit(input.databaseSelectionLimit);

  if (
    dailyMcqLimit === undefined ||
    dailyModelTestLimit === undefined ||
    totalModelTestLimit === undefined ||
    savedQuestionsLimit === undefined ||
    examPaperLimit === undefined ||
    durationDays === undefined ||
    allowedSubjects === undefined ||
    allowedChapters === undefined ||
    allowedDatabases === undefined ||
    subjectSelectionLimit === undefined ||
    databaseSelectionLimit === undefined
  ) {
    return { ok: false, error: "invalid_input" };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("qb_plans")
      .update({
        name,
        daily_mcq_limit: dailyMcqLimit,
        daily_model_test_limit: dailyModelTestLimit,
        total_model_test_limit: totalModelTestLimit,
        saved_questions_limit: savedQuestionsLimit,
        exam_paper_limit: examPaperLimit,
        allow_answer: Boolean(input.allowAnswer),
        allow_explanation: Boolean(input.allowExplanation),
        allowed_subjects: allowedSubjects,
        allowed_chapters: allowedChapters,
        allowed_databases: allowedDatabases,
        subject_selection_limit: subjectSelectionLimit ?? 0,
        database_selection_limit: databaseSelectionLimit ?? 0,
        duration_days: durationDays,
        is_active: Boolean(input.isActive),
        updated_at: new Date().toISOString(),
      })
      .eq("plan_id", planId)
      .select("plan_id")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, error: "not_found" };
    }

    revalidatePath("/admin/plans");
    revalidatePath("/dashboard");
    revalidatePath("/plans");
    revalidatePath("/questions");

    return { ok: true, message: "Plan limits saved." };
  } catch {
    return { ok: false, error: "failed" };
  }
}

export async function grantCustomAccessAction(
  input: GrantCustomAccessInput,
): Promise<AdminPlanActionResult> {
  const [role, user] = await Promise.all([getCurrentRole(), getCurrentUser()]);

  if (!role || !user) {
    return { ok: false, error: "forbidden" };
  }

  const email = String(input?.email ?? "").trim().toLowerCase();
  const planId = String(input?.planId ?? "").trim();
  const days = Number(input?.days);
  const note = String(input?.note ?? "").trim().slice(0, 300);

  if (!email || !planId || !Number.isFinite(days) || days < 1 || days > 3650) {
    return { ok: false, error: "invalid_input" };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from("qb_profiles")
      .select("id")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();

    if (profileError) {
      return { ok: false, error: "failed" };
    }

    if (!profile?.id) {
      return { ok: false, error: "student_not_found" };
    }

    const { error } = await supabase.rpc("qb_grant_custom_access", {
      p_user_id: profile.id,
      p_plan_id: planId,
      p_days: Math.floor(days),
      p_note: note || null,
      p_admin_id: user.id,
    });

    if (error) {
      return { ok: false, error: "failed" };
    }

    revalidatePath("/admin/subscriptions");
    revalidatePath("/admin/plans");
    revalidatePath("/dashboard");

    return { ok: true, message: "Custom access granted." };
  } catch {
    return { ok: false, error: "failed" };
  }
}

export async function runExpirySweepAction(): Promise<
  { ok: true; expired: number } | { ok: false; error: AdminPlanErrorCode }
> {
  const role = await getCurrentRole();

  if (!role) {
    return { ok: false, error: "forbidden" };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("qb_expire_subscriptions");

    if (error) {
      return { ok: false, error: "failed" };
    }

    revalidatePath("/admin/subscriptions");
    revalidatePath("/dashboard");

    return { ok: true, expired: typeof data === "number" ? data : 0 };
  } catch {
    return { ok: false, error: "failed" };
  }
}
