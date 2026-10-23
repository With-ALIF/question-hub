import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseConfig, isSupabaseConfigured } from "./config";
import type { Database } from "./types";

export { isSupabaseConfigured };


export async function createSupabaseServerClient() {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and a publishable/anon key to .env.local.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. The root proxy refreshes
          // the session and writes the updated cookies on the response instead.
        }
      },
    },
  });
}
