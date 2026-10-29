"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

import type { SavedSlotResult } from "./types";

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function int(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : fallback;
}

function nullableInt(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : null;
}

function normalize(value: Json): SavedSlotResult {
  const raw = record(value);

  if (!raw) {
    return { ok: false, used: 0, limit: 0, remaining: 0, error: "failed" };
  }

  if (raw["ok"] !== true) {
    return {
      ok: false,
      used: int(raw["used"]),
      limit: nullableInt(raw["limit"]),
      remaining: nullableInt(raw["remaining"]),
      error: raw["error"] === "limit_reached" ? "limit_reached" : "failed",
    };
  }

  return {
    ok: true,
    alreadySaved: raw["already_saved"] === true,
    used: int(raw["used"]),
    limit: nullableInt(raw["limit"]),
    remaining: nullableInt(raw["remaining"]),
  };
}

/** Claims a server-side saved-question slot before the browser stores the item. */
export async function claimSavedQuestionSlotAction(
  questionId: string,
  subject?: string,
): Promise<SavedSlotResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, used: 0, limit: 0, remaining: 0, error: "auth" };
  }

  const cleanId = String(questionId ?? "").trim();

  if (!cleanId) {
    return { ok: false, used: 0, limit: 0, remaining: 0, error: "invalid_input" };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("qb_claim_saved_question", {
      p_user_id: user.id,
      p_question_id: cleanId,
      p_subject: String(subject ?? "other").trim() || "other",
    });

    if (error) {
      return { ok: false, used: 0, limit: 0, remaining: 0, error: "failed" };
    }

    return normalize(data ?? null);
  } catch {
    return { ok: false, used: 0, limit: 0, remaining: 0, error: "failed" };
  }
}

/** Releases a saved-question slot when a user removes a bookmark. */
export async function releaseSavedQuestionSlotAction(
  questionId: string,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();

  if (!user || !questionId) {
    return { ok: false };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.rpc("qb_release_saved_question", {
      p_user_id: user.id,
      p_question_id: questionId,
    });

    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

/**
 * Best-effort migration of browser-only bookmarks into the server limit table.
 * Existing bookmarks above the current limit stay visible locally, but new
 * saves are refused until the user removes enough of them.
 */
export async function syncSavedQuestionSlotsAction(
  items: { id: string; subject?: string | null }[],
): Promise<{ ok: boolean; limit: number | null; used: number }> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, limit: 0, used: 0 };
  }

  try {
    const supabase = createSupabaseAdminClient();
    let lastLimit: number | null = null;
    let lastUsed = 0;

    for (const item of items.slice(0, 500)) {
      const id = String(item.id ?? "").trim();
      if (!id) continue;

      const { data } = await supabase.rpc("qb_claim_saved_question", {
        p_user_id: user.id,
        p_question_id: id,
        p_subject: String(item.subject ?? "other").trim() || "other",
      });

      const raw = record(data);
      if (raw) {
        lastLimit = nullableInt(raw["limit"]);
        lastUsed = int(raw["used"]);
      }
    }

    return { ok: true, limit: lastLimit, used: lastUsed };
  } catch {
    return { ok: false, limit: 0, used: 0 };
  }
}
