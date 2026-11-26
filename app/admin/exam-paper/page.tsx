import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ExamPaperBuilderView } from "@/components/exam-paper/ExamPaperBuilderView";
import { getCurrentRole } from "@/lib/auth/roles";
import { sanitizeFilters } from "@/lib/questions/filters";
import {
  getQuestionPage,
  isQuestionType,
  type QuestionType,
} from "@/lib/questions/storage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Exam Paper Builder (Admin) — QuestionBank",
  description:
    "Select questions by subject and chapter to build custom 4-set exam papers and solution PDFs with full administrative access.",
};

type SearchParams = Promise<{
  subject?: string | string[];
  type?: string | string[];
  page?: string | string[];
  db?: string | string[];
  un?: string | string[];
  unit?: string | string[];
  set?: string | string[];
  year?: string | string[];
  paper?: string | string[];
  chapter?: string | string[];
  topic?: string | string[];
}>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminExamPaperPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const role = await getCurrentRole();

  if (!role) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const requestedSubject = Array.isArray(params.subject)
    ? params.subject.join(",")
    : (params.subject?.trim() ?? "");
  const requestedType = firstValue(params.type)?.trim() ?? "";
  const requestedPage = Number(firstValue(params.page) ?? "1");
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const type: QuestionType = isQuestionType(requestedType) ? requestedType : "all";
  const requestedFilters = sanitizeFilters(params);
  const effectiveSubject = requestedSubject || "physics";

  // Admins have full access to all questions, databases, and subjects with no subscription restrictions
  const result = await getQuestionPage({
    subject: effectiveSubject,
    page,
    type,
    filters: requestedFilters,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AdminSidebar currentPath="/admin/exam-paper" role={role} />
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          {result ? (
            <ExamPaperBuilderView
              questions={result.questions}
              subjects={result.subjects}
              currentSubject={result.subject}
              currentType={result.type}
              page={result.page}
              pageSize={result.pageSize}
              totalPages={result.totalPages}
              total={result.total}
              filters={result.filters}
              activeFilters={result.activeFilters}
              canRevealAnswer={true}
              canViewExplanation={true}
              basePath="/admin/exam-paper"
              isAdmin={true}
            />
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Unable to load question bank data.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
