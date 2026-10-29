import "server-only";

import { cache } from "react";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

import type { Entitlement, EntitlementStatus, UsageFeature } from "./types";

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown, fallback: string | null = null): string | null {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function bool(value: unknown): boolean {
  return value === true;
}

function int(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : fallback;
}

function nullableInt(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : null;
}

function stringArray(value: unknown): string[] | null {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value)) return null;

  const values = value.filter((item): item is string => typeof item === "string");
  return Array.from(new Set(values));
}

function statusOf(value: unknown): EntitlementStatus {
  return value === "active" ||
    value === "expired" ||
    value === "cancelled" ||
    value === "none" ||
    value === "unavailable"
    ? value
    : "unavailable";
}

export function unavailableEntitlement(message?: string): Entitlement {
  return {
    status: "unavailable",
    paidAccess: false,
    audience: "student",
    serverTime: new Date().toISOString(),
    usageDate: new Date().toISOString().slice(0, 10),
    planId: null,
    planName: null,
    lastPlanId: null,
    lastPlanName: null,
    subscriptionId: null,
    subscriptionStatus: null,
    startsAt: null,
    expiresAt: null,
    remainingDays: null,
    limits: { dailyMcq: 0, dailyModelTest: 0, totalModelTest: 0, savedQuestions: 0, examPapers: 0 },
    features: { allowAnswer: false, allowExplanation: false },
    access: { subjects: [], chapters: [], databases: [], allowedDatabases: [], databaseCodes: [] },
    usage: { mcq: 0, modelTest: 0, modelTestTotal: 0, savedQuestions: 0, examPapers: 0 },
    remaining: { mcq: 0, modelTest: 0, modelTestTotal: 0, savedQuestions: 0, examPapers: 0 },
    subjectSelectionLimit: 0,
    databaseSelectionLimit: 0,
    source: null,
    isCustom: false,
    ...(message ? { error: message } : {}),
  };
}

function normalize(value: Json): Entitlement {
  const raw = record(value);

  if (!raw) {
    return unavailableEntitlement("Entitlement response was empty.");
  }

  const status = statusOf(raw["status"]);

  if (status === "unavailable") {
    return unavailableEntitlement("Entitlement response had an unknown status.");
  }

  const planId = text(raw["planId"]);
  const lastPlanId = text(raw["lastPlanId"]);
  const rawAudience = text(raw["audience"]);
  const audience: "student" | "teacher" =
    rawAudience === "teacher" ||
    planId?.startsWith("teacher") ||
    lastPlanId?.startsWith("teacher")
      ? "teacher"
      : "student";

  return {
    status,
    paidAccess: bool(raw["paidAccess"]),
    audience,
    serverTime: text(raw["serverTime"]) ?? new Date().toISOString(),
    usageDate: text(raw["usageDate"]) ?? new Date().toISOString().slice(0, 10),
    planId,
    planName: text(raw["planName"]),
    lastPlanId,
    lastPlanName: text(raw["lastPlanName"]),
    subscriptionId: text(raw["subscriptionId"]),
    subscriptionStatus: text(raw["subscriptionStatus"]),
    startsAt: text(raw["startsAt"]),
    expiresAt: text(raw["expiresAt"]),
    remainingDays: nullableInt(raw["remainingDays"]),
    limits: {
      dailyMcq: nullableInt(raw["dailyMcqLimit"]),
      dailyModelTest: nullableInt(raw["dailyModelTestLimit"]),
      totalModelTest: nullableInt(raw["totalModelTestLimit"]),
      savedQuestions: nullableInt(raw["savedQuestionsLimit"]),
      examPapers: nullableInt(raw["examPaperLimit"]),
    },
    features: {
      allowAnswer: bool(raw["allowAnswer"]),
      allowExplanation: bool(raw["allowExplanation"]),
    },
    access: {
      subjects: stringArray(raw["allowedSubjects"]),
      chapters: stringArray(raw["allowedChapters"]),
      databases: stringArray(raw["selectedDatabases"]),
      allowedDatabases: stringArray(raw["allowedDatabases"]),
      databaseCodes: stringArray(raw["allowedDatabaseCodes"]),
    },
    usage: {
      mcq: int(raw["usageMcq"]),
      modelTest: int(raw["usageModelTest"]),
      modelTestTotal: int(raw["modelTestsUsed"]),
      savedQuestions: int(raw["savedQuestionsUsed"]),
      examPapers: int(raw["examPapersUsed"]),
    },
    remaining: {
      mcq: nullableInt(raw["remainingMcq"]),
      modelTest: nullableInt(raw["remainingModelTest"]),
      modelTestTotal: nullableInt(raw["remainingTotalModelTest"]),
      savedQuestions: nullableInt(raw["remainingSavedQuestions"]),
      examPapers: nullableInt(raw["remainingExamPapers"]),
    },
    subjectSelectionLimit: int(raw["subjectSelectionLimit"]),
    databaseSelectionLimit: int(raw["databaseSelectionLimit"]),
    source: text(raw["source"]),
    isCustom: bool(raw["isCustom"]),
  };
}

/**
 * Resolves the current entitlement on the server. The SQL function uses the
 * database clock and treats an active-but-expired row as expired. A failure
 * always fails closed: no paid features and no question access.
 */
export const getEntitlement = cache(async (userId: string): Promise<Entitlement> => {
  if (!userId) {
    return unavailableEntitlement("No user id supplied.");
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("qb_get_entitlement", {
      p_user_id: userId,
    });

    if (error) {
      return unavailableEntitlement(error.message);
    }

    return normalize(data ?? null);
  } catch (error) {
    return unavailableEntitlement(
      error instanceof Error ? error.message : "Entitlement lookup failed.",
    );
  }
});

export function canAccessSubject(entitlement: Entitlement, subjectSlug: string): boolean {
  if (!subjectSlug) return false;
  if (entitlement.status === "unavailable") return false;
  if (entitlement.access.subjects === null) return true;
  return entitlement.access.subjects.includes(subjectSlug);
}

export function canAccessDatabase(
  entitlement: Entitlement,
  sourceDb: string | null | undefined,
): boolean {
  if (entitlement.status === "unavailable") return false;
  if (entitlement.access.databaseCodes === null) return true;
  if (!sourceDb) return false;
  return entitlement.access.databaseCodes.includes(sourceDb);
}

export function canAccessChapter(
  entitlement: Entitlement,
  chapterCode: string | null | undefined,
): boolean {
  if (entitlement.status === "unavailable") return false;
  if (entitlement.access.chapters === null) return true;
  if (!chapterCode) return false;
  return entitlement.access.chapters.includes(chapterCode);
}

export function usageLimitLabel(limit: number | null): string {
  return limit === null ? "Unlimited" : String(limit);
}

export function usageFeatureLabel(feature: UsageFeature): string {
  return feature === "mcq" ? "MCQ practice" : "Model tests";
}
