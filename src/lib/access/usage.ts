import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

import type { ConsumeExamPaperResult, ConsumeUsageResult, UsageFeature } from "./types";

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function int(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : fallback;
}

function nullableInt(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : null;
}

function normalize(value: Json): ConsumeUsageResult {
  const raw = record(value);

  if (!raw) {
    return {
      ok: false,
      allowed: [],
      used: 0,
      limit: 0,
      remaining: 0,
      blocked: 0,
      usageDate: null,
      error: "Usage response was empty.",
    };
  }

  return {
    ok: raw["ok"] === true,
    allowed: stringArray(raw["allowed"]),
    used: int(raw["used"]),
    limit: nullableInt(raw["limit"]),
    remaining: nullableInt(raw["remaining"]),
    totalLimit: nullableInt(raw["totalLimit"]),
    totalUsed: int(raw["totalUsed"]),
    totalRemaining: nullableInt(raw["totalRemaining"]),
    blocked: int(raw["blocked"]),
    usageDate: typeof raw["usageDate"] === "string" ? raw["usageDate"] : null,
  };
}

/**
 * Atomically consumes daily usage for the signed-in user. The SQL function
 * takes an advisory lock per user/feature/day and relies on a unique event key,
 * so concurrent requests cannot bypass the limit and retries do not consume
 * quota twice.
 */
export async function consumeUsage(
  userId: string,
  feature: UsageFeature,
  eventKeys: string[],
): Promise<ConsumeUsageResult> {
  if (!userId) {
    return {
      ok: false,
      allowed: [],
      used: 0,
      limit: 0,
      remaining: 0,
      blocked: eventKeys.length,
      usageDate: null,
      error: "not_authorized",
    };
  }

  const keys = Array.from(
    new Set(
      eventKeys
        .filter((key): key is string => typeof key === "string")
        .map((key) => key.trim())
        .filter(Boolean),
    ),
  );

  if (keys.length === 0) {
    return {
      ok: true,
      allowed: [],
      used: 0,
      limit: null,
      remaining: null,
      blocked: 0,
      usageDate: null,
    };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("qb_consume_usage", {
      p_user_id: userId,
      p_feature: feature,
      p_event_keys: keys,
    });

    if (error) {
      return {
        ok: false,
        allowed: [],
        used: 0,
        limit: 0,
        remaining: 0,
        blocked: keys.length,
        usageDate: null,
        error: error.message,
      };
    }

    return normalize(data ?? null);
  } catch (error) {
    return {
      ok: false,
      allowed: [],
      used: 0,
      limit: 0,
      remaining: 0,
      blocked: keys.length,
      usageDate: null,
      error: error instanceof Error ? error.message : "Usage lookup failed.",
    };
  }
}

/**
 * Consumes one lifetime exam-paper slot. The event key makes retries and
 * repeated prints of the same paper idempotent.
 */
export async function consumeExamPaper(
  userId: string,
  eventKey: string,
): Promise<ConsumeExamPaperResult> {
  const key = String(eventKey ?? "").trim();

  if (!userId || !key) {
    return {
      ok: false,
      used: 0,
      limit: 0,
      remaining: 0,
      error: "invalid_input",
    };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("qb_consume_exam_paper", {
      p_user_id: userId,
      p_event_key: key,
    });

    if (error) {
      return { ok: false, used: 0, limit: 0, remaining: 0, error: error.message };
    }

    const raw = record(data);

    if (!raw) {
      return { ok: false, used: 0, limit: 0, remaining: 0, error: "empty_response" };
    }

    return {
      ok: raw["ok"] === true,
      alreadyCounted: raw["alreadyCounted"] === true,
      used: int(raw["used"]),
      limit: nullableInt(raw["limit"]),
      remaining: nullableInt(raw["remaining"]),
      ...(raw["reason"] === "limit_reached" ? { reason: "limit_reached" as const } : {}),
    };
  } catch (error) {
    return {
      ok: false,
      used: 0,
      limit: 0,
      remaining: 0,
      error: error instanceof Error ? error.message : "Usage lookup failed.",
    };
  }
}
