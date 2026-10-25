import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_HOME_SLIDE_URLS,
  HOME_SLIDE_LIMIT,
  isSafeSlideUrl,
} from "./types";

const HOME_SLIDES_KEY = "home_slides";

function normalizeSavedSlides(value: unknown): string[] {
  const rawSlides = Array.isArray(value)
    ? value
    : value && typeof value === "object" && "slides" in value
      ? (value as { slides?: unknown }).slides
      : [];

  if (!Array.isArray(rawSlides)) return [];

  return rawSlides
    .filter((slide): slide is string => typeof slide === "string")
    .map((slide) => slide.trim())
    .filter(isSafeSlideUrl)
    .slice(0, HOME_SLIDE_LIMIT);
}

export async function getSavedHomeSlideUrls(): Promise<string[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", HOME_SLIDES_KEY)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return normalizeSavedSlides(data?.value);
  } catch {
    return [];
  }
}

export async function getHomeSlideUrls(): Promise<string[]> {
  const saved = await getSavedHomeSlideUrls();

  if (saved.length > 0) return saved;

  return [...DEFAULT_HOME_SLIDE_URLS];
}

export async function saveHomeSlideUrls(urls: string[]): Promise<void> {
  const cleaned = urls
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, HOME_SLIDE_LIMIT);

  cleaned.forEach((url, index) => {
    if (!isSafeSlideUrl(url)) {
      throw new Error(
        `Slide ${index + 1} has an invalid image link. Use an https:// link or a path starting with /.`,
      );
    }
  });

  const supabase = createSupabaseAdminClient();
  const value = { slides: cleaned };

  const { data: existing, error: lookupError } = await supabase
    .from("settings")
    .select("id")
    .eq("key", HOME_SLIDES_KEY)
    .limit(1)
    .maybeSingle();

  if (lookupError) throw lookupError;

  if (existing) {
    const { error } = await supabase
      .from("settings")
      .update({ value })
      .eq("id", existing.id);

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("settings").insert({
    key: HOME_SLIDES_KEY,
    value,
  });

  if (error) throw error;
}
