"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { getCurrentRole } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { sendTicketReplyEmail } from "./email";
import {
  isLockedTicketStatus,
  isTicketStatus,
  type AdminTicketErrorCode,
  type ReplyTicketResult,
  type TicketCategory,
  type TicketStatus,
} from "./types";

const REPLY_MAX = 4000;

/**
 * A resolved ticket is sealed: the answer that solved it is the last word, so
 * no edit or reopen is accepted anywhere.
 */
async function guardEditableTicket(
  ticketId: string,
): Promise<{ ok: true } | { ok: false; error: AdminTicketErrorCode }> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("qb_tickets")
    .select("status")
    .eq("id", ticketId)
    .maybeSingle();

  if (error) {
    console.error("Failed to read support ticket:", error.message);
    return { ok: false, error: "failed" };
  }

  if (!data) {
    return { ok: false, error: "not_found" };
  }

  if (isLockedTicketStatus(data.status)) {
    return { ok: false, error: "locked" };
  }

  return { ok: true };
}

function revalidateTicketViews() {
  revalidatePath("/admin/support");
  revalidatePath("/support");
}

type TicketReplyTarget = {
  user_id: string;
  ticket_code: string;
  category: TicketCategory;
  message: string;
  status: TicketStatus;
};

async function emailRequester(ticket: TicketReplyTarget, reply: string): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: profile } = await supabase
      .from("qb_profiles")
      .select("email, full_name")
      .eq("id", ticket.user_id)
      .maybeSingle();

    const toEmail = profile?.email?.trim();

    if (!toEmail) {
      return;
    }

    await sendTicketReplyEmail({
      toEmail,
      customerName: profile?.full_name ?? null,
      ticketCode: ticket.ticket_code,
      category: ticket.category,
      status: ticket.status,
      reply,
      originalMessage: ticket.message,
    });
  } catch (err) {
    console.error("Failed to email ticket reply to requester:", err);
  }
}

/** Save the admin's answer and move the ticket to the chosen status. */
export async function replyTicketAction(input: {
  ticketId: string;
  reply: string;
  status: string;
}): Promise<ReplyTicketResult> {
  const [role, admin] = await Promise.all([getCurrentRole(), getCurrentUser()]);

  if (!role || !admin) {
    return { ok: false, error: "forbidden" };
  }

  const ticketId = String(input?.ticketId ?? "").trim();
  const reply = String(input?.reply ?? "").trim().slice(0, REPLY_MAX);
  const status = input?.status;

  if (!ticketId || !reply || !isTicketStatus(status)) {
    return { ok: false, error: "invalid_input" };
  }

  const guard = await guardEditableTicket(ticketId);

  if (!guard.ok) {
    return guard;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("qb_tickets")
      .update({
        admin_reply: reply,
        replied_by: admin.id,
        replied_at: new Date().toISOString(),
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketId)
      .select("id, user_id, ticket_code, category, message, status")
      .maybeSingle();

    if (error) {
      console.error("Failed to reply to support ticket:", error.message);
      return { ok: false, error: "failed" };
    }

    if (!data) {
      return { ok: false, error: "not_found" };
    }

    after(async () => {
      await emailRequester(data, reply);
    });

    revalidateTicketViews();
    return { ok: true };
  } catch (err) {
    console.error("Failed to reply to support ticket:", err);
    return { ok: false, error: "failed" };
  }
}

/** Quick status change for tickets that need no written answer yet. */
export async function updateTicketStatusAction(
  ticketId: string,
  status: TicketStatus,
): Promise<ReplyTicketResult> {
  const role = await getCurrentRole();

  if (!role) {
    return { ok: false, error: "forbidden" };
  }

  const id = String(ticketId ?? "").trim();

  if (!id || !isTicketStatus(status)) {
    return { ok: false, error: "invalid_input" };
  }

  const guard = await guardEditableTicket(id);

  if (!guard.ok) {
    return guard;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("qb_tickets")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Failed to update support ticket status:", error.message);
      return { ok: false, error: "failed" };
    }

    if (!data) {
      return { ok: false, error: "not_found" };
    }

    revalidateTicketViews();
    return { ok: true };
  } catch (err) {
    console.error("Failed to update support ticket status:", err);
    return { ok: false, error: "failed" };
  }
}
