"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { LANGUAGE_COOKIE, type Language } from "./config";
import { createTranslator, type Translator } from "./translator";

type LanguageContextValue = Translator & {
  setLanguage: (language: Language) => void;
  isSwitching: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: Language;
  children: ReactNode;
}) {
  const router = useRouter();
  const [lang, setLang] = useState<Language>(initialLanguage);
  const [isSwitching, startTransition] = useTransition();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLanguage = useCallback(
    (next: Language) => {
      if (next === lang) return;
      setLang(next);
      const secure = window.location.protocol === "https:" ? "; secure" : "";
      document.cookie = `${LANGUAGE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax${secure}`;
      startTransition(() => {
        router.refresh();
      });
    },
    [lang, router],
  );

  const translator = useMemo(() => createTranslator(lang), [lang]);
  const value = useMemo<LanguageContextValue>(
    () => ({ ...translator, setLanguage, isSwitching }),
    [translator, setLanguage, isSwitching],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useI18n must be used inside <LanguageProvider>.");
  }
  return context;
}
