import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, CalendarClock, Flame, ListChecks, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { userSummary, userRecentActivity } from "@/data/mock";

export const metadata: Metadata = {
  title: "My Dashboard — QuestionBank",
  description: "Your practice overview: subscription status, progress and recent activity.",
  openGraph: {
    title: "My Dashboard — QuestionBank",
    description: "Your practice overview: subscription status, progress and recent activity.",
  },
};

export default function UserDashboard() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                Hi, {userSummary.name.split(" ")[0]} 👋
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Here&apos;s your practice overview. Keep your {userSummary.streak}-day streak going!
              </p>
            </div>
            <Button asChild>
              <Link href="/subjects">Practise now</Link>
            </Button>
          </div>

          {/* Subscription card */}
          <Card className="mt-8 border-primary/40">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Sparkles className="size-5 text-accent-foreground" aria-hidden="true" />
                  Your plan
                </CardTitle>
                <Badge className="bg-accent text-accent-foreground">{userSummary.plan}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
              <p className="text-muted-foreground">
                Duration: <span className="font-medium text-foreground">{userSummary.planDuration}</span>
              </p>
              <p className="text-muted-foreground">
                Renews on: <span className="font-medium text-foreground">{userSummary.renewsOn}</span>
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/plans">Manage plan</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick stats */}
          <section aria-label="Your progress" className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: ListChecks, label: "Questions solved", value: userSummary.solvedCount },
              { icon: Bookmark, label: "Bookmarked", value: userSummary.bookmarked },
              { icon: Flame, label: "Day streak", value: userSummary.streak },
            ].map(({ icon: Icon, label, value }) => (
              <Card key={label}>
                <CardContent className="flex items-center gap-4 pt-5">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-display text-2xl font-bold text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          {/* Recent activity */}
          <section aria-labelledby="activity-heading" className="mt-10">
            <h2 id="activity-heading" className="font-display text-lg font-semibold text-foreground">
              Recent activity
            </h2>
            <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
              {userRecentActivity.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                  <p className="text-sm text-foreground">{item.text}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="font-normal">{item.subject}</Badge>
                    <CalendarClock className="size-3.5" aria-hidden="true" />
                    {item.time}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            UI prototype — dashboard data is mocked and nothing is saved yet.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
