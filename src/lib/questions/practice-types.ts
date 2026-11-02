import type { QuestionOption } from "@/lib/supabase/types";

export const MAX_PRACTICE_QUESTIONS = 50;
export const MAX_PRACTICE_MINUTES = 180;

export type PracticeQuestion = {
  id: string;
  question_text: string;
  question_html: string | null;
  options: QuestionOption[];
  correct_option: number | null;
  answer: string | null;
  explanation: string | null;
  explanation_html: string | null;
  topic_code: string | null;
  source_db: string | null;
  subject: string;
};
