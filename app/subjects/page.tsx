import type { Metadata } from "next";

import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { StorageSubjectCard } from "@/components/site/StorageSubjectCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";
import { getQuestionManifest, type QuestionManifest } from "@/lib/questions/storage";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  const title = tr("All Subjects — QuestionBank", "সকল বিষয় — QuestionBank");
  const description = tr(
    "Question bank for Physics, Chemistry, Biology, Higher Mathematics, ICT and other subjects.",
    "পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান, উচ্চতর গণিত, আইসিটি ও অন্যান্য বিষয়ের প্রশ্ন ব্যাংক।",
  );
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function SubjectsPage() {
  const user = await getCurrentUser();
  const { tr, num } = await getI18n();
  let manifest: QuestionManifest | null = null;
  let error: string | null = null;

  try {
    manifest = await getQuestionManifest();
  } catch (cause) {
    error =
      cause instanceof Error && cause.message
        ? cause.message
        : tr(
            "Could not read the question manifest from Storage.",
            "স্টোরেজ থেকে প্রশ্ন ম্যানিফেস্ট পড়া যায়নি।",
          );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar initialUser={user} />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {tr("All subjects", "সকল বিষয়")}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                {tr(
                  "Pick a subject from the storage-backed question bank and start practising.",
                  "স্টোরেজ-ব্যাকড প্রশ্ন ব্যাংক থেকে আপনার পছন্দের বিষয় নির্বাচন করে অনুশীলন শুরু করুন।",
                )}
              </p>
            </div>
            {manifest && (
              <Badge variant="outline" className="font-normal text-xs">
                {tr(
                  `${num(manifest.totalQuestions)} total questions`,
                  `${num(manifest.totalQuestions)}টি মোট প্রশ্ন`,
                )}
              </Badge>
            )}
          </div>

          {error ? (
            <Card className="mt-10 border-dashed">
              <CardContent className="space-y-2 p-6 text-sm">
                <p className="font-semibold text-foreground">
                  {tr("Storage subjects are not ready.", "স্টোরেজ বিষয়গুলো এখনো প্রস্তুত নয়।")}
                </p>
                <p className="text-muted-foreground">
                  {tr("Run", "ম্যানিফেস্ট ও সাবজেক্ট শার্ড তৈরি করতে একবার")}{" "}
                  <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                    node --env-file=.env.local scripts/build-question-shards.mjs
                  </code>{" "}
                  {tr(
                    "once to generate the manifest and subject shards.",
                    "কমান্ডটি চালান।",
                  )}
                </p>
                <p className="break-words font-mono text-xs text-destructive">{error}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {manifest?.subjects.map((subject) => (
                <StorageSubjectCard key={subject.slug} subject={subject} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer initialUser={user} />
    </div>
  );
}
