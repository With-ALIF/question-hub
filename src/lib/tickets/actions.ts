"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { sendTicketNotificationTelegram } from "./notify";
import {
  TICKET_MESSAGE_MAX,
  TICKET_MESSAGE_MIN,
  isTicketCategory,
  type CreateTicketResult,
} from "./types";

export type CreateTicketInput = {
  category: string;
  message: string;
};

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_TICKETS = 5;

function makeTicketCode() {
  const token = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `TK-${token}`;
}

/**
 * Files a support ticket for the signed-in account. The category is validated
 * against the CHECK constraint's list and the body length is enforced here, so
 * a crafted request cannot store an unreadable ticket.
 */
export async function createTicketAction(
  input: CreateTicketInput,
): Promise<CreateTicketResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, error: "auth" };
  }

  const category = input?.category;

  if (!isTicketCategory(category)) {
    return { ok: false, error: "invalid_category" };
  }

  const message = String(input?.message ?? "").trim();

  if (message.length < TICKET_MESSAGE_MIN) {
    return { ok: false, error: "message_too_short" };
  }

  if (message.length > TICKET_MESSAGE_MAX) {
    return { ok: false, error: "message_too_long" };
  }

  try {
    const supabase = createSupabaseAdminClient();

    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count } = await supabase
      .from("qb_tickets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", since);

    if ((count ?? 0) >= RATE_LIMIT_MAX_TICKETS) {
      return { ok: false, error: "rate_limited" };
    }

    const { data, error } = await supabase
      .from("qb_tickets")
      .insert({
        ticket_code: makeTicketCode(),
        user_id: user.id,
        category,
        message,
        status: "open",
      })
      .select("ticket_code")
      .single();

    if (error || !data) {
      console.error("Failed to create support ticket:", error?.message);
      return { ok: false, error: "failed" };
    }

    const { ticket_code: ticketCode } = data;

    after(async () => {
      const profile = await getCurrentProfile().catch(() => null);

      await sendTicketNotificationTelegram({
        ticketCode,
        category,
        message,
        userName: profile?.full_name ?? null,
        userEmail: user.email ?? null,
      });
    });

    revalidatePath("/support");
    revalidatePath("/admin/support");

    return { ok: true, ticketCode };
  } catch (err) {
    console.error("Failed to create support ticket:", err);
    return { ok: false, error: "failed" };
  }
}
