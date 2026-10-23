import type { Metadata } from "next";

import { HomePage, type RecentQuestion } from "@/components/site/HomePage";
import { getSubjects } from "@/lib/questions/catalog";
import { getQuestionManifest } from "@/lib/questions/storage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "QuestionBank — Practice Questions for Every Subject",
  description:
    "Search subject-wise questions across Physics, Chemistry, Biology, Mathematics, ICT and more. Browse subjects and pick a plan.",
  openGraph: {
    title: "QuestionBank — Practice Questions for Every Subject",
    description:
      "Search subject-wise questions across Physics, Chemistry, Biology, Mathematics, ICT and more.",
  },
};

export default async function Page() {
  const [subjects, manifest] = await Promise.all([
    getSubjects(),
    getQuestionManifest().catch(() => null),
  ]);

  const recentQuestions: RecentQuestion[] = (manifest?.recentQuestions ?? []).map(
    (question) => ({
      id: question.id,
      question: question.question,
      source: question.source,
      topic: question.topic,
      year: question.year,
    }),
  );

  return (
    <HomePage
      subjects={subjects}
      totalQuestions={manifest?.totalQuestions}
      mcqTotal={manifest?.mcqTotal}
      recentQuestions={recentQuestions}
    />
  );
}
