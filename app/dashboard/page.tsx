import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Layers, ListChecks, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";
import { getQuestionManifest } from "@/lib/questions/storage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Dashboard — QuestionBank",
  description: "Your account and the live question bank at a glance.",
  openGraph: {
    title: "My Dashboard — QuestionBank",
    description: "Your account and the live question bank at a glance.",
  },
};

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function UserDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  const manifest = await getQuestionManifest().catch(() => null);

  const displayName =
    profile?.full_name?.trim() ||
    (typeof user.user_metadata?.["full_name"] === "string"
      ? user.user_metadata["full_name"]
      : "") ||
    user.email?.split("@")[0] ||
    "there";

  const email = profile?.email ?? user.email ?? "";
  const memberSince = formatDate(profile?.created_at);

  const bankStats = [
    {
      icon: BookOpen,
      label: "Questions in the bank",
      value: manifest ? manifest.totalQuestions.toLocaleString() : null,
    },
    {
      icon: ListChecks,
      label: "MCQ questions",
      value: manifest ? manifest.mcqTotal.toLocaleString() : null,
    },
    {
      icon: Layers,
      label: "Written questions",
      value: manifest ? manifest.writtenTotal.toLocaleString() : null,
    },
    {
      icon: UserRound,
      label: "Subjects",
      value: manifest ? String(manifest.subjects.length) : null,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                Hi, {displayName.split(" ")[0]} 👋
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Here&apos;s your account and the live question bank.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/questions">Browse questions</Link>
              </Button>
              <Button asChild>
                <Link href="/subjects">Practise now</Link>
              </Button>
            </div>
          </div>

          {/* Account — read from qb_profiles / Supabase Auth */}
          <Card className="mt-8">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg">Your account</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p>
                <p className="font-medium text-foreground">{displayName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{email || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Role</p>
                <Badge variant="secondary" className="font-normal capitalize">
                  {profile?.role ?? "user"}
                </Badge>
              </div>
              {memberSince && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Member since</p>
                  <p className="font-medium text-foreground">{memberSince}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Question bank — read from the Storage manifest */}
          <section aria-label="Question bank" className="mt-8">
            <h2 className="font-display text-lg font-semibold text-foreground">Question bank</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {bankStats.map(({ icon: Icon, label, value }) => (
                <Card key={label}>
                  <CardContent className="flex items-center gap-4 pt-5">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-display text-2xl font-bold text-foreground">
                        {value ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {manifest && (
              <p className="mt-3 text-xs text-muted-foreground">
                Updated {new Date(manifest.generatedAt).toLocaleString("en-GB")}.
              </p>
            )}
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}
