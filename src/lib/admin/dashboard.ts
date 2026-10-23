import { getQuestionManifest } from "@/lib/questions/storage";

export type AdminStat = {
  label: string;
  value: string;
  hint: string;
};

export type AdminSubject = {
  id: string;
  slug: string;
  name: string;
  questionCount: number;
  mcqCount: number;
  writtenCount: number;
};

export type AdminRecentQuestion = {
  id: string;
  question: string;
  source: string | null;
  topic: string | null;
  year: string | null;
};

export type AdminDashboardData = {
  stats: AdminStat[];
  subjects: AdminSubject[];
  recentQuestions: AdminRecentQuestion[];
};

export type AdminDashboardResult = {
  data: AdminDashboardData;
  error: string | null;
};

const EMPTY_DATA: AdminDashboardData = {
  stats: [
    { label: "Total Questions", value: "0", hint: "No Storage shards yet" },
    { label: "Registered Users", value: "0", hint: "No profiles yet" },
    { label: "Active Subscriptions", value: "—", hint: "Not configured yet" },
    { label: "Subjects", value: "0", hint: "No subjects yet" },
  ],
  subjects: [],
  recentQuestions: [],
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) {
      return message;
    }
  }

  return "Could not load admin data.";
}

export async function getAdminDashboardData(): Promise<AdminDashboardResult> {
  try {
    const manifest = await getQuestionManifest();
    const subjects: AdminSubject[] = manifest.subjects.map((subject) => ({
      id: subject.slug,
      slug: subject.slug,
      name: subject.name,
      questionCount: subject.total,
      mcqCount: subject.mcq,
      writtenCount: subject.written,
    }));

    const coreSubjects = subjects.filter((subject) => subject.slug !== "other");
    const firstSubject = coreSubjects[0];
    const lastSubject = coreSubjects[coreSubjects.length - 1];
    const hasOther = subjects.some((subject) => subject.slug === "other");
    const subjectHint =
      firstSubject && lastSubject
        ? `${firstSubject.name} → ${lastSubject.name}${hasOther ? " + Other" : ""}`
        : "No subjects yet";

    const stats: AdminStat[] = [
      {
        label: "Total Questions",
        value: manifest.totalQuestions.toLocaleString(),
        hint: `${manifest.mcqTotal.toLocaleString()} MCQ · ${manifest.writtenTotal.toLocaleString()} written`,
      },
      {
        label: "Subjects",
        value: subjects.length.toLocaleString(),
        hint: subjectHint,
      },
      {
        label: "Active Subscriptions",
        value: "—",
        hint: "No subscription table yet",
      },
    ];

    const recentQuestions: AdminRecentQuestion[] = manifest.recentQuestions.map((question) => ({
      id: question.id,
      question: question.question,
      source: question.source,
      topic: question.topic,
      year: question.year,
    }));

    return {
      data: { stats, subjects, recentQuestions },
      error: null,
    };
  } catch (error) {
    return {
      data: EMPTY_DATA,
      error: getErrorMessage(error),
    };
  }
}
