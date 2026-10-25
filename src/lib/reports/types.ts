export type ReportType =
  | "wrong_answer"
  | "mcq_option_error"
  | "question_typo"
  | "explanation_error"
  | "katex_math_error"
  | "broken_image"
  | "other";

export type QuestionReport = {
  id: string;
  question_id: string;
  user_id: string | null;
  report_type: ReportType;
  message: string;
  status: string;
  created_at: string;
};

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  wrong_answer: "ভুল উত্তর দেওয়া হয়েছে",
  mcq_option_error: "MCQ অপশন ভুল",
  question_typo: "প্রশ্নে বানান বা তথ্যের ভুল",
  explanation_error: "ব্যাখ্যা বা সমাধানে ভুল",
  katex_math_error: "ম্যাথমেটিক্যাল সমীকরণ বা KaTeX সমস্যা",
  broken_image: "ছবি বা ডায়াগ্রাম লোড হচ্ছে না",
  other: "অন্যান্য সমস্যা",
};

export const REPORT_TYPE_LABELS_EN: Record<ReportType, string> = {
  wrong_answer: "Wrong answer given",
  mcq_option_error: "MCQ option is wrong",
  question_typo: "Typo or factual error in question",
  explanation_error: "Error in explanation or solution",
  katex_math_error: "Math equation or KaTeX issue",
  broken_image: "Image or diagram is not loading",
  other: "Other issue",
};
