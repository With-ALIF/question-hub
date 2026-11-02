import {
  Atom,
  BookOpen,
  Dna,
  FlaskConical,
  MonitorSmartphone,
  Sigma,
  type LucideIcon,
} from "lucide-react";

export type SubjectVisual = {
  icon: LucideIcon;
  accent: string;
};

export const SUBJECT_VISUALS: Record<string, SubjectVisual> = {
  physics: { icon: Atom, accent: "chart-1" },
  chemistry: { icon: FlaskConical, accent: "chart-2" },
  biology: { icon: Dna, accent: "chart-3" },
  mathematics: { icon: Sigma, accent: "chart-4" },
  ict: { icon: MonitorSmartphone, accent: "chart-5" },
  other: { icon: BookOpen, accent: "chart-1" },
};

export const DEFAULT_SUBJECT_VISUAL: SubjectVisual = {
  icon: BookOpen,
  accent: "chart-1",
};
