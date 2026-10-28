import { NextResponse, type NextRequest } from "next/server";

import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

function safeRedirectPath(value: string | null): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/dashboard";
  }

  return value;
}

function readCookieNext(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const cookieNext = readCookieNext(request.cookies.get("qb_next")?.value);
  const next = safeRedirectPath(searchParams.get("next") ?? cookieNext);

  const isLocal = origin.includes("localhost") || origin.includes("127.0.0.1");
  const baseUrl = isLocal ? origin : "https://question-hub-bd.vercel.app";

  if (code && isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        const response = NextResponse.redirect(new URL(next, baseUrl));
        response.cookies.set("qb_next", "", { path: "/", maxAge: 0 });
        return response;
      }
    } catch {
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=auth_callback_failed", baseUrl),
  );
}
