import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/**
 * Server-only Supabase client using the service role key.
 *
 * Never import this module from a Client Component. Use it only for
 * server-side operations that need to bypass RLS, such as admin aggregates.
 */
export function createSupabaseAdminClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"]?.trim();
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Admin data is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
