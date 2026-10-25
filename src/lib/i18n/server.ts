import "server-only";

import { cookies } from "next/headers";

import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE, isLanguage, type Language } from "./config";
import { createTranslator, type Translator } from "./translator";

export async function getLanguage(): Promise<Language> {
  const store = await cookies();
  const value = store.get(LANGUAGE_COOKIE)?.value;
  return isLanguage(value) ? value : DEFAULT_LANGUAGE;
}

export async function getI18n(): Promise<Translator> {
  return createTranslator(await getLanguage());
}
