"use client";

import { useI18n } from "@/lib/i18n/client";
import { LANGUAGES, type Language } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const LABELS: Record<Language, string> = {
  bn: "বাংলা",
  en: "EN",
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLanguage, isSwitching } = useI18n();

  return (
    <div
      role="group"
      aria-label="Language / ভাষা"
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-border bg-secondary/40 p-0.5 transition-opacity",
        isSwitching && "opacity-70",
        className,
      )}
    >
      {LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLanguage(code)}
          aria-pressed={lang === code}
          title={code === "bn" ? "বাংলায় দেখুন" : "View in English"}
          className={cn(
            "cursor-pointer rounded-full px-2 py-1 text-[11px] font-semibold leading-none transition-colors",
            lang === code
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}
