"use server";

import { revalidatePath } from "next/cache";
import { getCurrentRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { findQuestionById } from "@/lib/admin/question-search";
import type { StorageQuestion } from "@/lib/questions/storage";
import type { QuestionReport } from "./types";

export type AdminReportResult = {
  success: boolean;
  error?: string;
};

export async function getPendingReports(): Promise<QuestionReport[]> {
  try {
    const role = await getCurrentRole();
    if (!role) return [];

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("qb_report")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as QuestionReport[];
  } catch {
    return [];
  }
}

export async function getReportedQuestion(
  questionId: string
): Promise<StorageQuestion | null> {
  try {
    const role = await getCurrentRole();
    if (!role) return null;
    const res = await findQuestionById(questionId);
    return res?.question ?? null;
  } catch {
    return null;
  }
}

export async function resolveReport(reportId: string): Promise<AdminReportResult> {
  try {
    const role = await getCurrentRole();
    if (!role) return { success: false, error: "অনুমতি নেই।" };
    if (!reportId) return { success: false, error: "রিপোর্ট আইডি পাওয়া যায়নি।" };

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("qb_report")
      .delete()
      .eq("id", reportId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/reports");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "সমাধান সম্পন্ন করা যায়নি।",
    };
  }
}
