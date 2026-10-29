import "server-only";

import { cache } from "react";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AccessDatabase = {
  slug: string;
  name: string;
  name_bn: string | null;
  description: string | null;
  source_codes: string[];
  sort_order: number;
};

/** Active database catalogue used by the plan pickers and access filters. */
export const getActiveDatabases = cache(async (): Promise<AccessDatabase[]> => {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("qb_databases")
      .select("slug, name, name_bn, description, source_codes, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    return error ? [] : (data ?? []);
  } catch {
    return [];
  }
});
