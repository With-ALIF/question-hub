"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { readAdminRole } from "./roles";
import type { AuthState } from "./state";

const NOT_CONFIGURED_MESSAGE =
  "Authentication is not configured yet. Add your Supabase URL and publishable/anon key to .env.local.";

function readField(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

async function getRequestOrigin(): Promise<string | null> {
  const configuredOrigin = process.env["NEXT_PUBLIC_SITE_URL"]?.trim();

  if (configuredOrigin) {
    return configuredOrigin.replace(/\/+$/, "");
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin.replace(/\/+$/, "");
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (!host) {
    return null;
  }

  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export async function signInAction(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = readField(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { status: "error", message: "Enter your email and password." };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: NOT_CONFIGURED_MESSAGE };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { status: "error", message: error.message };
    }
  } catch {
    return {
      status: "error",
      message: "Unable to sign in right now. Please try again.",
    };
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const fullName = readField(formData, "name");
  const email = readField(formData, "email");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!fullName || !email || !password || !confirmPassword) {
    return { status: "error", message: "Fill in every field to create your account." };
  }

  if (password.length < 8) {
    return { status: "error", message: "Your password must be at least 8 characters long." };
  }

  if (password !== confirmPassword) {
    return { status: "error", message: "Passwords do not match." };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: NOT_CONFIGURED_MESSAGE };
  }

  try {
    const origin = await getRequestOrigin();
    const supabase = await createSupabaseServerClient();
    const options: { data: { full_name: string }; emailRedirectTo?: string } = {
      data: { full_name: fullName },
    };

    if (origin) {
      options.emailRedirectTo = `${origin}/auth/callback`;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      return { status: "error", message: error.message };
    }

    if (!data.session) {
      return {
        status: "success",
        message: "Check your email to confirm your account, then log in.",
      };
    }
  } catch {
    return {
      status: "error",
      message: "Unable to create your account right now. Please try again.",
    };
  }

  redirect("/dashboard");
}

/**
 * Signs in an admin and lands them on the dashboard.
 *
 * Unlike `signInAction`, a successful password check is not enough: the role is
 * re-read from `qb_profiles` and non-admins are signed straight back out, so a
 * regular account can never leave a usable admin session behind.
 */
export async function adminSignInAction(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = readField(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { status: "error", message: "Enter your email and password." };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: NOT_CONFIGURED_MESSAGE };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return { status: "error", message: error?.message ?? "Invalid email or password." };
    }

    const role = await readAdminRole(data.user.id);

    if (!role) {
      await supabase.auth.signOut();
      return {
        status: "error",
        message: "This account does not have admin access.",
      };
    }
  } catch {
    return {
      status: "error",
      message: "Unable to sign in right now. Please try again.",
    };
  }

  redirect("/admin/dashboard");
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // Clear the local session by returning to the public home page below.
    }
  }

  redirect("/");
}

/**
 * Signs out and returns the admin to the sign-in screen rather than the public
 * home page, so ending a session from the dashboard lands somewhere usable.
 */
export async function adminSignOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // Clear the local session by returning to the login screen below.
    }
  }

  redirect("/admin/login");
}
