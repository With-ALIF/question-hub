export const HOME_SLIDE_LIMIT = 3;

export const DEFAULT_HOME_SLIDE_URLS = [
  "/slider/slide-1.svg",
  "/slider/slide-2.svg",
  "/slider/slide-3.svg",
] as const;

export function isSafeSlideUrl(value: string) {
  const url = value.trim();

  if (!url) return false;
  if (url.startsWith("/") && !url.startsWith("//")) return true;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
