"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { getI18n } from "@/lib/i18n/server";
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
  const { tr } = await getI18n();
  const email = readField(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      status: "error",
      message: tr("Enter your email and password.", "আপনার ইমেইল ও পাসওয়ার্ড দিন।"),
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: tr(
        NOT_CONFIGURED_MESSAGE,
        "অথেন্টিকেশন এখনো কনফিগার করা হয়নি। .env.local-এ আপনার Supabase URL ও publishable/anon key যোগ করুন।",
      ),
    };
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
      message: tr(
        "Unable to sign in right now. Please try again.",
        "এই মুহূর্তে লগইন করা যাচ্ছে না। আবার চেষ্টা করুন।",
      ),
    };
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { tr } = await getI18n();
  const fullName = readField(formData, "name");
  const email = readField(formData, "email");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!fullName || !email || !password || !confirmPassword) {
    return {
      status: "error",
      message: tr(
        "Fill in every field to create your account.",
        "অ্যাকাউন্ট তৈরি করতে সব ঘর পূরণ করুন।",
      ),
    };
  }

  if (password.length < 8) {
    return {
      status: "error",
      message: tr(
        "Your password must be at least 8 characters long.",
        "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।",
      ),
    };
  }

  if (password !== confirmPassword) {
    return {
      status: "error",
      message: tr("Passwords do not match.", "পাসওয়ার্ড দুটি মিলছে না।"),
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: tr(
        NOT_CONFIGURED_MESSAGE,
        "অথেন্টিকেশন এখনো কনফিগার করা হয়নি। .env.local-এ আপনার Supabase URL ও publishable/anon key যোগ করুন।",
      ),
    };
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
        message: tr(
          "Check your email to confirm your account, then log in.",
          "অ্যাকাউন্ট নিশ্চিত করতে ইমেইল চেক করুন, তারপর লগইন করুন।",
        ),
      };
    }
  } catch {
    return {
      status: "error",
      message: tr(
        "Unable to create your account right now. Please try again.",
        "এই মুহূর্তে অ্যাকাউন্ট তৈরি করা যাচ্ছে না। আবার চেষ্টা করুন।",
      ),
    };
  }

  redirect("/dashboard");
}

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
    }
  }

  redirect("/");
}

export async function adminSignOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
    }
  }

  redirect("/admin/login");
}
