const EXAM_PAPER_SETTINGS_KEY = "qb_exam_paper_settings_v1";

/**
 * Everything the "Build exam paper" dialog remembers between visits.
 * Only values the user actually changed are stored, so defaults stay dynamic.
 */
export type ExamPaperSettings = {
  title?: string;
  tutorName?: string;
  subtitle?: string;
  marks?: string;
  time?: string;
  hasFourSets?: boolean;
  withAnswers?: boolean;
  questionSize?: number;
  headerSize?: number;
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkImageUrl?: string;
  watermarkImageName?: string;
  savedAt: number;
};

export function getExamPaperSettings(): ExamPaperSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EXAM_PAPER_SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as ExamPaperSettings;
  } catch (error) {
    console.error("Failed to read exam paper settings:", error);
    return null;
  }
}

export function saveExamPaperSettings(settings: ExamPaperSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EXAM_PAPER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    // Watermark images can be large enough to exceed the storage quota.
    // Keep the text settings and drop only the image.
    try {
      localStorage.setItem(
        EXAM_PAPER_SETTINGS_KEY,
        JSON.stringify({ ...settings, watermarkImageUrl: undefined, watermarkImageName: undefined }),
      );
    } catch {
      console.error("Failed to save exam paper settings:", error);
    }
  }
}

export function clearExamPaperSettings(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(EXAM_PAPER_SETTINGS_KEY);
  } catch (error) {
    console.error("Failed to clear exam paper settings:", error);
  }
}
