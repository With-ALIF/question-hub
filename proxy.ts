import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/types";

/**
 * Refreshes the Supabase session before App Router pages render.
 *
 * This proxy intentionally does not authorize or redirect routes: the current
 * dashboard/admin screens remain static UI previews. Authorization helpers live
 * in src/lib/auth/session.ts for when those screens are connected to the DB.
 */
export async function proxy(request: NextRequest) {
  const supabaseConfig = getSupabaseConfig();

  if (!supabaseConfig) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient<Database>(
      supabaseConfig.url,
      supabaseConfig.anonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet, headersToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });

            response = NextResponse.next({ request });

            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });

            Object.entries(headersToSet).forEach(([key, value]) => {
              response.headers.set(key, value);
            });
          },
        },
      },
    );

    await supabase.auth.getClaims();
  } catch {
    // A transient auth/network failure must not take the public site down.
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf)$).*)",
  ],
};
