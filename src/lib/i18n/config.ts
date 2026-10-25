export const LANGUAGES = ["bn", "en"] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "bn";

export const LANGUAGE_COOKIE = "qb_lang";

export function isLanguage(value: unknown): value is Language {
  return value === "bn" || value === "en";
}

export function localeForLanguage(language: Language) {
  return language === "bn" ? "bn-BD" : "en-US";
}
