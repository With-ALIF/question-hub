import type { Metadata } from "next";

import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { StorageSubjectCard } from "@/components/site/StorageSubjectCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getQuestionManifest, type QuestionManifest } from "@/lib/questions/storage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Subjects — QuestionBank",
  description:
    "Browse Physics, Chemistry, Biology, Mathematics, ICT and other subjects from the Storage-backed question bank.",
  openGraph: {
    title: "Subjects — QuestionBank",
    description:
      "Browse Physics, Chemistry, Biology, Mathematics, ICT and other subjects from the Storage-backed question bank.",
  },
};

export default async function SubjectsPage() {
  let manifest: QuestionManifest | null = null;
  let error: string | null = null;

  try {
    manifest = await getQuestionManifest();
  } catch (cause) {
    error =
      cause instanceof Error && cause.message
        ? cause.message
        : "Could not read the question manifest from Storage.";
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                All subjects
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                Every subject is available as Storage shards, so only the page you open is
                downloaded. Choose a subject to start practising.
              </p>
            </div>
            {manifest && (
              <Badge variant="outline" className="font-normal">
                {manifest.totalQuestions.toLocaleString()} questions in Storage
              </Badge>
            )}
          </div>

          {error ? (
            <Card className="mt-10 border-dashed">
              <CardContent className="space-y-2 p-6 text-sm">
                <p className="font-semibold text-foreground">Storage subjects are not ready.</p>
                <p className="text-muted-foreground">
                  Run{" "}
                  <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                    node --env-file=.env.local scripts/build-question-shards.mjs
                  </code>{" "}
                  once to generate the manifest and subject shards.
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
      <Footer />
    </div>
  );
}
