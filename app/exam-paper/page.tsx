import type { Metadata } from "next";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { getCurrentUser } from "@/lib/auth/session";
import { ExamPaperBuilderView } from "@/components/exam-paper/ExamPaperBuilderView";
import {
  getQuestionPage,
  isQuestionType,
  type QuestionType,
} from "@/lib/questions/storage";
import { sanitizeFilters } from "@/lib/questions/filters";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  return {
    title: tr(
      "Exam Paper Builder — QuestionBank",
      "পরীক্ষাপত্র তৈরি (Exam Paper Builder) — QuestionBank",
    ),
    description: tr(
      "Select questions by subject and chapter to build custom 4-set exam papers and solution PDFs.",
      "বিষয় ও অধ্যায় ভিত্তিক প্রশ্ন সিলেক্ট করে কাস্টম ৪-সেট প্রশ্নপত্র ও সমাধান PDF তৈরি করুন।",
    ),
  };
}

type SearchParams = Promise<{
  subject?: string | string[];
  type?: string | string[];
  page?: string | string[];
  db?: string | string[];
  un?: string | string[];
  year?: string | string[];
  paper?: string | string[];
  chapter?: string | string[];
  topic?: string | string[];
}>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ExamPaperPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const requestedSubject = Array.isArray(params.subject)
    ? params.subject.join(",")
    : (params.subject?.trim() ?? "");
  const requestedType = firstValue(params.type)?.trim() ?? "";
  const requestedPage = Number(firstValue(params.page) ?? "1");
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const type: QuestionType = isQuestionType(requestedType) ? requestedType : "all";
  const requestedFilters = sanitizeFilters(params);

  const result = await getQuestionPage({
    subject: requestedSubject || "physics",
    page,
    type,
    filters: requestedFilters,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar initialUser={user} />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
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
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
