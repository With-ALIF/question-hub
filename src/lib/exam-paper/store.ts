import type { QuestionListItem } from "@/components/questions/QuestionCard";
import type { ExamQuestionItem } from "./types";

const EXAM_PAPER_STORAGE_KEY = "qb_exam_paper_questions_v1";
export const EXAM_PAPER_EVENT = "qb:exam_questions_updated";

export function getExamQuestions(): ExamQuestionItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EXAM_PAPER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read exam paper questions:", error);
    return [];
  }
}

export function isQuestionInExam(id: string): boolean {
  if (typeof window === "undefined" || !id) return false;
  return getExamQuestions().some((item) => item.id === id);
}

export function addExamQuestion(question: QuestionListItem): void {
  if (typeof window === "undefined" || !question?.id) return;
  const list = getExamQuestions();
  if (list.some((item) => item.id === question.id)) return;

  const item: ExamQuestionItem = {
    ...question,
    addedAt: Date.now(),
  };

  const updated = [...list, item];
  try {
    localStorage.setItem(EXAM_PAPER_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent(EXAM_PAPER_EVENT, { detail: { id: question.id, count: updated.length } })
    );
  } catch (error) {
    console.error("Failed to save exam question:", error);
  }
}

export function addManyExamQuestions(questions: QuestionListItem[]): void {
  if (typeof window === "undefined" || !questions.length) return;
  const list = getExamQuestions();
  const existingMap = new Set(list.map((q) => q.id));
  const newItems: ExamQuestionItem[] = [];

  for (const q of questions) {
    if (!existingMap.has(q.id)) {
      existingMap.add(q.id);
      newItems.push({ ...q, addedAt: Date.now() });
    }
  }

  if (newItems.length === 0) return;
  const updated = [...list, ...newItems];

  try {
    localStorage.setItem(EXAM_PAPER_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent(EXAM_PAPER_EVENT, { detail: { count: updated.length } })
    );
  } catch (error) {
    console.error("Failed to save exam questions:", error);
  }
}

export function removeExamQuestion(id: string): void {
  if (typeof window === "undefined" || !id) return;
  const list = getExamQuestions();
  const updated = list.filter((item) => item.id !== id);
  try {
    localStorage.setItem(EXAM_PAPER_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent(EXAM_PAPER_EVENT, { detail: { id, count: updated.length } })
    );
  } catch (error) {
    console.error("Failed to remove exam question:", error);
  }
}

export function toggleExamQuestion(question: QuestionListItem): boolean {
  if (isQuestionInExam(question.id)) {
    removeExamQuestion(question.id);
    return false;
  } else {
    addExamQuestion(question);
    return true;
  }
}

export function clearAllExamQuestions(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(EXAM_PAPER_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent(EXAM_PAPER_EVENT, { detail: { cleared: true, count: 0 } })
    );
  } catch (error) {
    console.error("Failed to clear exam questions:", error);
  }
}
