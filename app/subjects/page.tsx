import type { Metadata } from "next";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SubjectCard } from "@/components/site/SubjectCard";
import { subjects } from "@/data/mock";

export const metadata: Metadata = {
  title: "Subjects — QuestionBank",
  description:
    "Browse Physics, Chemistry, Biology, Mathematics and ICT chapters with thousands of practice questions.",
  openGraph: {
    title: "Subjects — QuestionBank",
    description:
      "Browse Physics, Chemistry, Biology, Mathematics and ICT chapters with thousands of practice questions.",
  },
};

export default function SubjectsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            All subjects
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Every subject is organised chapter by chapter, so you always know what to practise next.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
