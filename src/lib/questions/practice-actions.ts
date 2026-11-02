"use server";

import { getEntitlement } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth/session";
import { sanitizeFilters, type QuestionFiltersInput } from "@/lib/questions/filters";
import {
  MAX_PRACTICE_MINUTES,
  MAX_PRACTICE_QUESTIONS,
  type PracticeQuestion,
} from "@/lib/questions/practice-types";
import { samplePracticeQuestions } from "@/lib/questions/practice";

export type StartPracticeInput = {
  subject?: string;
  filters?: QuestionFiltersInput;
  count?: number;
  minutes?: number;
  negative?: number;
};

export type StartPracticeResult =
  | {
      ok: true;
      questions: PracticeQuestion[];
      available: number;
      minutes: number;
      negative: number;
    }
  | {
      ok: false;
      error: "auth" | "forbidden" | "no_questions" | "failed";
      message?: string;
    };

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function clampNegative(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0.25;
  return Math.round(Math.min(1, Math.max(0, parsed)) * 100) / 100;
}

export async function startPracticeAction(
  input: StartPracticeInput,
): Promise<StartPracticeResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "auth" };

  const entitlement = await getEntitlement(user.id);
  if (entitlement.status === "unavailable") {
    return { ok: false, error: "forbidden" };
  }

  const subject =
    typeof input.subject === "string" && input.subject.trim()
      ? input.subject.trim()
      : "all";
  const filters = sanitizeFilters(input.filters);
  const count = clampInt(input.count, 1, MAX_PRACTICE_QUESTIONS, 20);
  const minutes = clampInt(input.minutes, 1, MAX_PRACTICE_MINUTES, 15);
  const negative = clampNegative(input.negative);

  try {
    const { questions, available } = await samplePracticeQuestions({
      subject,
      filters,
      allowedSubjectSlugs: entitlement.access.subjects,
      allowedDatabaseCodes: entitlement.access.databaseCodes,
      count,
    });

    if (questions.length === 0) {
      return { ok: false, error: "no_questions" };
    }

    return { ok: true, questions, available, minutes, negative };
  } catch (error) {
    if (error instanceof Error && error.message) {
      return { ok: false, error: "failed", message: error.message };
    }

    return { ok: false, error: "failed" };
  }
}
