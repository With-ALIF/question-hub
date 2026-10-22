import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminStat = {
  label: string;
  value: string;
  hint: string;
};

export type AdminSubject = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  chapterCount: number;
};

export type AdminRecentQuestion = {
  id: string;
  question: string;
  source: string | null;
  topic: string | null;
  date: string;
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
    { label: "Total Questions", value: "0", hint: "No questions yet" },
    { label: "Registered Users", value: "0", hint: "No profiles yet" },
    { label: "Active Subscriptions", value: "—", hint: "Not configured yet" },
    { label: "Subjects", value: "0", hint: "No subjects yet" },
  ],
  subjects: [],
  recentQuestions: [],
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

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
    const supabase = createSupabaseAdminClient();

    const [questionCountResult, mcqCountResult, userCountResult, subjectResult, recentResult] =
      await Promise.all([
        supabase
          .from("qb_questions")
          .select("*", { count: "estimated", head: true })
          .eq("is_published", true),
        supabase
          .from("qb_questions")
          .select("*", { count: "estimated", head: true })
          .eq("is_published", true)
          .eq("is_mcq", true),
        supabase.from("qb_profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("qb_subjects")
          .select("id, slug, name, tagline")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("qb_questions")
          .select("id, question_text, source_db, topic_code, created_at")
          .eq("is_published", true)
          .order("external_id", { ascending: false })
          .limit(5),
      ]);

    const firstError =
      questionCountResult.error ??
      mcqCountResult.error ??
      userCountResult.error ??
      subjectResult.error ??
      recentResult.error;

    if (firstError) {
      throw firstError;
    }

    const subjectRows = subjectResult.data ?? [];
    const subjectIds = subjectRows.map((subject) => subject.id);

    const chapterResult =
      subjectIds.length > 0
        ? await supabase
            .from("qb_chapters")
            .select("subject_id")
            .eq("is_active", true)
            .in("subject_id", subjectIds)
        : { data: [], error: null };

    if (chapterResult.error) {
      throw chapterResult.error;
    }

    const chapterCounts = new Map<string, number>();

    for (const chapter of chapterResult.data ?? []) {
      chapterCounts.set(chapter.subject_id, (chapterCounts.get(chapter.subject_id) ?? 0) + 1);
    }

    const totalQuestions = questionCountResult.count ?? 0;
    const mcqQuestions = mcqCountResult.count ?? 0;
    const writtenQuestions = Math.max(0, totalQuestions - mcqQuestions);
    const users = userCountResult.count ?? 0;
    const subjects: AdminSubject[] = subjectRows.map((subject) => ({
      id: subject.id,
      slug: subject.slug,
      name: subject.name,
      tagline: subject.tagline,
      chapterCount: chapterCounts.get(subject.id) ?? 0,
    }));

    const firstSubject = subjects[0];
    const lastSubject = subjects[subjects.length - 1];
    const subjectHint =
      firstSubject && lastSubject
        ? `${firstSubject.name} → ${lastSubject.name}`
        : "No subjects yet";

    const stats: AdminStat[] = [
      {
        label: "Total Questions",
        value: totalQuestions.toLocaleString(),
        hint: `${mcqQuestions.toLocaleString()} MCQ · ${writtenQuestions.toLocaleString()} written (estimated)`,
      },
      {
        label: "Registered Users",
        value: users.toLocaleString(),
        hint: "Live from qb_profiles",
      },
      {
        label: "Active Subscriptions",
        value: "—",
        hint: "No subscription table yet",
      },
      {
        label: "Subjects",
        value: subjects.length.toLocaleString(),
        hint: subjectHint,
      },
    ];

    const recentQuestions: AdminRecentQuestion[] = (recentResult.data ?? []).map((question) => ({
      id: question.id,
      question: question.question_text,
      source: question.source_db,
      topic: question.topic_code,
      date: formatDate(question.created_at),
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
