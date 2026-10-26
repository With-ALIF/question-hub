import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminQuestionsView } from "@/components/admin/AdminQuestionsView";
import { getCurrentRole } from "@/lib/auth/roles";
import { searchQuestions } from "@/lib/admin/question-search";
import { sanitizeFilters } from "@/lib/questions/filters";
import {
  getQuestionManifest,
  getQuestionPage,
  isQuestionType,
  type QuestionType,
} from "@/lib/questions/storage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Questions — QuestionBank",
  description: "Browse, filter and verify all questions in QuestionBank Storage.",
};

type AdminQuestionsSearchParams = Promise<{
  subject?: string | string[];
  type?: string | string[];
  page?: string | string[];
  db?: string | string[];
  un?: string | string[];
  year?: string | string[];
  paper?: string | string[];
  chapter?: string | string[];
  topic?: string | string[];
  q?: string | string[];
}>;

function firstValue(value: string | string[] | undefined | null) {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: AdminQuestionsSearchParams;
}) {
  const role = await getCurrentRole();

  if (!role) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const requestedSubject = firstValue(params.subject)?.trim() || "all";
  const requestedType = firstValue(params.type)?.trim() || "all";
  const requestedPage = Number(firstValue(params.page) ?? "1");
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const type: QuestionType = isQuestionType(requestedType) ? requestedType : "all";
  const requestedFilters = sanitizeFilters(params);
  const searchQuery = firstValue(params.q)?.trim() || "";

  // Load manifest for global stats
  const manifest = await getQuestionManifest().catch(() => null);

  // If search query is provided, search across questions by text or ID
  if (searchQuery) {
    const searchResult = await searchQuestions(
      searchQuery,
      requestedSubject === "all" ? undefined : requestedSubject,
      50
    );

    return (
      <AdminQuestionsView
        manifest={manifest}
        subjects={manifest?.subjects ?? []}
        selectedSubject={requestedSubject}
        selectedType={type}
        questions={searchResult.questions}
        page={1}
        pageSize={Math.max(1, searchResult.questions.length)}
        totalPages={1}
        total={searchResult.totalFound}
        facetFilters={null}
        activeFilters={requestedFilters}
        role={role}
      />
    );
  }

  // Load questions for the selected subject and filters
  const result = await getQuestionPage({
    subject: requestedSubject,
    page,
    type,
    filters: requestedFilters,
  });

  return (
    <AdminQuestionsView
      manifest={manifest}
      subjects={result.subjects}
      selectedSubject={result.subject?.slug ?? requestedSubject}
      selectedType={type}
      questions={result.questions}
      page={result.page}
      pageSize={result.pageSize}
      totalPages={result.totalPages}
      total={result.total}
      facetFilters={result.filters}
      activeFilters={result.activeFilters}
      role={role}
    />
  );
}
