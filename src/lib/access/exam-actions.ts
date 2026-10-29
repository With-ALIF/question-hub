"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";

import type { ConsumeExamPaperResult } from "./types";
import { consumeExamPaper } from "./usage";

/**
 * Records one exam paper export against the user's lifetime plan quota.
 * The client sends a stable event key for the current paper so repeated
 * print/download actions for the same paper are idempotent.
 */
export async function recordExamPaperAction(
  eventKey: string,
): Promise<ConsumeExamPaperResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, used: 0, limit: 0, remaining: 0, error: "auth" };
  }

  const result = await consumeExamPaper(user.id, eventKey);

  if (result.ok) {
    revalidatePath("/dashboard");
    revalidatePath("/exam-paper");
  }

  return result;
}
