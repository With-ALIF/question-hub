"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "./config";
import type { Database } from "./types";

let browserClient: SupabaseClient<Database> | undefined;

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and a publishable/anon key to .env.local.",
    );
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(config.url, config.anonKey);
  }

  return browserClient;
}
