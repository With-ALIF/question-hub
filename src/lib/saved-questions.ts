import type { QuestionListItem } from "@/components/questions/QuestionCard";

const SAVED_QUESTIONS_STORAGE_KEY = "qb_saved_questions_v1";
export const SAVED_QUESTIONS_EVENT = "qb:saved_questions_updated";

export type SavedQuestionItem = QuestionListItem & {
  savedAt: number;
};

export function getSavedQuestions(): SavedQuestionItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_QUESTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error("Failed to read saved questions:", error);
    return [];
  }
}

export function isQuestionSaved(id: string): boolean {
  if (typeof window === "undefined" || !id) return false;
  const list = getSavedQuestions();
  return list.some((item) => item.id === id);
}

export function saveQuestion(question: QuestionListItem): void {
  if (typeof window === "undefined" || !question?.id) return;
  const list = getSavedQuestions();
  if (list.some((item) => item.id === question.id)) return;

  const item: SavedQuestionItem = {
    ...question,
    savedAt: Date.now(),
  };

  const updated = [item, ...list];
  try {
    localStorage.setItem(SAVED_QUESTIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(SAVED_QUESTIONS_EVENT, { detail: { id: question.id, saved: true } }));
  } catch (error) {
    console.error("Failed to save question:", error);
  }
}

export function removeSavedQuestion(id: string): void {
  if (typeof window === "undefined" || !id) return;
  const list = getSavedQuestions();
  const updated = list.filter((item) => item.id !== id);
  try {
    localStorage.setItem(SAVED_QUESTIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(SAVED_QUESTIONS_EVENT, { detail: { id, saved: false } }));
  } catch (error) {
    console.error("Failed to remove saved question:", error);
  }
}

export function toggleSaveQuestion(question: QuestionListItem): boolean {
  if (isQuestionSaved(question.id)) {
    removeSavedQuestion(question.id);
    return false;
  } else {
    saveQuestion(question);
    return true;
  }
}

export function clearAllSavedQuestions(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SAVED_QUESTIONS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(SAVED_QUESTIONS_EVENT, { detail: { cleared: true } }));
  } catch (error) {
    console.error("Failed to clear saved questions:", error);
  }
}
