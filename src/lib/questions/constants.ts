export const QUESTION_FILTER_KEYS = [
  "db",
  "un",
  "year",
  "paper",
  "chapter",
  "topic",
] as const;

export type QuestionFilterKey = (typeof QUESTION_FILTER_KEYS)[number];

export type QuestionFilters = Partial<Record<QuestionFilterKey, string>>;

export type QuestionFiltersInput = Partial<
  Record<QuestionFilterKey, string | string[] | undefined>
>;

export type QuestionFilterOption = {
  value: string;
  label: string;
  count: number;
};

export type QuestionFilterFacet = {
  all: number;
  options: QuestionFilterOption[];
};

export type QuestionFilterOptions = Record<QuestionFilterKey, QuestionFilterFacet>;

export const QUESTION_FILTER_LABELS: Record<QuestionFilterKey, string> = {
  db: "Source DB",
  un: "University / Institute",
  year: "Year",
  paper: "Subject code",
  chapter: "Chapter",
  topic: "Topic",
};

export const QUESTION_TYPES = ["all", "mcq", "written"] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  all: "All types",
  mcq: "MCQ only",
  written: "Written only",
};

export type QuestionSubject = {
  slug: string;
  name: string;
  total: number;
  mcq: number;
  written: number;
  shards: Record<QuestionType, number>;
};
