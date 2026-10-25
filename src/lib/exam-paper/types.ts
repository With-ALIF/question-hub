import type { QuestionListItem } from "@/components/questions/QuestionCard";

export type ExamPaperConfig = {
  title: string;
  tutorName?: string | undefined;
  subtitle?: string | undefined;
  marks: string;
  time: string;
  hasFourSets: boolean;
  withAnswers: boolean;
  questionSize: number;
  headerSize: number;
  watermarkText?: string | undefined;
  watermarkOpacity: number;
  watermarkImageUrl?: string | undefined;
  footerLeft?: string | undefined;
  footerRight?: string | undefined;
};

export type ExamQuestionItem = QuestionListItem & {
  addedAt: number;
};
