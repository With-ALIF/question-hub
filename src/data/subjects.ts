export type SubjectAccent = "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5";

export type SubjectIcon = "atom" | "flask" | "dna" | "sigma" | "monitor" | "book";

export type Subject = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  icon: SubjectIcon;
  chapters: string[];
  questionCount: number;
  accent: SubjectAccent;
};

const ACCENTS: SubjectAccent[] = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];
const ICONS: SubjectIcon[] = ["atom", "flask", "dna", "sigma", "monitor", "book"];

export const SUBJECT_PRESENTATION: Partial<
  Record<string, { icon: SubjectIcon; accent: SubjectAccent }>
> = {
  other: { icon: "book", accent: "chart-1" },
};

export function normalizeIcon(value: unknown, fallback: SubjectIcon): SubjectIcon {
  return typeof value === "string" && (ICONS as string[]).includes(value)
    ? (value as SubjectIcon)
    : fallback;
}

export function normalizeAccent(value: unknown, fallback: SubjectAccent): SubjectAccent {
  return typeof value === "string" && (ACCENTS as string[]).includes(value)
    ? (value as SubjectAccent)
    : fallback;
}
