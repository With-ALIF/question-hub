import "server-only";

import { getCurrentRole } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { AdminTicket, TicketRow } from "./types";

/** Newest 100 tickets belonging to the signed-in account (RLS-scoped read). */
export async function getMyTickets(): Promise<TicketRow[]> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return [];
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("qb_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    return error ? [] : (data ?? []);
  } catch {
    return [];
  }
}

/** Admin queue: newest 300 tickets with the requester's name and email. */
export async function getAdminTickets(): Promise<AdminTicket[]> {
  try {
    const role = await getCurrentRole();

    if (!role) {
      return [];
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("qb_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error || !data || data.length === 0) {
      return [];
    }

    const userIds = Array.from(new Set(data.map((ticket) => ticket.user_id)));
    const { data: profiles } = await supabase
      .from("qb_profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

    return data.map((ticket) => {
      const profile = profileById.get(ticket.user_id);

      return {
        ...ticket,
        userEmail: profile?.email ?? null,
        userName: profile?.full_name ?? null,
      };
    });
  } catch (err) {
    console.error("Failed to fetch admin support tickets:", err);
    return [];
  }
}
