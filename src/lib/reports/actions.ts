"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getI18n } from "@/lib/i18n/server";
import { sendReportNotificationEmail } from "./email";
import { sendReportNotificationTelegram } from "./telegram";
import type { ReportType } from "./types";

export type SubmitReportInput = {
  questionId: string;
  reportType: ReportType;
  message: string;
};

export type SubmitReportResult = {
  success: boolean;
  alreadyReported?: boolean;
  error?: string;
};

export async function checkReportStatus(questionId: string): Promise<boolean> {
  try {
    const qId = questionId?.trim();
    if (!qId) return false;
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("qb_report")
      .select("id")
      .eq("question_id", qId)
      .limit(1);
    return Boolean(data && data.length > 0);
  } catch {
    return false;
  }
}

export async function submitQuestionReport(
  input: SubmitReportInput
): Promise<SubmitReportResult> {
  const { tr } = await getI18n();
  try {
    const questionId = input.questionId?.trim();
    const message = input.message?.trim();
    const reportType = input.reportType;

    if (!questionId) {
      return { success: false, error: tr("Question ID not found.", "প্রশ্ন আইডি পাওয়া যায়নি।") };
    }
    if (!reportType) {
      return { success: false, error: tr("Select the type of issue.", "সমস্যার ধরন নির্বাচন করুন।") };
    }
    if (!message) {
      return { success: false, error: tr("Please write a detailed message.", "বিস্তারিত মেসেজ লিখুন।") };
    }

    const isReported = await checkReportStatus(questionId);
    if (isReported) {
      return {
        success: false,
        alreadyReported: true,
        error: tr(
          "This question has already been reported. Please wait for admin verification.",
          "এই প্রশ্নে ইতিমধ্যে রিপোর্ট করা হয়েছে, এডমিন ভেরিফিকেশন পর্যন্ত অপেক্ষা করুন।",
        ),
      };
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("qb_report").insert({
      question_id: questionId,
      user_id: user?.id ?? null,
      report_type: reportType,
      message,
      status: "pending",
    });

    if (error) return { success: false, error: error.message };

    void sendReportNotificationEmail({
      questionId,
      reportType,
      message,
      userEmail: user?.email,
    });

    void sendReportNotificationTelegram({
      questionId,
      reportType,
      message,
      userEmail: user?.email,
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : tr("Could not submit the report.", "রিপোর্ট সাবমিট করা যায়নি।"),
    };
  }
}
