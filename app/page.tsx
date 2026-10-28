import type { Metadata } from "next";

import { HomePage, type RecentQuestion } from "@/components/site/HomePage";
import { getCurrentUser } from "@/lib/auth/session";
import { getSubjects } from "@/lib/questions/catalog";
import { getQuestionManifest } from "@/lib/questions/storage";
import { getPaymentNumbers } from "@/lib/payments/server";
import { getI18n } from "@/lib/i18n/server";
import { getHomeSlideUrls } from "@/lib/home-slides";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  const title = tr(
    "QuestionBank — Practice Questions for Every Subject",
    "QuestionBank — সব বিষয়ের প্রশ্ন অনুশীলন",
  );
  const description = tr(
    "Search subject-wise questions across Physics, Chemistry, Biology, Mathematics, ICT and more. Browse subjects and pick a plan.",
    "পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান, উচ্চতর গণিত, আইসিটি ও অন্যান্য বিষয়ের প্রশ্ন খুঁজুন। বিষয় ঘুরে দেখুন এবং প্ল্যান বেছে নিন।",
  );
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function Page() {
  const [subjects, manifest, slides, user] = await Promise.all([
    getSubjects(),
    getQuestionManifest().catch(() => null),
    getHomeSlideUrls(),
    getCurrentUser(),
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
      slides={slides}
      signedIn={Boolean(user)}
      paymentNumbers={getPaymentNumbers()}
    />
  );
}
